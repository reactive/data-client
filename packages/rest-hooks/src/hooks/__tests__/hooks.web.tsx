import { shapeToEndpoint } from '@rest-hooks/legacy';
import {
  StateContext,
  State,
  ActionTypes,
  actionTypes,
  __INTERNAL__,
  Controller,
  ControllerContext,
} from '@rest-hooks/react';
import { CacheProvider } from '@rest-hooks/react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import {
  CoolerArticleResource,
  PaginatedArticleResource,
  ArticleResourceWithOtherListUrl,
  StaticArticleResource,
} from '__tests__/legacy-3';
import nock from 'nock';
import React, { Suspense, useEffect } from 'react';
// relative imports to avoid circular dependency in tsconfig references

import { useRetrieve } from '..';
import { makeRenderRestHook, mockInitialState } from '../../../../test';
import { users, articlesPages, payload } from '../test-fixtures';

const { initialState } = __INTERNAL__;

const { INVALIDATE_TYPE, RESET_TYPE } = actionTypes;

async function testDispatchFetch(
  Component: React.FunctionComponent<any>,
  payloads: any[],
) {
  const dispatch = jest.fn();
  const tree = (
    <ControllerContext.Provider value={new Controller({ dispatch })}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ControllerContext.Provider>
  );
  render(tree);
  expect(dispatch).toHaveBeenCalledTimes(payloads.length);
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
  return renderHook(callback, {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <ControllerContext.Provider value={new Controller({ dispatch })}>
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

describe('useRetrieve', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    mynock.get(`/article-cooler/${payload.id}`).reply(200, payload);
    mynock.get(`/article-static/${payload.id}`).reply(200, payload);
    mynock.get(`/user/`).reply(200, users);
    renderRestHook = makeRenderRestHook(CacheProvider);
  });
  afterEach(() => {
    nock.cleanAll();
  });

  it('should dispatch singles', async () => {
    function FetchTester() {
      useRetrieve(CoolerArticleResource.detailShape(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should not dispatch will null params', () => {
    const dispatch = jest.fn();
    let params: any = null;
    const { rerender } = testRestHook(
      () => {
        useRetrieve(CoolerArticleResource.detailShape(), params);
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
      useRetrieve(StaticArticleResource.detailShape(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should dispatch with fetch shape defined dataExpiryLength', async () => {
    function FetchTester() {
      useRetrieve(StaticArticleResource.longLivingRequest(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });

  it('should dispatch with fetch shape defined errorExpiryLength', async () => {
    function FetchTester() {
      useRetrieve(StaticArticleResource.neverRetryOnErrorRequest(), payload);
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
    const initialFixtures: any[] = [
      {
        endpoint: shapeToEndpoint(CoolerArticleResource.detailShape()),
        args: [payload],
        response: payload,
      },
    ];
    const { result, rerender } = renderRestHook(
      () => {
        return useRetrieve(CoolerArticleResource.detailShape(), payload);
      },
      { initialFixtures },
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
