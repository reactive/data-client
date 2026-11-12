'use client';
import type { State } from '@data-client/core';
import React, {
  Suspense,
  createContext,
  startTransition,
  use,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

import type { Ledger } from './Ledger.js';
import type { ScopedStore, ServerLedger } from './ServerLedger.js';
import { BoundaryContext } from '../../components/BoundaryContext.js';
import type { BoundaryWrap } from '../../components/BoundaryContext.js';
import { StateContext, StoreContext } from '../../context.js';

/** Ledger of the document (browser) */
export const LedgerContext: React.Context<Ledger | null> =
  createContext<Ledger | null>(null);
/** Ledger of the request (server) */
export const ServerLedgerContext: React.Context<ServerLedger | null> =
  createContext<ServerLedger | null>(null);

const TOKEN = 1;
const neverNotify = () => () => {};
const getToken = () => TOKEN;

/** True only on a render that hydrates server HTML. Never notifies. */
export function useHydrating(): boolean {
  let hydrating = false;
  // React reads the server snapshot only while it hydrates; both snapshots are
  // the same constant, so the store never looks torn and never re-renders
  useSyncExternalStore(neverNotify, getToken, () => {
    hydrating = true;
    return TOKEN;
  });
  return hydrating;
}

type SuspenseProps = Parameters<BoundaryWrap>[0];

/** One AsyncBoundary's identity and progress, shared by its Shield and its Scope */
export interface BoundaryCell {
  /** `useId()` of the boundary, outside its Suspense; the server's pin key */
  readonly id: string;
  /** The boundary itself mounted by hydrating server HTML */
  readonly hydrated: boolean;
}

/** The boundary's cell, created at mount. Call outside the boundary's Suspense. */
export function useBoundaryCell(): BoundaryCell {
  const id = useId();
  const hydrating = useHydrating();
  const [cell] = useState<BoundaryCell>(() => ({ id, hydrated: hydrating }));
  return cell;
}

/** Browser: the Suspense of an AsyncBoundary under `StreamProvider` */
export function Boundary({
  suspenseProps,
  children,
}: {
  suspenseProps: SuspenseProps;
  children: ReactNode;
}): React.ReactElement {
  const cell = useBoundaryCell();
  // No fiber may sit between the Shield and the Suspense
  return (
    <Shield cell={cell}>
      <Suspense {...suspenseProps}>
        <Scope cell={cell}>{children}</Scope>
      </Suspense>
    </Shield>
  );
}

/**
 * When its boundary hydrated, reads StateContext so that context propagation
 * stops here. Returns `children` by reference.
 */
export function Shield({
  cell,
  children,
}: {
  cell: BoundaryCell;
  children: ReactNode;
}): React.ReactElement {
  if (cell.hydrated) use(StateContext);
  return children as React.ReactElement;
}

/**
 * Browser: a scope that hydrated on a pin provides the pinned snapshot until its
 * join commits, and the outer state after. Any other scope renders `children`.
 */
export function Scope({
  cell,
  children,
}: {
  cell: BoundaryCell;
  children: ReactNode;
}): React.ReactElement {
  const ledger = use(LedgerContext)!;
  const hydrating = useHydrating();
  // A boundary the server rendered waits for its pin while the stream is open.
  // `use()` runs on every hydration render, not only the one that suspends:
  // React warns when a mount that suspended in `use()` finishes without it.
  // A settled `whenPin()` carries its status, so this does not suspend again.
  let rev: number | undefined;
  if (hydrating) {
    use(ledger.whenPin(cell.id));
    rev = ledger.pin(cell.id);
  }
  // Decided at mount. The holder, not the snapshot, is the state: emptying it
  // frees the snapshot from this fiber and from its alternate.
  const mountLive = rev === undefined ? null : use(StateContext);
  const [holder] = useState<PinHolder | null>(() =>
    rev === undefined ? null : (
      { state: ledger.snapshot(rev), live: mountLive, views: new WeakMap() }
    ),
  );
  const [joined, setJoined] = useState(false);
  const [mountHydrated] = useState(hydrating);
  useLayoutEffect(() => {
    if (cell.hydrated) ledger.commit(cell.id, mountHydrated);
  }, [cell, ledger, mountHydrated]);
  useEffect(() => {
    if (!holder) return;
    if (joined) {
      holder.state = null;
      holder.live = null;
      holder.views = new WeakMap();
    } else startTransition(() => setJoined(true));
  }, [holder, joined]);
  if (holder === null) return children as React.ReactElement;
  const live = use(StateContext);
  return (
    <StateContext.Provider
      value={joined ? live : (pinnedView(holder, live) ?? live)}
    >
      {children}
    </StateContext.Provider>
  );
}

interface PinHolder {
  state: State<unknown> | null;
  /** Outer state of the hydration render */
  live: State<unknown> | null;
  views: WeakMap<State<unknown>, State<unknown>>;
}

/**
 * The pinned snapshot, with a new identity for each outer state.
 *
 * A Shield inside this scope must see its value change whenever the outer
 * state changes. When a consumer React visits reads an unchanged value, React
 * reuses its last output and propagates every changed provider above it, even
 * one this scope hides, starting from its children. That wakes a dehydrated
 * boundary below the Shield.
 */
function pinnedView(
  holder: PinHolder,
  live: State<unknown>,
): State<unknown> | null {
  if (holder.state === null || live === holder.live) return holder.state;
  let view = holder.views.get(live);
  if (!view) {
    view = { ...holder.state };
    holder.views.set(live, view);
  }
  return view;
}

/** Server: the boundary's id, and its parent's from the scoped store above */
export function ServerBoundary({
  suspenseProps,
  children,
}: {
  suspenseProps: SuspenseProps;
  children: ReactNode;
}): React.ReactElement {
  const id = useId();
  const parent = (use(StoreContext) as Partial<ScopedStore>).boundaryId;
  const [cell] = useState(() => ({ id, parent, hydrated: false }));
  // The browser never hydrates a fallback: the content replaces it, or React
  // renders it on the client. A boundary inside one must not pin.
  const fallback =
    suspenseProps.fallback == null ?
      suspenseProps
    : {
        fallback: (
          <BoundaryContext.Provider value={null}>
            {suspenseProps.fallback}
          </BoundaryContext.Provider>
        ),
      };
  return (
    <Shield cell={cell}>
      <Suspense {...fallback}>
        <ServerScope cell={cell}>{children}</ServerScope>
      </Suspense>
    </Shield>
  );
}

/** Server: provides the boundary's scoped store, which pins its revision */
export function ServerScope({
  cell,
  children,
}: {
  cell: { id: string; parent?: string };
  children: ReactNode;
}): React.ReactElement {
  const ledger = use(ServerLedgerContext)!;
  return (
    <StoreContext.Provider value={ledger.scope(cell.id, cell.parent)}>
      {children}
    </StoreContext.Provider>
  );
}

/** Module constants. A provider passes them as they are, never a new function. */
export const clientWrap: BoundaryWrap = (suspenseProps, content) => (
  <Boundary suspenseProps={suspenseProps}>{content}</Boundary>
);
export const serverWrap: BoundaryWrap = (suspenseProps, content) => (
  <ServerBoundary suspenseProps={suspenseProps}>{content}</ServerBoundary>
);
