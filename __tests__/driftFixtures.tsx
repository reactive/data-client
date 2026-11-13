/**
 * The drift page: island B1 reads a list at revision 1 and island B2 reads one
 * of its rows at revision 2, so the browser's live state is newer than B1's HTML.
 * Each half of a split test requires this module in its own module graph.
 */
import React, {
  Suspense,
  lazy,
  memo,
  use,
  useLayoutEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { Endpoint, Entity } from '@data-client/endpoint';
import {
  AsyncBoundary,
  DataProvider,
  StateContext,
  getDefaultManagers,
  useController,
  useSuspense,
} from '@data-client/react';
import type {
  Controller,
  GCInterface,
  Manager,
  State,
} from '@data-client/react';

import {
  ControllerGrab,
  Toggle,
  countScopedReads,
  heldWrap,
  keyOf,
  makeServerFetch,
} from './streamFixtures';
import type { ActivityHandle, FetchImpl, PageLog } from './streamFixtures';
import type { Step } from './streamingHarness';
import { BoundaryContext } from '../packages/react/src/components/BoundaryContext';
import {
  LedgerContext,
  StreamManager,
  StreamProvider,
  clientWrap,
  createServerStream,
  getLedger,
} from '../packages/react/src/server/stream';
import type { Ledger } from '../packages/react/src/server/stream';

export class Ticker extends Entity {
  id = '';
  price = 0;
  static key = 'Ticker';
}

export const TICKERS = [
  { id: 'BTC', price: 100 },
  { id: 'ETH', price: 10 },
];
export const BTC_2 = { id: 'BTC', price: 101.5 };
/** A ticker the list does not hold */
export const SOL = { id: 'SOL', price: 5 };

export function makeTickerEndpoints(
  fetchImpl: FetchImpl,
  { invalidIfStale, dataExpiryLength }: DriftOptions = {},
) {
  const extra = {
    ...(invalidIfStale !== undefined && { invalidIfStale }),
    ...(dataExpiryLength !== undefined && { dataExpiryLength }),
  };
  return {
    getTickers: new Endpoint(() => fetchImpl('getTickers', {}), {
      schema: [Ticker],
      name: 'getTickers',
      ...extra,
    }),
    getTicker: new Endpoint(
      (params: { id: string }) => fetchImpl('getTicker', params),
      { schema: Ticker, name: 'getTicker', ...extra },
    ),
  };
}
type TickerEndpoints = ReturnType<typeof makeTickerEndpoints>;

/**
 * - `pair`: B1 reads the list, B2 reads BTC.
 * - `nested`: B1 reads the list and holds boundary D, which reads BTC.
 * - `one-boundary`: one boundary holds a list reader and a BTC reader.
 * - `two-fetches`: one boundary holds a list reader and a SOL reader.
 * - `shell-reader`: a reader of the list outside any boundary, and B2.
 * - `controller-reader`: B1 also holds a reader of `useController().getState()`
 *   that waits for `ctrlGate`, and B2.
 * - `trio`: B1, T2 and T3 each read the list in their own boundary, and B2.
 */
export type DriftLayout =
  | 'pair'
  | 'nested'
  | 'one-boundary'
  | 'two-fetches'
  | 'shell-reader'
  | 'controller-reader'
  | 'trio';

export interface DriftOptions {
  layout?: DriftLayout;
  invalidIfStale?: boolean;
  dataExpiryLength?: number;
  /** Browser: B2's code is this lazy's, so B2 cannot hydrate until it resolves */
  lazyB2?: Promise<void>;
  /** Browser: B2 has a sibling in its boundary that suspends on this until it resolves */
  holdB2?: Promise<void> & { done?: boolean };
  /** B1's boundary is inside this `<Activity>` */
  activityB1?: ActivityHandle;
  /** Island H, a BTC reader in its own boundary, is inside this `<Activity>` */
  activityH?: ActivityHandle;
  /** `controller-reader`: the `getState` reader suspends on this until it resolves */
  ctrlGate?: Promise<void> & { done?: boolean };
  /** `pair`: this island is under a plain `<Suspense>`, not `AsyncBoundary` */
  plain?: 'b1' | 'b2';
}

function makeDriftIslands(
  endpoints: TickerEndpoints,
  log: PageLog,
  opts: DriftOptions,
) {
  function useRecord(name: string, text: string) {
    const state = use(StateContext);
    log.renders.push(name);
    useLayoutEffect(() => {
      log.commits.push(name);
      log.texts?.push(`${name}=${text}`);
    }, [name, text]);
    useLayoutEffect(() => {
      if (log.states) (log.states[name] ??= []).push(new WeakRef(state));
    }, [name, state]);
  }
  function TickerList({ name }: { name: string }) {
    const tickers = useSuspense(endpoints.getTickers);
    const rows = tickers.map(t => `${t.id}:${t.price}`);
    useRecord(name, rows.join(''));
    return (
      <ul data-testid={name}>
        {tickers.map((t, i) => (
          <li key={t.id}>{rows[i]}</li>
        ))}
      </ul>
    );
  }
  function TickerOne({ name, id = 'BTC' }: { name: string; id?: string }) {
    const ticker = useSuspense(endpoints.getTicker, { id });
    const text = `${ticker.id}:${ticker.price}`;
    useRecord(name, text);
    return <p data-testid={name}>{text}</p>;
  }
  function CtrlReader() {
    if (opts.ctrlGate && !opts.ctrlGate.done) throw opts.ctrlGate;
    const state = useController().getState();
    const text = `ctrl:${(state.entities.Ticker?.BTC as any)?.price}`;
    log.renders.push('ctrl');
    return <p data-testid="ctrl">{text}</p>;
  }
  function Hold() {
    if (opts.holdB2 && !opts.holdB2.done) throw opts.holdB2;
    return null;
  }
  function B2Content() {
    return (
      <>
        <TickerOne name="b2" />
        <Hold />
      </>
    );
  }
  const LazyB2 =
    opts.lazyB2 ?
      lazy(() => opts.lazyB2!.then(() => ({ default: B2Content })))
    : B2Content;
  const layout = opts.layout ?? 'pair';
  const Layout = memo(function Layout() {
    if (layout === 'nested')
      return (
        <div data-testid="layout">
          <AsyncBoundary fallback={<span>loading b1</span>}>
            <TickerList name="b1" />
            <AsyncBoundary fallback={<span>loading d</span>}>
              <TickerOne name="d" />
            </AsyncBoundary>
          </AsyncBoundary>
        </div>
      );
    if (layout === 'controller-reader')
      return (
        <div data-testid="layout">
          <AsyncBoundary fallback={<span>loading b1</span>}>
            <TickerList name="b1" />
            <CtrlReader />
          </AsyncBoundary>
          <AsyncBoundary fallback={<span>loading b2</span>}>
            <LazyB2 />
          </AsyncBoundary>
        </div>
      );
    if (layout === 'trio')
      return (
        <div data-testid="layout">
          {['b1', 't2', 't3'].map(name => (
            <AsyncBoundary key={name} fallback={<span>loading {name}</span>}>
              <TickerList name={name} />
            </AsyncBoundary>
          ))}
          <AsyncBoundary fallback={<span>loading b2</span>}>
            <LazyB2 />
          </AsyncBoundary>
        </div>
      );
    if (layout === 'one-boundary' || layout === 'two-fetches')
      return (
        <div data-testid="layout">
          <AsyncBoundary fallback={<span>loading b1</span>}>
            <TickerList name="b1" />
            <TickerOne
              name="b2"
              id={layout === 'two-fetches' ? 'SOL' : 'BTC'}
            />
          </AsyncBoundary>
        </div>
      );
    return (
      <div data-testid="layout">
        {layout === 'shell-reader' ?
          <TickerList name="shell" />
        : opts.activityB1 ?
          <Toggle handle={opts.activityB1}>
            <AsyncBoundary fallback={<span>loading b1</span>}>
              <TickerList name="b1" />
            </AsyncBoundary>
          </Toggle>
        : opts.plain === 'b1' ?
          <Suspense fallback={<span>loading b1</span>}>
            <TickerList name="b1" />
          </Suspense>
        : <AsyncBoundary fallback={<span>loading b1</span>}>
            <TickerList name="b1" />
          </AsyncBoundary>
        }
        {opts.plain === 'b2' ?
          <Suspense fallback={<span>loading b2</span>}>
            <LazyB2 />
          </Suspense>
        : <AsyncBoundary fallback={<span>loading b2</span>}>
            <LazyB2 />
          </AsyncBoundary>
        }
        {opts.activityH ?
          <Toggle handle={opts.activityH}>
            <AsyncBoundary fallback={<span>loading h</span>}>
              <TickerOne name="h" />
            </AsyncBoundary>
          </Toggle>
        : null}
      </div>
    );
  });
  return Layout;
}

export type DriftStep = Step<DriftServerPage>;
export const resolveTickers: DriftStep = Object.assign(
  (page: DriftServerPage) => page.server.resolve('getTickers', {}, TICKERS),
  { completes: true },
);
export const resolveBtc: DriftStep = Object.assign(
  (page: DriftServerPage) =>
    page.server.resolve('getTicker', { id: 'BTC' }, BTC_2),
  { completes: true },
);
export const resolveSol: DriftStep = Object.assign(
  (page: DriftServerPage) =>
    page.server.resolve('getTicker', { id: 'SOL' }, SOL),
  { completes: true },
);
/** BTC moves to revision 2 on the server without a fetch */
export const writeBtc: DriftStep = page => {
  page.stream.controller.setResponse(
    page.endpoints.getTicker,
    { id: 'BTC' },
    BTC_2,
  );
};

export function createDriftServerPage(opts: DriftOptions = {}) {
  const server = makeServerFetch();
  const endpoints = makeTickerEndpoints(server.fetch, opts);
  const log: PageLog = { renders: [], commits: [] };
  const stream = createServerStream();
  const reads = countScopedReads(stream.ledger);
  const Layout = makeDriftIslands(endpoints, log, opts);
  const element = (
    <stream.Provider>
      <>
        <ControllerGrab into={{}} />
        <Layout />
      </>
    </stream.Provider>
  );
  return { element, stream, endpoints, server, log, reads };
}
export type DriftServerPage = ReturnType<typeof createDriftServerPage>;

/**
 * Server half: nothing in the shell has data. Default steps: the list resolves
 * (revision 1), then BTC (revision 2), each in its own flush.
 */
export async function runDriftServer(
  opts: DriftOptions & {
    steps?: DriftStep[];
    before?: (page: DriftServerPage) => Promise<void>;
  } = {},
) {
  const { captureStream, stepper } =
    require('./streamingHarness') as typeof import('./streamingHarness');
  const page = createDriftServerPage(opts);
  await opts.before?.(page);
  const steps = opts.steps ?? [resolveTickers, resolveBtc];
  const run = stepper(page, steps, 20);
  const capture = await captureStream(page.element, {
    ledger: page.stream.ledger,
    onFlush: run.onFlush,
    releaseAfterShell: [run.release],
  });
  return { page, capture };
}

/**
 * `aliased`: R5's control. Seeds with the server state at the latest revision and
 * makes every snapshot share that seed's tables.
 * `held`: R1's control wrap.
 */
function ControlProvider({
  variant,
  managers,
  gcPolicy,
  children,
}: {
  variant: 'aliased' | 'held';
  managers: () => Manager[];
  gcPolicy?: GCInterface;
  children: ReactNode;
}) {
  const [seed] = useState(() => {
    const ledger = getLedger()!;
    const rev = variant === 'aliased' ? ledger.rev : (ledger.shellRev ?? 0);
    const state = ledger.fold(rev);
    if (variant === 'aliased') ledger.snapshot = () => ({ ...state });
    return {
      ledger,
      state,
      managers: () => [new StreamManager(ledger, rev), ...managers()],
    };
  });
  return (
    <LedgerContext.Provider value={seed.ledger}>
      <BoundaryContext.Provider
        value={variant === 'held' ? heldWrap : clientWrap}
      >
        <DataProvider
          initialState={seed.state}
          managers={seed.managers}
          gcPolicy={gcPolicy}
          devButton={null}
        >
          {children}
        </DataProvider>
      </BoundaryContext.Provider>
    </LedgerContext.Provider>
  );
}

export function createDriftClientPage(
  opts: DriftOptions & {
    /** No adapter: `DataProvider` with this `initialState` */
    handoff?: State<unknown>;
    variant?: 'shield' | 'aliased' | 'held';
    gcPolicy?: GCInterface;
    /** The root is `<StrictMode>` */
    strict?: boolean;
  } = {},
) {
  const fetches: string[] = [];
  const endpoints = makeTickerEndpoints((name, params) => {
    fetches.push(keyOf(name, params));
    return new Promise(() => {});
  }, opts);
  const log: PageLog = { renders: [], commits: [], texts: [], states: {} };
  const Layout = makeDriftIslands(endpoints, log, opts);
  const controller: { current?: Controller } = {};
  const managers = () => getDefaultManagers({ devToolsManager: null });
  const body: ReactNode = (
    <>
      <ControllerGrab into={controller} />
      <Layout />
    </>
  );
  const provider =
    opts.handoff ?
      <DataProvider
        initialState={opts.handoff}
        managers={managers}
        devButton={null}
      >
        {body}
      </DataProvider>
    : opts.variant === 'aliased' || opts.variant === 'held' ?
      <ControlProvider
        variant={opts.variant}
        managers={managers}
        gcPolicy={opts.gcPolicy}
      >
        {body}
      </ControlProvider>
    : <StreamProvider
        managers={managers}
        gcPolicy={opts.gcPolicy}
        devButton={null}
      >
        {body}
      </StreamProvider>;
  const element =
    opts.strict ? <React.StrictMode>{provider}</React.StrictMode> : provider;
  return {
    element,
    endpoints,
    log,
    fetches,
    controller,
    ledger: () => getLedger() as Ledger,
  };
}
