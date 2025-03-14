import { State, ActionTypes, Controller, actionTypes } from '@data-client/core';
import { CacheProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import { render, act } from '@testing-library/react';
import { CoolerArticleResource, PaginatedArticleResource } from '__tests__/new';
import nock from 'nock';
import React, { Suspense, useContext, useEffect } from 'react';

// relative imports to avoid circular dependency in tsconfig references

import {
  makeRenderDataClient,
  mockInitialState,
  renderHook,
} from '../../../test';
import { ControllerContext, StateContext } from '../context';
import { useController, useSuspense } from '../hooks';
import { articlesPages, createPayload, payload } from '../test-fixtures';

const { INVALIDATE, RESET } = actionTypes;

async function testDispatchFetch(
  Component: React.FunctionComponent<any>,
  payloads: any[],
) {
  const dispatch = jest.fn();
  const controller = new Controller({ dispatch });
  const tree = (
    <ControllerContext.Provider value={controller}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ControllerContext.Provider>
  );
  render(tree);
  expect(dispatch).toHaveBeenCalledTimes(payloads.length);
  let i = 0;
  for (const call of dispatch.mock.calls) {
    delete call[0]?.meta?.fetchedAt;
    delete call[0]?.meta?.promise;
    expect(call[0]).toMatchSnapshot();
    const action = call[0];
    const res = await action.endpoint(...action.args);
    expect(res).toEqual(payloads[i]);
    i++;
  }
}

function testDataClient(
  callback: () => void,
  state: State<unknown>,
  dispatch = (v: ActionTypes) => Promise.resolve(),
) {
  const controller = new Controller({ dispatch });
  return renderHook(callback, {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <ControllerContext.Provider value={controller}>
          <StateContext.Provider value={state}>
            {children}
          </StateContext.Provider>
        </ControllerContext.Provider>
      );
    },
  });
}

let mynock: nock.Scope;

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    })
    .options(/.*/)
    .reply(200);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});

afterAll(() => {
  nock.cleanAll();
});

describe('useController.fetch', () => {
  const payload = { id: 1, content: 'hi' };

  it('should dispatch an action that fetches a create', async () => {
    mynock.post(`/article-cooler`).reply(201, payload);

    function DispatchTester() {
      const { fetch } = useController();
      fetch(CoolerArticleResource.create, { content: 'hi' }).then(v => {
        v.author;
        // @ts-expect-error
        v.doesnotexist;
      });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should handle zero argument Endpoints', async () => {
    const endpoint = CoolerArticleResource.getList.extend({
      url() {
        return '';
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function DispatchTester() {
      const { fetch } = useController();
      fetch(endpoint).then(v => {
        v[0].author;
        // @ts-expect-error
        v.doesnotexist;
      });
      return null;
    }
  });

  it('should dispatch an action with updater in the meta if update shapes params are passed in', async () => {
    mynock.post(`/article-cooler`).reply(201, payload);

    function DispatchTester() {
      const { fetch } = useController();
      const params = { content: 'hi' };
      fetch(CoolerArticleResource.create, params).then(v => {
        v.title;
        // @ts-expect-error
        v.doesnotexist;
      });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should refresh get details', async () => {
    mynock.get(`/article-cooler/${payload.id}`).reply(200, payload);

    function DispatchTester() {
      const { fetch } = useController();
      // @ts-expect-error
      () => fetch(CoolerArticleResource.detail(), {}, { content: 'hi' });
      fetch(CoolerArticleResource.get, { id: payload.id }).then(v => {
        v.title;
        // @ts-expect-error
        v.doesnotexist;
      });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should console.error() a warning when fetching without a Provider', () => {
    const oldError = console.error;
    const spy = (console.error = jest.fn());
    renderHook(() => {
      const { fetch } = useController();
      fetch(CoolerArticleResource.create, { content: 'hi' });
      return null;
    });
    expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "It appears you are trying to use Reactive Data Client without a provider.
      Follow instructions: https://dataclient.io/docs/getting-started/installation#add-provider-at-top-level-component",
      ]
    `);
    console.error = oldError;
  });

  it('should dispatch an action that fetches a partial update', async () => {
    mynock.patch(`/article-cooler/1`).reply(200, payload);

    function DispatchTester() {
      const { fetch } = useController();
      fetch(
        CoolerArticleResource.partialUpdate,
        { id: payload.id },
        { content: 'changed' },
      );
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should dispatch an action that fetches a full update', async () => {
    mynock.put(`/article-cooler/1`).reply(200, payload);

    function DispatchTester() {
      const { fetch } = useController();
      fetch(
        CoolerArticleResource.update,
        { id: payload.id },
        { content: 'changed' },
      );
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });
});

describe('useController().invalidate', () => {
  it('should not invalidate anything if params is null', () => {
    const state = mockInitialState([
      {
        endpoint: PaginatedArticleResource.getList,
        args: [],
        response: articlesPages,
      },
    ]);
    const dispatch = jest.fn();
    let invalidate: any;
    testDataClient(
      () => {
        invalidate = useController().invalidate;
      },
      state,
      dispatch,
    );
    invalidate(PaginatedArticleResource.getList, null);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('should return a function that dispatches an action to invalidate a resource', () => {
    const state = mockInitialState([
      {
        endpoint: PaginatedArticleResource.getList,
        args: [],
        response: articlesPages,
      },
    ]);
    const dispatch = jest.fn();
    let invalidate: any;
    testDataClient(
      () => {
        invalidate = useController().invalidate;
      },
      state,
      dispatch,
    );
    invalidate(PaginatedArticleResource.getList);
    expect(dispatch).toHaveBeenCalledWith({
      type: INVALIDATE,
      key: PaginatedArticleResource.getList.key(),
    });
  });
  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const { invalidate } = useController();
      useEffect(track, [invalidate]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});

describe('useController().reset', () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  it('should return a function that dispatches an action to reset the cache', async () => {
    jest.useFakeTimers();
    const state = mockInitialState([
      {
        endpoint: PaginatedArticleResource.getList,
        args: [],
        response: articlesPages,
      },
    ]);
    const dispatch = jest.fn();
    let reset: () => Promise<void> = () => Promise.resolve();
    testDataClient(
      () => {
        reset = useController().resetEntireStore;
      },
      state,
      dispatch,
    );
    await act(reset);
    expect(dispatch).toHaveBeenCalledWith({
      type: RESET,
      date: Date.now(),
    });
  });
  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const reset = useController().resetEntireStore;
      useEffect(track, [reset]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});

describe('useController().getState', () => {
  describe.each([
    ['CacheProvider', CacheProvider],
    ['ExternalDataProvider', ExternalDataProvider],
  ] as const)(`%s`, (_, makeProvider) => {
    let renderDataClient: ReturnType<typeof makeRenderDataClient>;
    let mynock: nock.Scope;

    beforeEach(() => {
      nock(/.*/)
        .persist()
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .options(/.*/)
        .reply(200)
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload)
        .post(`/article-cooler`)
        .reply(200, createPayload);

      mynock = nock(/.*/).defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });

    afterEach(() => {
      nock.cleanAll();
    });
    beforeEach(() => {
      renderDataClient = makeRenderDataClient(makeProvider);
    });

    it('should have initial values before any state updates', () => {
      const { result } = renderDataClient(() => {
        return [useController(), useContext(StateContext)] as const;
      });
      expect(result.current[0].getState()).toEqual(result.current[1]);
    });

    it('should eventually update', async () => {
      const { result, waitForNextUpdate } = renderDataClient(() => {
        return [
          useSuspense(CoolerArticleResource.get, { id: payload.id }),
          useController(),
        ] as const;
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current[0].title).toBe(payload.title);
      // @ts-expect-error
      expect(result.current[0].lafsjlfd).toBeUndefined();
      expect(
        Object.keys(result.current[1].getState().endpoints).length,
      ).toBeGreaterThanOrEqual(1);
      // === guarantee
      expect(
        result.current[1].getResponse(
          CoolerArticleResource.get,
          { id: payload.id },
          result.current[1].getState(),
        ).data,
      ).toBe(result.current[0]);
      await act(async () => {
        await result.current[1].fetch(
          CoolerArticleResource.create,
          createPayload,
        );
      });
      expect(
        result.current[1].getResponse(
          CoolerArticleResource.create,
          createPayload,
          result.current[1].getState(),
        ).data,
      ).toMatchSnapshot();
    });
  });

  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const { getState } = useController();
      useEffect(track, [getState]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});
