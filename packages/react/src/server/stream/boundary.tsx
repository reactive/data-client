'use client';
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

import type { Ledger } from './Ledger.js';
import type { ServerLedger } from './ServerLedger.js';
import { StateContext, StoreContext } from '../../context.js';
import type { BoundaryWrap } from '../../context.js';

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

/** Reads StateContext so that context propagation stops here. Returns `children` by reference. */
export function Shield({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  use(StateContext);
  return children as React.ReactElement;
}

/** Browser: pinned snapshot from the hydration render until the join commits */
export function Scope({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const ledger = use(LedgerContext)!;
  const id = useId();
  const hydrating = useHydrating();
  const live = use(StateContext);
  // A boundary the server rendered waits for its pin while the stream is open.
  // `use()` runs on every hydration render, not only the one that suspends:
  // React warns when a mount that suspended in `use()` finishes without it.
  // A settled `whenPin()` carries its status, so this does not suspend again.
  let rev: number | null = null;
  if (hydrating) {
    use(ledger.whenPin(id));
    rev = ledger.pin(id) ?? null;
  }
  // The holder, not the snapshot, is the state. Emptying it frees the snapshot
  // from this fiber and from its alternate.
  const [holder] = useState<PinHolder>(() => ({
    state: rev == null ? null : ledger.snapshot(rev),
    live,
    views: new WeakMap(),
  }));
  const [joined, setJoined] = useState(holder.state === null);
  useLayoutEffect(() => {
    ledger.commit(id);
  }, [ledger, id]);
  useEffect(() => {
    if (joined) {
      holder.state = null;
      holder.live = null;
      holder.views = new WeakMap();
    } else startTransition(() => setJoined(true));
  }, [joined, holder]);
  return (
    <StateContext.Provider
      value={joined ? live : (pinnedView(holder, live) ?? live)}
    >
      {children}
    </StateContext.Provider>
  );
}

interface PinHolder {
  state: object | null;
  /** Outer state of the hydration render */
  live: object | null;
  views: WeakMap<object, object>;
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
function pinnedView(holder: PinHolder, live: object): any {
  if (holder.state === null || live === holder.live) return holder.state;
  let view = holder.views.get(live);
  if (!view) {
    view = { ...holder.state };
    holder.views.set(live, view);
  }
  return view;
}

/**
 * Server: provides `ledger.scope(useId())` as StoreContext.
 * Same position and same `useId` call as Scope.
 */
export function ServerScope({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const ledger = use(ServerLedgerContext)!;
  const id = useId();
  return (
    <StoreContext.Provider value={ledger.scope(id)}>
      {children}
    </StoreContext.Provider>
  );
}

/** Module constants. A provider passes them as they are, never a new function. */
export const clientWrap: BoundaryWrap = (suspenseProps, content) => (
  <Shield>
    <Suspense {...suspenseProps}>
      <Scope>{content}</Scope>
    </Suspense>
  </Shield>
);
export const serverWrap: BoundaryWrap = (suspenseProps, content) => (
  <Shield>
    <Suspense {...suspenseProps}>
      <ServerScope>{content}</ServerScope>
    </Suspense>
  </Shield>
);
