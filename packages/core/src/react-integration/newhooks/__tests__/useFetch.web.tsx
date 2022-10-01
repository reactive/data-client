import { CoolerArticleResource, StaticArticleResource } from '__tests__/new';
import React, { Suspense } from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import nock from 'nock';

// relative imports to avoid circular dependency in tsconfig references
import {
  StateContext,
  initialState,
  State,
  ActionTypes,
  ControllerContext,
  Controller,
} from '@rest-hooks/core';

import { makeRenderRestHook, makeCacheProvider } from '../../../../../test';
import useFetch from '../useFetch';
import { users, payload } from '../test-fixtures';

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
  expect(dispatch).toHaveBeenCalled();
  expect(dispatch.mock.calls.length).toBe(payloads.length);
  let i = 0;
  for (const call of dispatch.mock.calls) {
    delete call[0]?.meta?.createdAt;
    delete call[0]?.meta?.promise;
    expect(call[0]).toMatchSnapshot();
    const action = call[0];
    const res = await action.payload();
    expect(res).toEqual(payloads[i]);
    i++;
  }
}

function testRestHook(
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

describe('useFetch', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    mynock.get(`/article-cooler/${payload.id}`).reply(200, payload);
    mynock.get(`/article-static/${payload.id}`).reply(200, payload);
    mynock.get(`/user/`).reply(200, users);
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });
  afterEach(() => {
    nock.cleanAll();
  });

  it('should dispatch singles', async () => {
    function FetchTester() {
      useFetch(CoolerArticleResource.get, { id: payload.id });
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should not dispatch will null params', () => {
    const dispatch = jest.fn();
    let params: any = null;
    const { rerender } = testRestHook(
      () => {
        useFetch(CoolerArticleResource.get, params);
      },
      initialState,
      dispatch,
    );
    expect(dispatch).toBeCalledTimes(0);
    params = payload;
    rerender();
    expect(dispatch).toBeCalled();
  });

  it('should dispatch with resource defined dataExpiryLength', async () => {
    function FetchTester() {
      useFetch(StaticArticleResource.get, { id: payload.id });
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should dispatch with fetch shape defined dataExpiryLength', async () => {
    function FetchTester() {
      useFetch(StaticArticleResource.longLiving, { id: payload.id });
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should dispatch with fetch shape defined errorExpiryLength', async () => {
    function FetchTester() {
      useFetch(StaticArticleResource.neverRetryOnError, { id: payload.id });
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should not refetch after expiry and render', async () => {
    let time = 1000;
    global.Date.now = jest.fn(() => time);
    nock.cleanAll();
    const fetchMock = jest.fn(() => payload);
    mynock.get(`/article-cooler/${payload.id}`).reply(200, fetchMock).persist();
    const results: any[] = [
      {
        endpoint: CoolerArticleResource.get,
        args: [{ id: payload.id }],
        response: payload,
      },
    ];
    const { result, rerender } = renderRestHook(
      () => {
        return useFetch(CoolerArticleResource.get, { id: payload.id });
      },
      { results },
    );
    await result.current;
    expect(fetchMock).toHaveBeenCalledTimes(0);
    time += 100;
    rerender();
    await result.current;
    expect(fetchMock).toHaveBeenCalledTimes(0);
    // eslint-disable-next-line require-atomic-updates
    time += 610000000;
    rerender();
    await result.current;
    rerender();
    await result.current;
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });
});
