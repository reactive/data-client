/**
 * The streamed page the `server/stream` tests share. Each half of a split test
 * requires this module in its own module graph, so the server and the browser
 * build the same tree from their own copies of React and the library.
 */
import React, {
  Suspense,
  lazy,
  memo,
  startTransition,
  use,
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
  useController,
  useSuspense,
} from '@data-client/react';
import type { Controller, Manager } from '@data-client/react';

import {
  BoundaryContext,
  type BoundaryWrap,
} from '../packages/react/src/context';
import {
  LedgerContext,
  Scope,
  StreamManager,
  StreamProvider,
  clientWrap,
  createServerStream,
  getLedger,
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
}

/** Client wraps the G1 controls compare */
export type Variant = 'shield' | 'none' | 'scope-only' | 'frozen';

export interface PageOptions {
  /** Island B holds a pending inner boundary D */
  nested?: boolean;
  /** Browser: B's code is this lazy's, so B cannot hydrate until it resolves */
  lazyB?: Promise<void>;
  /** Re-renders B's parent with a new `children` element when set */
  wakeB?: { current: (() => void) | undefined };
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
    return <p data-testid="a">{todo.title}</p>;
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
  function BParent() {
    const [, setTick] = useState(0);
    if (opts.wakeB) opts.wakeB.current = () => setTick(tick => tick + 1);
    return (
      <AsyncBoundary fallback={bFallback}>
        <LazyB />
      </AsyncBoundary>
    );
  }
  const Layout = memo(function Layout() {
    return (
      <div data-testid="layout">
        <AsyncBoundary fallback={<span>loading a</span>}>
          <IslandA />
        </AsyncBoundary>
        {opts.wakeB ?
          <BParent />
        : <AsyncBoundary fallback={bFallback}>
            <LazyB />
          </AsyncBoundary>
        }
        <AsyncBoundary fallback={<span>loading c</span>}>
          <List group="c" />
        </AsyncBoundary>
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
  const element = (
    <stream.Provider>
      <>
        <ControllerGrab into={controller} />
        <Layout />
      </>
    </stream.Provider>
  );
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
        value={variant === 'scope-only' ? scopeOnlyWrap : frozenWrap}
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
  const log: PageLog = { renders: [], commits: [] };
  const { Layout } = makeIslands(endpoints, log, opts);
  const controller: { current?: Controller } = {};
  const managers = () => getDefaultManagers({ devToolsManager: null });
  const body = (
    <>
      <ControllerGrab into={controller} />
      <Layout />
    </>
  );
  const variant = opts.variant ?? 'shield';
  const element =
    variant === 'shield' ?
      <StreamProvider managers={managers} devButton={null}>
        {body}
      </StreamProvider>
    : <VariantProvider variant={variant} managers={managers}>
        {body}
      </VariantProvider>;
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
export type ServerStep = (page: ServerPage) => void;

export const resolveGroup =
  (group: 'b' | 'c' | 'd'): ServerStep =>
  page =>
    page.server.resolve('getList', { group }, DATA[group]);

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
  const { captureStream } =
    require('./streamingHarness') as typeof import('./streamingHarness');
  const page = createServerPage(opts);
  page.server.resolve('getTodo', { id: '1' }, DATA.a);
  await page.stream.controller.fetch(page.endpoints.getTodo, { id: '1' });
  const steps = opts.steps ?? [resolveGroup('b'), resolveGroup('c')];
  const gapMs = opts.gapMs ?? 20;
  const capture = await captureStream(page.element, {
    ledger: page.stream.ledger,
    onAbortable: opts.onAbortable,
    releaseAfterShell: [
      () => {
        steps.forEach((step, i) =>
          setTimeout(() => step(page), gapMs * (i + 1)),
        );
      },
    ],
  });
  return { page, capture };
}

export { clientWrap };
