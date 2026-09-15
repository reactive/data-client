/**
 * Lane A contract (follow-up after PR 4090 / Lane B).
 *
 * Encodes fold-on-script + per-key waiters + RSC-first zero-refetch.
 * Expected to fail on 4090 head: miss still FETCHes; HYDRATE is layout-effect
 * only; there is no stream-close leftover waiter.
 *
 * Do not merge these tests onto Lane B. They run on the ReactDOM CI matrix
 * (^18 + latest; skipped on 16/17 like the other hydration suites).
 */
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
import React, { Suspense, version } from 'react';
import { renderToString } from 'react-dom/server';

import PlainDataProvider from '../../../../components/DataProvider';
import useCache from '../../../../hooks/useCache';
import useSuspense from '../../../../hooks/useSuspense';
import NextDataProvider from '../DataProvider';
import { BASELINE_ID, getDeltaQueue } from '../deltaQueue';

const { diffState } = __INTERNAL__;

class Todo extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}

const events: string[] = [];
const fetchTodo = jest.fn(async ({ id }: { id: string }) => {
  events.push(`fetch:${id}`);
  return { id, title: `todo ${id}` };
});
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
  events.push(`render:${id}`);
  const todo = useSuspense(getTodo, { id });
  events.push(`dom:${id}`);
  return <p data-id={id}>{todo.title}</p>;
}

let live0: string | undefined;
let live1: string | undefined;
function Probe() {
  live0 = useCache(getTodo, { id: '0' })?.title;
  live1 = useCache(getTodo, { id: '1' })?.title;
  return null;
}

function streamDelta(label: string, delta: StateDelta) {
  events.push(label);
  const queue = getDeltaQueue();
  queue.push(delta);
  queue.onDelta?.(delta);
}

/** Stand-in for the adapter close sentinel (HTML flush / pipe-finish).
 * Not DOMContentLoaded — that stays an interim, not this contract. */
function signalStreamClose() {
  events.push('close');
  (
    getDeltaQueue() as ReturnType<typeof getDeltaQueue> & {
      close?: () => void;
    }
  ).close?.();
}

function installBaseline(state: State<unknown>) {
  const script = document.createElement('script');
  script.id = BASELINE_ID;
  script.type = 'application/json';
  script.textContent = JSON.stringify(state);
  document.head.appendChild(script);
}

function fetchIds() {
  return fetchTodo.mock.calls.map(([args]) => (args as { id: string }).id);
}

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeLaneA = LegacyReact ? describe.skip : describe;
let hydrateRoot!: typeof import('react-dom/client').hydrateRoot;
if (!LegacyReact) {
  ({ hydrateRoot } = jest.requireActual('react-dom/client'));
}

describeLaneA('Lane A: streamed hydration contract', () => {
  let container: HTMLDivElement;
  let previousActEnv: unknown;
  let consoleError: jest.SpyInstance;

  const s0 = initialState;
  const s1 = setTodo(s0, '0');
  const s2 = setTodo(s1, '1');
  const batch = transport(diffState(s0, s2)!);
  const delta1 = transport(diffState(s0, s1)!);
  const delta2 = transport(diffState(s1, s2)!);

  beforeAll(async () => {
    previousActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
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
    events.length = 0;
    live0 = undefined;
    live1 = undefined;
    consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    delete (globalThis as any).__DATA_CLIENT_DELTAS__;
    document.getElementById(BASELINE_ID)?.remove();
  });
  afterEach(() => {
    consoleError.mockRestore();
    container.remove();
    delete (document as any).readyState;
  });

  const text = (selector: string) =>
    container.querySelector(selector)?.textContent;

  function hydrate(page: React.ReactNode) {
    return hydrateRoot(container, <NextDataProvider>{page}</NextDataProvider>, {
      onRecoverableError: () => undefined,
    });
  }

  it('RSC-first miss: zero REST until the matching delta, then DOM while the stream is open', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    container.innerHTML = renderToString(
      <PlainDataProvider initialState={s1}>
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
      </PlainDataProvider>,
    );
    installBaseline(s0);
    hydrate(
      <Suspense fallback="loading 0">
        <TodoView id="0" />
      </Suspense>,
    );
    await tick();
    expect(fetchIds()).toEqual([]);
    expect(events.filter(e => e.startsWith('fetch'))).toEqual([]);

    streamDelta('delta:0', delta1);
    await tick();
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(fetchIds()).toEqual([]);
    expect(events.indexOf('dom:0')).toBeGreaterThan(events.indexOf('delta:0'));
    expect(document.readyState).toBe('loading');
  });

  it('batch flush: one StateDelta satisfies two islands with zero REST', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    container.innerHTML = renderToString(
      <PlainDataProvider initialState={s2}>
        <Probe />
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading 1">
          <TodoView id="1" />
        </Suspense>
      </PlainDataProvider>,
    );
    installBaseline(s0);
    hydrate(
      <>
        <Probe />
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading 1">
          <TodoView id="1" />
        </Suspense>
      </>,
    );
    await tick();
    expect(fetchIds()).toEqual([]);

    streamDelta('delta:batch', batch);
    await tick();
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(live0).toBe('todo 0');
    expect(live1).toBe('todo 1');
    expect(fetchIds()).toEqual([]);
    expect(events.indexOf('dom:0')).toBeGreaterThan(
      events.indexOf('delta:batch'),
    );
    expect(events.indexOf('dom:1')).toBeGreaterThan(
      events.indexOf('delta:batch'),
    );
    expect(document.readyState).toBe('loading');
  });

  it('nested island: child delta hydrates the child; parent stays pending without REST', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    container.innerHTML = renderToString(
      <PlainDataProvider initialState={s2}>
        <Probe />
        <Suspense fallback="market">
          <Suspense fallback="loading parent">
            <TodoView id="1" />
          </Suspense>
          <Suspense fallback="loading child">
            <TodoView id="0" />
          </Suspense>
        </Suspense>
      </PlainDataProvider>,
    );
    installBaseline(s0);
    hydrate(
      <>
        <Probe />
        <Suspense fallback="market">
          <Suspense fallback="loading parent">
            <TodoView id="1" />
          </Suspense>
          <Suspense fallback="loading child">
            <TodoView id="0" />
          </Suspense>
        </Suspense>
      </>,
    );
    await tick();
    expect(fetchIds()).toEqual([]);

    streamDelta('delta:child', delta1);
    await tick();
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(live1).toBeUndefined();
    expect(fetchIds()).toEqual([]);

    streamDelta('delta:parent', delta2);
    await tick();
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(fetchIds()).toEqual([]);
    expect(events.indexOf('delta:parent')).toBeGreaterThan(
      events.indexOf('dom:0'),
    );
  });

  it('later overlap: a later disjoint delta hydrates without REST', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    container.innerHTML = renderToString(
      <PlainDataProvider initialState={s2}>
        <Probe />
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading 1">
          <TodoView id="1" />
        </Suspense>
      </PlainDataProvider>,
    );
    installBaseline(s0);
    const late = makeGate();
    hydrate(
      <>
        <Probe />
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading 1">
          <Gate promise={late}>
            <TodoView id="1" />
          </Gate>
        </Suspense>
      </>,
    );
    await tick();
    streamDelta('delta:0', delta1);
    await tick();
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(fetchIds()).toEqual([]);

    streamDelta('delta:1', delta2);
    late.release();
    await tick();
    expect(text('[data-id="1"]')).toBe('todo 1');
    expect(live1).toBe('todo 1');
    expect(fetchIds()).toEqual([]);
    expect(events.indexOf('dom:1')).toBeGreaterThan(events.indexOf('delta:1'));
  });

  it('stream-close leftover key: one FETCH at close, not while the stream is open', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    container.innerHTML = renderToString(
      <PlainDataProvider initialState={s1}>
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading leftover">
          <TodoView id="9" />
        </Suspense>
      </PlainDataProvider>,
    );
    installBaseline(s0);
    hydrate(
      <>
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading leftover">
          <TodoView id="9" />
        </Suspense>
      </>,
    );
    await tick();
    streamDelta('delta:0', delta1);
    await tick();
    expect(text('[data-id="0"]')).toBe('todo 0');
    expect(fetchIds()).toEqual([]);

    signalStreamClose();
    await tick(100);
    expect(fetchIds()).toEqual(['9']);
    expect(events.indexOf('fetch:9')).toBeGreaterThan(events.indexOf('close'));
    expect(events.indexOf('fetch:9')).toBeGreaterThan(events.indexOf('dom:0'));
  });
});
