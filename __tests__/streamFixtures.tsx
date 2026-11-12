/**
 * The streamed page the `server/stream` tests share. Each half of a split test
 * requires this module in its own module graph, so the server and the browser
 * build the same tree from their own copies of React and the library.
 */
import React, {
  Activity,
  StrictMode,
  Suspense,
  lazy,
  memo,
  startTransition,
  use,
  useId,
  useLayoutEffect,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { Endpoint, Entity } from '@data-client/endpoint';
import {
  AsyncBoundary,
  DataProvider,
  StateContext,
  getDefaultManagers,
  useCache,
  useController,
  useSuspense,
} from '@data-client/react';
import type { Controller, Manager } from '@data-client/react';

import type { Step } from './streamingHarness';
import {
  BoundaryContext,
  type BoundaryWrap,
} from '../packages/react/src/components/BoundaryContext';
import {
  LedgerContext,
  Scope,
  Shield,
  StreamManager,
  StreamProvider,
  clientWrap,
  createServerStream,
  getLedger,
  useHydrating,
} from '../packages/react/src/server/stream';
import type { Ledger } from '../packages/react/src/server/stream';

export class Todo extends Entity {
  id = '';
  title = '';
  static key = 'Todo';
}

export type TodoData = { id: string; title: string };
export type FetchImpl = (name: string, params: any) => Promise<any>;

export function makeEndpoints(fetchImpl: FetchImpl) {
  return {
    getTodo: new Endpoint(
      (params: { id: string }) => fetchImpl('getTodo', params),
      { schema: Todo, name: 'getTodo' },
    ),
    getList: new Endpoint(
      (params: { group: string }) => fetchImpl('getList', params),
      { schema: [Todo], name: 'getList' },
    ),
    getValue: new Endpoint(
      (params: { name: string }) => fetchImpl('getValue', params),
      { name: 'getValue' },
    ),
  };
}
export type Endpoints = ReturnType<typeof makeEndpoints>;

export interface PageLog {
  /** Reader renders, by island name */
  renders: string[];
  /** Reader layout effects, by island name */
  commits: string[];
  /** Reader layout effects, as `name=text` of what committed */
  texts?: string[];
  /** Reader layout effects: the `StateContext` value each commit read, held weakly */
  states?: Record<string, WeakRef<object>[]>;
  /** Every action the client store's middleware saw */
  actions?: { type: string; [k: string]: any }[];
}

/** An `<Activity>` the test hides and shows */
export interface ActivityHandle {
  initial?: 'visible' | 'hidden';
  current?: (mode: 'visible' | 'hidden') => void;
}
export function Toggle({
  handle,
  children,
}: {
  handle: ActivityHandle;
  children: ReactNode;
}) {
  const [mode, setMode] = useState(handle.initial ?? 'visible');
  handle.current = setMode;
  return <Activity mode={mode}>{children}</Activity>;
}

/** Records every action into `log.actions` */
export function actionRecorder(log: PageLog): Manager {
  return {
    middleware: () => next => action => {
      log.actions?.push(action);
      return next(action);
    },
    cleanup() {},
  };
}

export type WakeKind = 'children' | 'fallback' | 'error' | 'same';

/**
 * A shell probe: shows the todo only a socket writes (`sock`), and `start()`
 * switches it, in a transition, to a reader that suspends until `release()`
 */
export interface LanesHandle {
  start?: () => void;
  release?: () => void;
  /** Browser: island A suspends on this while its todo is `srv-1` */
  holdA?: Promise<void>;
}

/** Client wraps the G1 controls compare */
export type Variant = 'shield' | 'none' | 'scope-only' | 'frozen' | 'held';

export interface PageOptions {
  /** Island B holds a pending inner boundary D */
  nested?: boolean;
  /** Browser: B's code is this lazy's, so B cannot hydrate until it resolves */
  lazyB?: Promise<void>;
  /**
   * Set: B's parent re-renders on `current(kind)` with a new `children` element,
   * a new `fallback` element, a new error prop, or (`same`) the same three
   */
  wakeB?: { current: ((kind?: WakeKind) => void) | undefined };
  /** B's boundary is inside this `<Activity>` */
  activityB?: ActivityHandle;
  /** The provider is inside this `<Activity>` */
  activityAbove?: ActivityHandle;
  /** Browser: the root is `<StrictMode>` */
  strict?: boolean;
  /** The shell holds the lanes probe */
  lanes?: LanesHandle;
  /** B is under a plain `<Suspense>`, not `AsyncBoundary` */
  plainB?: boolean;
  /** Browser: `current()` mounts island N, an `AsyncBoundary` around A's todo, in the shell */
  mountN?: { current?: () => void };
  /** Island V reads `getValue({ name: 'v' })`, which has no schema; resolve it with `resolveValue` */
  valueV?: boolean;
}

function Waiter({ promise }: { promise: Promise<void> }) {
  use(promise);
  return <>+resolved</>;
}

function makeIslands(endpoints: Endpoints, log: PageLog, opts: PageOptions) {
  function useRecord(name: string) {
    log.renders.push(name);
    useLayoutEffect(() => {
      log.commits.push(name);
    }, [name]);
  }
  function IslandA() {
    const todo = useSuspense(endpoints.getTodo, { id: '1' });
    useRecord('a');
    return (
      <p data-testid="a">
        {todo.title}
        {opts.lanes?.holdA && todo.title === 'srv-1' ?
          <Waiter promise={opts.lanes.holdA} />
        : null}
      </p>
    );
  }
  function List({ group }: { group: string }) {
    const todos = useSuspense(endpoints.getList, { group });
    useRecord(group);
    return (
      <ul data-testid={group}>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    );
  }
  function IslandB() {
    return (
      <div data-testid="b-island">
        <List group="b" />
        <input data-testid="b-input" defaultValue="" />
        {opts.nested ?
          <AsyncBoundary fallback={<span>loading d</span>}>
            <List group="d" />
          </AsyncBoundary>
        : null}
      </div>
    );
  }
  const LazyB =
    opts.lazyB ?
      lazy(() => opts.lazyB!.then(() => ({ default: IslandB })))
    : IslandB;
  const bFallback = <span>loading b</span>;
  const bChildren = <LazyB />;
  function BParent() {
    const [wake, setWake] = useState<{ kind: WakeKind; n: number }>({
      kind: 'same',
      n: 0,
    });
    if (opts.wakeB)
      opts.wakeB.current = (kind = 'children') =>
        setWake(w => ({ kind, n: w.n + 1 }));
    return (
      <AsyncBoundary
        fallback={wake.kind === 'fallback' ? <span>loading b</span> : bFallback}
        errorClassName={wake.kind === 'error' ? `error-${wake.n}` : undefined}
      >
        {wake.kind === 'children' ?
          <LazyB />
        : bChildren}
      </AsyncBoundary>
    );
  }
  function IslandV() {
    const value = useSuspense(endpoints.getValue, { name: 'v' });
    useRecord('v');
    return <p data-testid="v">{JSON.stringify(value)}</p>;
  }
  function IslandN() {
    const todo = useSuspense(endpoints.getTodo, { id: '1' });
    useRecord('n');
    return <p data-testid="n">{todo.title}</p>;
  }
  function MountN({ handle }: { handle: { current?: () => void } }) {
    const [on, setOn] = useState(false);
    handle.current = () => setOn(true);
    return on ?
        <AsyncBoundary fallback={<span>loading n</span>}>
          <IslandN />
        </AsyncBoundary>
      : null;
  }
  function LanesProbe({ handle }: { handle: LanesHandle }) {
    const sock = useCache(endpoints.getTodo, { id: 'sock' });
    const [promise, setPromise] = useState<Promise<void> | null>(null);
    handle.start = () => {
      const waiting = deferred<void>();
      handle.release = () => waiting.resolve();
      startTransition(() => setPromise(waiting.promise));
    };
    return (
      <p data-testid="lanes">
        {sock?.title ?? 'none'}
        {promise ?
          <Waiter promise={promise} />
        : null}
      </p>
    );
  }
  const Layout = memo(function Layout() {
    return (
      <div data-testid="layout">
        {opts.lanes ?
          <LanesProbe handle={opts.lanes} />
        : null}
        <AsyncBoundary fallback={<span>loading a</span>}>
          <IslandA />
        </AsyncBoundary>
        {opts.wakeB ?
          <BParent />
        : opts.activityB ?
          <Toggle handle={opts.activityB}>
            <AsyncBoundary fallback={bFallback}>
              <LazyB />
            </AsyncBoundary>
          </Toggle>
        : opts.plainB ?
          <Suspense fallback={bFallback}>
            <LazyB />
          </Suspense>
        : <AsyncBoundary fallback={bFallback}>
            <LazyB />
          </AsyncBoundary>
        }
        <AsyncBoundary fallback={<span>loading c</span>}>
          <List group="c" />
        </AsyncBoundary>
        {opts.mountN ?
          <MountN handle={opts.mountN} />
        : null}
        {opts.valueV ?
          <AsyncBoundary fallback={<span>loading v</span>}>
            <IslandV />
          </AsyncBoundary>
        : null}
      </div>
    );
  });
  return { Layout, IslandB };
}

function ControllerGrab({ into }: { into: { current?: Controller } }) {
  into.current = useController();
  return null;
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}
export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const keyOf = (name: string, params: any) =>
  `${name} ${JSON.stringify(params)}`;

/** Server fetches wait until the test resolves them */
export function makeServerFetch() {
  const pending = new Map<string, Deferred<any>>();
  const get = (key: string) => {
    let d = pending.get(key);
    if (!d) {
      d = deferred();
      pending.set(key, d);
    }
    return d;
  };
  return {
    fetch: ((name, params) => get(keyOf(name, params)).promise) as FetchImpl,
    resolve(name: string, params: any, value: unknown) {
      get(keyOf(name, params)).resolve(value);
    },
  };
}

export function createServerPage(opts: PageOptions = {}) {
  const server = makeServerFetch();
  const endpoints = makeEndpoints(server.fetch);
  const log: PageLog = { renders: [], commits: [] };
  const stream = createServerStream();
  const { Layout } = makeIslands(endpoints, log, opts);
  const controller: { current?: Controller } = {};
  const provider = (
    <stream.Provider>
      <>
        <ControllerGrab into={controller} />
        <Layout />
      </>
    </stream.Provider>
  );
  const element =
    opts.activityAbove ?
      <Toggle handle={opts.activityAbove}>{provider}</Toggle>
    : provider;
  return { element, stream, endpoints, server, log };
}

function FrozenShield({ children }: { children: ReactNode }) {
  const live = use(StateContext);
  const [frozen] = useState(live);
  const [joined, setJoined] = useState(false);
  const [onCommit] = useState(
    () => () => startTransition(() => setJoined(true)),
  );
  return (
    <FrozenCommitContext.Provider value={onCommit}>
      <StateContext.Provider value={joined ? live : frozen}>
        {children}
      </StateContext.Provider>
    </FrozenCommitContext.Provider>
  );
}
const FrozenCommitContext = React.createContext<() => void>(() => {});
function FrozenScope({ children }: { children: ReactNode }) {
  const onCommit = use(FrozenCommitContext);
  useEffect(onCommit, [onCommit]);
  return <Scope>{children}</Scope>;
}

const scopeOnlyWrap: BoundaryWrap = (suspenseProps, content) => (
  <Suspense {...suspenseProps}>
    <Scope>{content}</Scope>
  </Suspense>
);
const frozenWrap: BoundaryWrap = (suspenseProps, content) => (
  <FrozenShield>
    <Suspense {...suspenseProps}>
      <FrozenScope>{content}</FrozenScope>
    </Suspense>
  </FrozenShield>
);

/**
 * A scope that provides its snapshot object itself until the join and never
 * empties it: the same value while the outer state changes. R1's control and
 * `G1/control-nested-same-identity`'s wrap.
 */
function HeldScope({ children }: { children: ReactNode }) {
  const ledger = use(LedgerContext)!;
  const id = useId();
  const hydrating = useHydrating();
  const live = use(StateContext);
  let rev: number | null = null;
  if (hydrating) {
    use(ledger.whenPin(id));
    rev = ledger.pin(id) ?? null;
  }
  const [snapshot] = useState(() =>
    rev == null ? null : ledger.snapshot(rev),
  );
  const [joined, setJoined] = useState(snapshot === null);
  useLayoutEffect(() => {
    ledger.commit(id);
  }, [ledger, id]);
  useEffect(() => {
    if (!joined) startTransition(() => setJoined(true));
  }, [joined]);
  return (
    <StateContext.Provider value={joined ? live : (snapshot ?? live)}>
      {children}
    </StateContext.Provider>
  );
}
export const heldWrap: BoundaryWrap = (suspenseProps, content) => (
  <Shield>
    <Suspense {...suspenseProps}>
      <HeldScope>{content}</HeldScope>
    </Suspense>
  </Shield>
);

/** `StreamProvider` with another wrap, or with no adapter at all */
function VariantProvider({
  variant,
  managers,
  children,
}: {
  variant: Exclude<Variant, 'shield'>;
  managers: () => Manager[];
  children: ReactNode;
}) {
  const [seed] = useState(() => {
    const ledger = getLedger()!;
    const rev = ledger.shellRev ?? ledger.rev;
    return {
      ledger,
      state: ledger.fold(rev),
      managers: () => [new StreamManager(ledger, rev), ...managers()],
    };
  });
  const provider = (
    <DataProvider
      initialState={seed.state}
      managers={seed.managers}
      devButton={null}
    >
      {children}
    </DataProvider>
  );
  if (variant === 'none') return provider;
  return (
    <LedgerContext.Provider value={seed.ledger}>
      <BoundaryContext.Provider
        value={
          variant === 'scope-only' ? scopeOnlyWrap
          : variant === 'held' ?
            heldWrap
          : frozenWrap
        }
      >
        {provider}
      </BoundaryContext.Provider>
    </LedgerContext.Provider>
  );
}

export function createClientPage(
  opts: PageOptions & { variant?: Variant } = {},
) {
  const fetches: string[] = [];
  const endpoints = makeEndpoints((name, params) => {
    fetches.push(keyOf(name, params));
    return new Promise(() => {});
  });
  const log: PageLog = { renders: [], commits: [], actions: [] };
  const { Layout } = makeIslands(endpoints, log, opts);
  const controller: { current?: Controller } = {};
  const managers = () => [
    actionRecorder(log),
    ...getDefaultManagers({ devToolsManager: null }),
  ];
  const body = (
    <>
      <ControllerGrab into={controller} />
      <Layout />
    </>
  );
  const variant = opts.variant ?? 'shield';
  const provider =
    variant === 'shield' ?
      <StreamProvider managers={managers} devButton={null}>
        {body}
      </StreamProvider>
    : <VariantProvider variant={variant} managers={managers}>
        {body}
      </VariantProvider>;
  const above =
    opts.activityAbove ?
      <Toggle handle={opts.activityAbove}>{provider}</Toggle>
    : provider;
  const element = opts.strict ? <StrictMode>{above}</StrictMode> : above;
  return {
    element,
    endpoints,
    log,
    fetches,
    controller,
    ledger: () => getLedger() as Ledger,
  };
}

export const DATA = {
  a: { id: '1', title: 'a@1' },
  b: [
    { id: '1', title: 'a@2' },
    { id: '2', title: 'b2' },
  ],
  c: [{ id: '3', title: 'c3' }],
  d: [{ id: '4', title: 'd4' }],
};

export type ServerPage = ReturnType<typeof createServerPage>;
export type ServerStep = Step<ServerPage>;

export const resolveGroup = (group: 'b' | 'c' | 'd'): ServerStep =>
  Object.assign(
    (page: ServerPage) =>
      page.server.resolve('getList', { group }, DATA[group]),
    { completes: true },
  );

/** Completes island V with this value */
export const resolveValue = (value: unknown): ServerStep =>
  Object.assign(
    (page: ServerPage) => page.server.resolve('getValue', { name: 'v' }, value),
    { completes: true },
  );

/** A server store change that completes no boundary: A's todo gets a new title */
export const serverWrite =
  (k: number): ServerStep =>
  page => {
    page.stream.controller.setResponse(
      page.endpoints.getTodo,
      { id: '1' },
      { id: '1', title: `srv-${k}` },
    );
  };

/**
 * Server half of the page: A's data is in the store before the render, so A is
 * in the shell. After the shell each step runs `gapMs` after the previous one.
 * Default steps: B's data, then C's.
 */
export async function runServerPage(
  opts: PageOptions & {
    steps?: ServerStep[];
    gapMs?: number;
    onAbortable?: (abort: () => void) => void;
  } = {},
) {
  const { captureStream, stepper } =
    require('./streamingHarness') as typeof import('./streamingHarness');
  const page = createServerPage(opts);
  page.server.resolve('getTodo', { id: '1' }, DATA.a);
  await page.stream.controller.fetch(page.endpoints.getTodo, { id: '1' });
  const steps = opts.steps ?? [resolveGroup('b'), resolveGroup('c')];
  const run = stepper(page, steps, opts.gapMs ?? 20);
  const capture = await captureStream(page.element, {
    ledger: page.stream.ledger,
    onAbortable: opts.onAbortable,
    onFlush: run.onFlush,
    releaseAfterShell: [run.release],
  });
  return { page, capture };
}

export { clientWrap };
