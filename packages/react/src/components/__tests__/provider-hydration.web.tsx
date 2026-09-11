import {
  Controller,
  actions,
  createReducer,
  initialState,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import React, { StrictMode, Suspense, version } from 'react';
import { renderToString } from 'react-dom/server';

import { ServerSnapshotContext, StateContext } from '../../context';
import useCache from '../../hooks/useCache';
import useController from '../../hooks/useController';
import useSuspense from '../../hooks/useSuspense';
import DataProvider from '../DataProvider';

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
const setTodo = (state: State<unknown>, id: string, title = `todo ${id}`) =>
  reducer(
    state,
    actions.createSetResponse(getTodo, {
      args: [{ id }],
      response: { id, title },
    }),
  );

const tick = (ms = 30) => new Promise(resolve => setTimeout(resolve, ms));

/** Suspends until released; resolved during server rendering */
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
  const todo = useSuspense(getTodo, { id });
  return <p data-id={id}>{todo.title}</p>;
}
let controller: Controller | undefined;
function Probe() {
  controller = useController();
  const todo = useCache(getTodo, { id: '1' });
  return <span data-probe>{todo?.title ?? 'none'}</span>;
}

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const React19 = Number.parseInt(version, 10) >= 19;
const describeHydration = LegacyReact ? describe.skip : describe;
// react-dom/client is 18+; a static import throws on 16/17 before describe.skip
let hydrateRoot!: typeof import('react-dom/client').hydrateRoot;
if (!LegacyReact) {
  ({ hydrateRoot } = jest.requireActual('react-dom/client'));
}

const liveTodo = (id: string) =>
  (
    controller?.getState().entities.Todo as
      Record<string, { title: string }> | undefined
  )?.[id];

describeHydration('<DataProvider /> hydration', () => {
  let container: HTMLDivElement;
  let errors: string[];
  let consoleError: jest.SpyInstance;
  let previousActEnv: unknown;

  beforeAll(async () => {
    previousActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    // let the lazy dev tools button load so renderToString never suspends
    renderToString(
      <DataProvider>
        <div />
      </DataProvider>,
    );
    await tick(0);
  });
  afterAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnv;
  });
  beforeEach(() => {
    fetchTodo.mockClear();
    controller = undefined;
    errors = [];
    consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((...args) => errors.push(args.join(' ')));
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => {
    consoleError.mockRestore();
    container.remove();
  });

  const serverState = setTodo(setTodo(initialState, '0'), '1');

  function App({
    gate,
    strict = false,
  }: {
    gate: GatePromise;
    strict?: boolean;
  }) {
    const tree = (
      <DataProvider initialState={serverState} devButton={null}>
        <Probe />
        <Suspense fallback="loading 0">
          <TodoView id="0" />
        </Suspense>
        <Suspense fallback="loading 1">
          <Gate promise={gate}>
            <TodoView id="1" />
          </Gate>
        </Suspense>
      </DataProvider>
    );
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  }

  async function hydrateWithLateUpdate(strict: boolean) {
    container.innerHTML = renderToString(<App gate={makeGate(true)} />);
    const serverNode = container.querySelector('[data-id="1"]')!;
    expect(serverNode.textContent).toBe('todo 1');
    (serverNode as any).__server = true;

    const gate = makeGate();
    hydrateRoot(container, <App gate={gate} strict={strict} />, {
      onRecoverableError: e =>
        errors.push(`recoverable: ${(e as Error).message}`),
    });
    await tick();
    expect(container.querySelector('[data-id="0"]')!.textContent).toBe(
      'todo 0',
    );

    // the live store moves on while the second boundary is still dehydrated
    controller!.setResponse(
      getTodo,
      { id: '1' },
      { id: '1', title: 'todo 1 updated' },
    );
    await tick();
    // React 18 defers this store write until the dehydrated sibling hydrates.
    if (React19) {
      expect(liveTodo('1')?.title).toBe('todo 1 updated');
      expect(container.querySelector('[data-probe]')!.textContent).toBe(
        'todo 1 updated',
      );
    }
    expect(container.querySelector('[data-id="1"]')!.textContent).toBe(
      'todo 1',
    );

    gate.release();
    await tick();
    const hydratedNode = container.querySelector('[data-id="1"]')!;
    expect(hydratedNode.textContent).toBe('todo 1 updated');
    // React 18 may client-render a still-dehydrated boundary (docs limitation)
    if (React19) {
      expect((hydratedNode as any).__server).toBe(true);
      expect(errors).toEqual([]);
    }
    expect(fetchTodo).not.toHaveBeenCalled();
  }

  it('hydrates a late boundary against the server state, then converges', () =>
    hydrateWithLateUpdate(false));

  it('does the same under StrictMode', () => hydrateWithLateUpdate(true));

  it('hydrates within a transition without blocking', async () => {
    container.innerHTML = renderToString(<App gate={makeGate(true)} />);
    const gate = makeGate();
    hydrateRoot(container, <App gate={gate} />, {
      onRecoverableError: e =>
        errors.push(`recoverable: ${(e as Error).message}`),
    });
    await tick();
    React.startTransition(() => {
      controller!.setResponse(
        getTodo,
        { id: '1' },
        { id: '1', title: 'todo 1 later' },
      );
    });
    gate.release();
    await tick();
    expect(container.querySelector('[data-id="1"]')!.textContent).toBe(
      'todo 1 later',
    );
    if (React19) {
      expect(errors).toEqual([]);
    }
  });
});

describe('useCacheState branches', () => {
  it('reads live state without useSyncExternalStore (React 16/17 shape)', () => {
    jest.isolateModules(() => {
      jest.doMock('react', () => {
        const actual = jest.requireActual('react');

        const { useSyncExternalStore, ...legacy } = actual;
        return { ...legacy, default: legacy };
      });
      const LegacyReactModule = require('react');
      expect(LegacyReactModule.useSyncExternalStore).toBeUndefined();
      const useCacheState = require('../../hooks/useCacheState').default;
      const { renderToString: render } = require('react-dom/server');
      const ctx = require('../../context');
      const live = setTodo(initialState, '9');
      const Consumer = () => {
        const state = useCacheState();
        return LegacyReactModule.createElement(
          'i',
          null,
          Object.keys(state.entities.Todo ?? {}).join(','),
        );
      };
      const html = render(
        LegacyReactModule.createElement(
          ctx.ServerSnapshotContext.Provider,
          { value: { getServerSnapshot: () => initialState } },
          LegacyReactModule.createElement(
            ctx.StateContext.Provider,
            { value: live },
            LegacyReactModule.createElement(Consumer),
          ),
        ),
      );
      expect(html).toBe('<i>9</i>');
    });
  });

  it('falls back to live state when no snapshot provider exists', () => {
    const live = setTodo(initialState, '9');
    const Consumer = () => {
      const state = useCache(getTodo, { id: '9' });
      return <i>{state?.title}</i>;
    };
    expect(
      renderToString(
        <StateContext.Provider value={live}>
          <Consumer />
        </StateContext.Provider>,
      ),
    ).toBe('<i>todo 9</i>');
    expect(ServerSnapshotContext).toBeDefined();
  });
});
