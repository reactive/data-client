jest.mock(
  'next/navigation',
  () => ({ useServerInsertedHTML: () => undefined }),
  { virtual: true },
);

import {
  Controller,
  __INTERNAL__,
  actions,
  createReducer,
  initialState,
} from '@data-client/core';
import type { State, StateDelta } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import React, { StrictMode, Suspense, version } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import PlainDataProvider from '../../../../components/DataProvider';
import useCache from '../../../../hooks/useCache';
import useController from '../../../../hooks/useController';
import useSuspense from '../../../../hooks/useSuspense';
import { NetworkManager } from '../../../../managers';
import NextDataProvider from '../DataProvider';
import { BASELINE_ID, getDeltaQueue } from '../deltaQueue';
import { getSnapshotStore } from '../snapshotStore';

const { diffState } = __INTERNAL__;

class Todo extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}
const fetchTodo = jest.fn(async ({ id }: { id: string }) => ({
  id,
  title: `todo ${id}`,
}));
const getTodo = new Endpoint(fetchTodo, { schema: Todo, name: 'getTodo' });

const reducer = createReducer(new Controller());
const setTodo = (state: State<unknown>, id: string) =>
  reducer(
    state,
    actions.createSetResponse(getTodo, {
      args: [{ id }],
      response: { id, title: `todo ${id}` },
    }),
  );
const transport = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const tick = (ms = 30) => new Promise(resolve => setTimeout(resolve, ms));
/** React reveals content at most 300ms after it showed a fallback */
const REVEAL = 500;

type GatePromise = Promise<void> & { done?: boolean; release: () => void };
function makeGate(open = false): GatePromise {
  let release!: () => void;
  const promise: GatePromise = Object.assign(
    new Promise<void>(resolve => {
      release = () => {
        promise.done = true;
        resolve();
      };
    }),
    { done: open, release: () => undefined },
  );
  promise.release = release;
  return promise;
}
/** Suspends until released; resolved during server rendering */
function Gate({
  promise,
  children,
}: {
  promise: GatePromise;
  children: React.ReactNode;
}) {
  if (!promise.done) throw promise;
  return <>{children}</>;
}

function TodoView({ id }: { id: string }) {
  const todo = useSuspense(getTodo, { id });
  return <p data-id={id}>{todo.title}</p>;
}
let controller: Controller | undefined;
/** Observes the live store outside any boundary without affecting the HTML */
let liveTitle: string | undefined;
function Probe() {
  controller = useController();
  liveTitle = useCache(getTodo, { id: '1' })?.title;
  return null;
}

/** What the browser does when a streamed delta script executes */
function streamDelta(delta: StateDelta) {
  const queue = getDeltaQueue();
  queue.push(delta);
  queue.onDelta?.(delta);
}

function installBaseline(state: State<unknown>) {
  const script = document.createElement('script');
  script.id = BASELINE_ID;
  script.type = 'application/json';
  script.textContent = JSON.stringify(state);
  document.head.appendChild(script);
}

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeHydration = LegacyReact ? describe.skip : describe;

describeHydration('Next.js DataProvider hydration', () => {
  let container: HTMLDivElement;
  let errors: string[];
  let consoleError: jest.SpyInstance;
  let previousActEnv: unknown;

  // server timeline: empty shell -> todo 0 boundary -> todo 1 boundary
  const s0 = initialState;
  const s1 = setTodo(s0, '0');
  const s2 = setTodo(s1, '1');
  const delta1 = transport(diffState(s0, s1)!);
  const delta2 = transport(diffState(s1, s2)!);

  beforeAll(async () => {
    previousActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    // let the lazy dev tools button load so renderToString never suspends
    renderToString(
      <PlainDataProvider>
        <div />
      </PlainDataProvider>,
    );
    await tick(0);
  });
  afterAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnv;
  });
  beforeEach(() => {
    fetchTodo.mockClear();
    controller = undefined;
    liveTitle = undefined;
    errors = [];
    consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((...args) => errors.push(args.join(' ')));
    container = document.createElement('div');
    document.body.appendChild(container);
    delete (globalThis as any).__DATA_CLIENT_DELTAS__;
    document.getElementById(BASELINE_ID)?.remove();
  });
  afterEach(() => {
    consoleError.mockRestore();
    container.remove();
  });

  const Page = ({ gate }: { gate: GatePromise }) => (
    <>
      <Probe />
      <Suspense fallback="loading 0">
        <TodoView id="0" />
      </Suspense>
      <Suspense fallback="loading 1">
        <Gate promise={gate}>
          <TodoView id="1" />
        </Gate>
      </Suspense>
    </>
  );

  /** The server rendered both boundaries, the second one from s2 */
  function serverHTML() {
    return renderToString(
      <PlainDataProvider initialState={s2}>
        <Page gate={makeGate(true)} />
      </PlainDataProvider>,
    );
  }

  function hydrate(gate: GatePromise, strict = false) {
    const tree = (
      <NextDataProvider>
        <Page gate={gate} />
      </NextDataProvider>
    );
    return hydrateRoot(
      container,
      strict ? <StrictMode>{tree}</StrictMode> : tree,
      {
        onRecoverableError: e =>
          errors.push(`recoverable: ${(e as Error).message}`),
      },
    );
  }

  const text = (selector: string) =>
    container.querySelector(selector)?.textContent;

  async function streamsIntoDehydratedBoundary(strict: boolean) {
    container.innerHTML = serverHTML();
    const serverNode = container.querySelector('[data-id="1"]')!;
    (serverNode as any).__server = true;
    installBaseline(s0);
    streamDelta(delta1);

    const gate = makeGate();
    hydrate(gate, strict);
    await tick();
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(liveTitle).toBeUndefined();

    // the second boundary's delta script runs while it is still dehydrated
    streamDelta(delta2);
    // flushSync: the live store agrees before the parser reaches the boundary
    expect(liveTitle).toBe('todo 1');
    expect(getSnapshotStore().state.entities.Todo).toHaveProperty('1');

    gate.release();
    await tick();
    const hydrated = container.querySelector('[data-id="1"]')!;
    expect(hydrated.textContent).toBe('todo 1');
    expect((hydrated as any).__server).toBe(true);
    expect(errors).toEqual([]);
    expect(fetchTodo).not.toHaveBeenCalled();
  }

  it('applies deltas that stream in while a boundary is dehydrated', () =>
    streamsIntoDehydratedBoundary(false));

  it('does the same under StrictMode', () =>
    streamsIntoDehydratedBoundary(true));

  it('folds deltas queued before hydration into the initial state', async () => {
    container.innerHTML = serverHTML();
    installBaseline(s0);
    streamDelta(delta1);
    streamDelta(delta2);
    hydrate(makeGate(true));
    await tick();
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(liveTitle).toBe('todo 1');
    expect(errors).toEqual([]);
    expect(fetchTodo).not.toHaveBeenCalled();
  });

  it('drops server deltas after the client reset its store', async () => {
    container.innerHTML = serverHTML();
    installBaseline(s1);
    const gate = makeGate();
    hydrate(gate);
    await tick();
    controller!.resetEntireStore();
    await tick();
    streamDelta(delta2);
    expect(liveTitle).toBeUndefined();
    gate.release();
    await tick(REVEAL);
    // hydrates against the snapshot the HTML came from, then refetches once
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(errors).toEqual([]);
    expect(fetchTodo.mock.calls.map(([args]) => args.id)).toEqual(['0', '1']);
  });

  it('refetches exactly once when a delta arrives after its boundary hydrated', async () => {
    container.innerHTML = serverHTML();
    installBaseline(s1);
    hydrate(makeGate(true));
    await tick(100);
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(fetchTodo).toHaveBeenCalledTimes(1);
    streamDelta(delta2);
    await tick();
    expect(fetchTodo).toHaveBeenCalledTimes(1);
    expect(errors).toEqual([]);
  });

  it('renders immediately without a baseline once the document has loaded', async () => {
    createRoot(container).render(
      <NextDataProvider>
        <Suspense fallback="loading">
          <TodoView id="1" />
        </Suspense>
      </NextDataProvider>,
    );
    await tick(REVEAL);
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(fetchTodo).toHaveBeenCalledTimes(1);
    expect(errors).toEqual([]);
  });

  it('waits for the baseline while the document is still loading', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    let thrown: unknown;
    try {
      getSnapshotStore();
    } catch (e) {
      thrown = e;
    } finally {
      delete (document as any).readyState;
    }
    expect(thrown).toBeInstanceOf(Promise);
    installBaseline(s1);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await thrown;
    expect(getSnapshotStore().state.entities.Todo).toHaveProperty('0');
  });

  it('keeps the receiver when a delta ends the wait before DOMContentLoaded', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    let thrown: Promise<void> | undefined;
    try {
      getSnapshotStore();
    } catch (e) {
      thrown = e as Promise<void>;
    }
    // the first delta script runs before the document finishes parsing
    installBaseline(s0);
    streamDelta(delta1);
    await thrown;
    const queue = getDeltaQueue();
    expect(queue.pending).toBeUndefined();
    delete (document as any).readyState;
    expect(getSnapshotStore().state.entities.Todo).toHaveProperty('0');

    const receiver = jest.fn();
    queue.onDelta = receiver;
    document.dispatchEvent(new Event('DOMContentLoaded'));
    streamDelta(delta2);
    expect(queue.onDelta).toBe(receiver);
    expect(receiver).toHaveBeenCalledWith(delta2);
  });

  it('resolves a managers factory once on the client', async () => {
    const factory = jest.fn(() => [new NetworkManager()]);
    container.innerHTML = renderToString(
      <PlainDataProvider initialState={s1} managers={factory()}>
        <Suspense fallback="loading">
          <TodoView id="0" />
        </Suspense>
      </PlainDataProvider>,
    );
    factory.mockClear();
    installBaseline(s1);
    // StrictMode invokes useMemo's calculation twice; the factory must not be
    const root = hydrateRoot(
      container,
      <StrictMode>
        <NextDataProvider managers={factory}>
          <Suspense fallback="loading">
            <TodoView id="0" />
          </Suspense>
        </NextDataProvider>
      </StrictMode>,
    );
    await tick();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(errors).toEqual([]);
    root.unmount();
  });

  it('uses a custom Controller class on the client', async () => {
    class MyController extends Controller {}
    let seen: Controller | undefined;
    function Capture() {
      seen = useController();
      return null;
    }
    createRoot(container).render(
      <NextDataProvider Controller={MyController as typeof Controller}>
        <Capture />
      </NextDataProvider>,
    );
    await tick();
    expect(seen).toBeInstanceOf(MyController);
  });
});
