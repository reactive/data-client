jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const useSyncExternalStore = jest.fn((..._args: any[]) => {
    throw new Error(
      'useSyncExternalStore must not be called by public cache reads',
    );
  });
  const use =
    actual.use ? jest.fn((...args: any[]) => actual.use(...args)) : undefined;
  const useContext = jest.fn((...args: any[]) => actual.useContext(...args));
  const wrapped = {
    ...actual,
    useSyncExternalStore,
    useContext,
    ...(use ? { use } : {}),
  };
  return { ...wrapped, default: wrapped };
});

import { initialState } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  DataProvider,
  getDefaultManagers,
  StateContext,
  useCache,
  useDLE,
  useError,
  useFetch,
  useLive,
  useQuery,
  useSuspense,
} from '@data-client/react';
import { mockInitialState } from '@data-client/test';
import { render } from '@testing-library/react';
import React, { Suspense, version } from 'react';
import { renderToString } from 'react-dom/server';

import useCacheState from '../useCacheState';

const reactMajor = Number(version.split('.')[0]);
const describeIf19 = reactMajor >= 19 ? describe : describe.skip;
const describeIf18 = reactMajor === 18 ? describe : describe.skip;

class Todo extends Entity {
  id = '';
  title = '';
}

const getTodo = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, title: `todo ${id}` }),
  { schema: Todo, name: 'getTodo', pollFrequency: 60000 },
);

const noDevManagers = getDefaultManagers({ devToolsManager: null });

const stateA = mockInitialState([
  {
    endpoint: getTodo,
    args: [{ id: 'A' }],
    response: { id: 'A', title: 'todo A' },
  },
]);

function Consumer() {
  const state = useCacheState();
  return <i>{Object.keys(state.entities).join(',') || 'empty'}</i>;
}

describe('useCacheState', () => {
  it('returns StateContext without calling useSyncExternalStore', () => {
    const live = {
      ...initialState,
      entities: { Todo: { '9': { id: '9' } } },
    };
    expect(
      renderToString(
        <StateContext.Provider value={live}>
          <Consumer />
        </StateContext.Provider>,
      ),
    ).toBe('<i>Todo</i>');
  });

  it('public read hooks render cache hits without useSyncExternalStore', () => {
    function Readers() {
      const suspense = useSuspense(getTodo, { id: 'A' });
      const cached = useCache(getTodo, { id: 'A' });
      const live = useLive(getTodo, { id: 'A' });
      const queried = useQuery(Todo, { id: 'A' });
      const dle = useDLE(getTodo, { id: 'A' });
      const fetched = useFetch(getTodo, { id: 'A' });
      const error = useError(getTodo, { id: 'A' });
      return (
        <div>
          <span data-testid="suspense">{suspense.title}</span>
          <span data-testid="cache">{cached?.title}</span>
          <span data-testid="live">{live.title}</span>
          <span data-testid="query">{queried?.title}</span>
          <span data-testid="dle">{dle.data?.title}</span>
          <span data-testid="fetch">
            {(fetched as any)?.value?.title ?? 'skip'}
          </span>
          <span data-testid="error">{error ? 'err' : 'ok'}</span>
        </div>
      );
    }
    const { getByTestId } = render(
      <DataProvider
        initialState={stateA}
        devButton={null}
        managers={noDevManagers}
      >
        <Suspense fallback={<p>loading</p>}>
          <Readers />
        </Suspense>
      </DataProvider>,
    );
    expect(getByTestId('suspense').textContent).toBe('todo A');
    expect(getByTestId('cache').textContent).toBe('todo A');
    expect(getByTestId('live').textContent).toBe('todo A');
    expect(getByTestId('query').textContent).toBe('todo A');
    expect(getByTestId('dle').textContent).toBe('todo A');
    expect(getByTestId('fetch').textContent).toBe('todo A');
    expect(getByTestId('error').textContent).toBe('ok');
  });

  describeIf19('reads go through React.use(StateContext) on React 19', () => {
    it('wrapped use received StateContext during public cache-hit render', () => {
      const useMock = jest.mocked(React.use);
      useMock.mockClear();
      function Readers() {
        useSuspense(getTodo, { id: 'A' });
        useCache(getTodo, { id: 'A' });
        return null;
      }
      render(
        <DataProvider
          initialState={stateA}
          devButton={null}
          managers={noDevManagers}
        >
          <Suspense fallback={null}>
            <Readers />
          </Suspense>
        </DataProvider>,
      );
      expect(useMock.mock.calls.some(call => call[0] === StateContext)).toBe(
        true,
      );
    });
  });

  describeIf18('reads go through useContext(StateContext) on React 18', () => {
    it('wrapped useContext received StateContext (labeled fallback)', () => {
      const useContextMock = jest.mocked(React.useContext);
      useContextMock.mockClear();
      function Readers() {
        useSuspense(getTodo, { id: 'A' });
        useCache(getTodo, { id: 'A' });
        return null;
      }
      render(
        <DataProvider
          initialState={stateA}
          devButton={null}
          managers={noDevManagers}
        >
          <Suspense fallback={null}>
            <Readers />
          </Suspense>
        </DataProvider>,
      );
      expect(
        useContextMock.mock.calls.some(call => call[0] === StateContext),
      ).toBe(true);
    });
  });

  it('reads live state without useSyncExternalStore (React 16/17 shape)', () => {
    jest.resetModules();
    jest.doMock('react', () => {
      const actual = jest.requireActual('react');
      const { useSyncExternalStore, ...legacy } = actual;
      return { ...legacy, default: legacy };
    });
    try {
      jest.isolateModules(() => {
        const LegacyReactModule = require('react');
        expect(LegacyReactModule.useSyncExternalStore).toBeUndefined();
        const useCacheStateLegacy = require('../useCacheState').default;
        const { renderToString: renderString } = require('react-dom/server');
        const ctx = require('../../context');
        const live = {
          ...initialState,
          entities: { Todo: { '9': { id: '9' } } },
        };
        const ConsumerLegacy = () => {
          const state = useCacheStateLegacy();
          return LegacyReactModule.createElement(
            'i',
            null,
            Object.keys(state.entities).join(',') || 'empty',
          );
        };
        const html = renderString(
          LegacyReactModule.createElement(
            ctx.StateContext.Provider,
            { value: live },
            LegacyReactModule.createElement(ConsumerLegacy),
          ),
        );
        expect(html).toBe('<i>Todo</i>');
      });
    } finally {
      jest.dontMock('react');
      jest.resetModules();
    }
  });
});
