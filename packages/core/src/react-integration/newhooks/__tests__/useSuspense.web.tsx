import {
  CoolerArticleResource,
  InvalidIfStaleArticleResource,
  GetPhoto,
  GetPhotoUndefined,
  GetNoEntities,
  ArticleTimedResource,
  ContextAuthdArticleResource,
  AuthContext,
  PaginatedArticleResource,
  CoolerArticle,
  PaginatedArticle,
  FutureArticleResource,
  ArticleTimed,
} from '__tests__/new';
import { createEntityMeta } from '__tests__/utils';
import {
  State,
  useController,
  ControllerContext,
  StateContext,
  initialState,
  Controller,
  ActionTypes,
  actionTypes,
} from '@rest-hooks/core';
import React, { Suspense } from 'react';
import { render, act } from '@testing-library/react';
import nock from 'nock';
import { jest } from '@jest/globals';
// relative imports to avoid circular dependency in tsconfig references
import { normalize } from '@rest-hooks/normalizr';
import { Endpoint, FetchFunction, ReadEndpoint } from '@rest-hooks/endpoint';
import { SpyInstance } from 'jest-mock';

import { FetchAction } from '../../../types';
import {
  makeRenderRestHook,
  makeCacheProvider,
  mockInitialState,
} from '../../../../../test';
import useSuspense from '../useSuspense';
import { articlesPages, payload, users, nested } from '../test-fixtures';
import { CacheProvider } from '../..';

async function testDispatchFetch(
  Component: React.FunctionComponent<any>,
  payloads: any[],
) {
  const dispatch = jest.fn<(value: ActionTypes) => Promise<void>>();
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
  for (const call of dispatch.mock.calls as any) {
    expect(call[0].type).toBe(actionTypes.FETCH_TYPE);
    delete call[0]?.meta?.createdAt;
    delete call[0]?.meta?.promise;
    expect(call[0]).toMatchSnapshot();
    const action: FetchAction = call[0] as any;
    const res = await action.payload();
    expect(res).toEqual(payloads[i]);
    i++;
  }
}

function ArticleComponentTester({ invalidIfStale = false, schema = true }) {
  let endpoint = invalidIfStale
    ? InvalidIfStaleArticleResource.get
    : CoolerArticleResource.get;
  if (!schema) {
    endpoint = (endpoint as any).extend({ schema: undefined }) as any;
  }
  const article = useSuspense(endpoint, {
    id: payload.id,
  });
  return (
    <div>
      <h3>{article.title}</h3>
      <p>{article.content}</p>
    </div>
  );
}

describe('useSuspense()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  const fbmock = jest.fn();

  async function testMalformedResponse(
    payload: any,
    endpoint: ReadEndpoint<FetchFunction, any> = CoolerArticleResource.get,
  ) {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/400`)
      .reply(200, payload);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(endpoint, {
        id: 400,
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBeGreaterThan(399);
    expect(result.error).toMatchSnapshot();
  }

  function Fallback() {
    fbmock();
    return null;
  }

  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-time/${payload.id}`)
      .reply(200, { ...payload, createdAt: '2020-06-07T02:00:15+0000' })
      .delete(`/article-cooler/${payload.id}`)
      .reply(204, '')
      .delete(`/article/${payload.id}`)
      .reply(200, {})
      .get(`/article-cooler/0`)
      .reply(403, {})
      .get(`/article-cooler/666`)
      .reply(200, '')
      .get(`/article-cooler`)
      .reply(200, nested)
      .get(`/user`)
      .reply(200, users);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
    fbmock.mockReset();
  });

  it('should dispatch an action that fetches', async () => {
    await testDispatchFetch(ArticleComponentTester, [payload]);
  });

  it('should NOT suspend if result already in cache and options.invalidIfStale is false', () => {
    const state: State<unknown> = mockInitialState([
      {
        endpoint: CoolerArticleResource.get,
        args: [{ id: payload.id }],
        response: payload,
      },
    ]) as any;

    const tree = (
      <StateContext.Provider value={state}>
        <Suspense fallback={<Fallback />}>
          <ArticleComponentTester />
        </Suspense>
      </StateContext.Provider>
    );
    const { getByText } = render(tree);
    expect(fbmock).not.toBeCalled();
    const title = getByText(payload.title);
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H3');
  });
  it('should NOT suspend even when result is stale and options.invalidIfStale is false', () => {
    const { entities, result } = normalize(payload, CoolerArticle);
    const fetchKey = CoolerArticleResource.get.key({ id: payload.id });
    const state = {
      ...initialState,
      entities,
      entityMeta: createEntityMeta(entities),
      results: {
        [fetchKey]: result,
      },
      meta: {
        [fetchKey]: {
          date: 0,
          expiresAt: 0,
        },
      },
    };
    const controller = new Controller({ dispatch: () => Promise.resolve() });
    const tree = (
      <StateContext.Provider value={state}>
        <ControllerContext.Provider value={controller}>
          <Suspense fallback={<Fallback />}>
            <ArticleComponentTester />
          </Suspense>{' '}
        </ControllerContext.Provider>
      </StateContext.Provider>
    );
    const { getByText } = render(tree);
    expect(fbmock).not.toBeCalled();
    const title = getByText(payload.title);
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H3');
  });
  it('should NOT suspend if result is not stale and options.invalidIfStale is true', () => {
    const { entities, result } = normalize(payload, CoolerArticle);
    const fetchKey = InvalidIfStaleArticleResource.get.key({ id: payload.id });
    const state = {
      ...initialState,
      entities,
      results: {
        [fetchKey]: result,
      },
      entityMeta: createEntityMeta(entities),
      meta: {
        [fetchKey]: {
          date: Infinity,
          expiresAt: Infinity,
        },
      },
    };

    const tree = (
      <StateContext.Provider value={state}>
        <Suspense fallback={<Fallback />}>
          <ArticleComponentTester invalidIfStale />
        </Suspense>
      </StateContext.Provider>
    );
    const { getByText } = render(tree);
    expect(fbmock).not.toBeCalled();
    const title = getByText(payload.title);
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H3');
  });
  it('should suspend if result stale in cache and options.invalidIfStale is true', () => {
    const { entities, result } = normalize(payload, CoolerArticle);
    const fetchKey = InvalidIfStaleArticleResource.get.key({ id: payload.id });
    const state = {
      ...initialState,
      entities,
      results: {
        [fetchKey]: result,
      },
      entityMeta: createEntityMeta(entities),
      meta: {
        [fetchKey]: {
          date: 0,
          expiresAt: 0,
        },
      },
    };
    const controller = new Controller({ dispatch: () => Promise.resolve() });

    const tree = (
      <StateContext.Provider value={state}>
        <ControllerContext.Provider value={controller}>
          <Suspense fallback={<Fallback />}>
            <ArticleComponentTester invalidIfStale />
          </Suspense>
        </ControllerContext.Provider>
      </StateContext.Provider>
    );
    render(tree);
    expect(fbmock).toHaveBeenCalled();
  });
  it('should suspend if result stale in cache and options.invalidIfStale is true and no schema', () => {
    const endpoint = InvalidIfStaleArticleResource.get.extend({
      schema: undefined,
    });
    const fetchKey = endpoint.key({ id: payload.id });
    const state = {
      ...initialState,
      entities: {},
      results: {
        [fetchKey]: payload,
      },
      entityMeta: {},
      meta: {
        [fetchKey]: {
          date: 0,
          expiresAt: 0,
        },
      },
    };
    const controller = new Controller({ dispatch: () => Promise.resolve() });

    const tree = (
      <StateContext.Provider value={state}>
        <ControllerContext.Provider value={controller}>
          <Suspense fallback={<Fallback />}>
            <ArticleComponentTester invalidIfStale schema={false} />
          </Suspense>
        </ControllerContext.Provider>
      </StateContext.Provider>
    );
    render(tree);
    expect(fbmock).toHaveBeenCalled();
  });

  describe('errors', () => {
    let errorspy: SpyInstance<typeof global.console.error>;
    beforeEach(() => {
      errorspy = jest
        .spyOn(global.console, 'error')
        .mockImplementation(() => {});
    });
    afterEach(() => {
      errorspy.mockRestore();
    });

    it('should console.error when lastReset is NaN', async () => {
      const state: State<unknown> = {
        ...initialState,
        lastReset: NaN as any,
      };

      const tree = (
        <CacheProvider initialState={state}>
          <Suspense fallback={<Fallback />}>
            <ArticleComponentTester />
          </Suspense>
        </CacheProvider>
      );
      const { findAllByText } = render(tree);
      expect(fbmock).toHaveBeenCalled();
      await act(async () => {
        let count = 0;
        while (errorspy.mock.calls.length < 1 && count < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          count++;
        }
        /* TODO: remove above and re-enable below once we figure out how to make suspense testing work in react 18 */
        //await findAllByText(payload.title);
      });
      expect(errorspy.mock.calls).toContainEqual([
        'state.lastReset is NaN. Only positive timestamps are valid.',
      ]);
    });

    // taken from integration
    it('should throw errors on bad network', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useSuspense(CoolerArticleResource.get, {
          id: '0',
        });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(403);
    });

    it('should throw error when response is array when expecting entity', async () => {
      await testMalformedResponse([]);
    });

    it('should throw error when response is {} when expecting entity', async () => {
      await testMalformedResponse({});
    });

    it('should throw error when response is number when expecting entity', async () => {
      await testMalformedResponse(5);
    });

    it('should throw error when response is string when expecting entity', async () => {
      await testMalformedResponse('hi');
    });

    /* TODO: Add these back when we have opt-in required
  it('should throw error when response is string when expecting nested entity', async () => {
    const endpoint = CoolerArticleResource.detail().extend({
      schema: { data: CoolerArticleResource },
    });
    await testMalformedResponse('hi', endpoint);
  });

  it('should throw error when response is nested string when expecting nested entity', async () => {
    const endpoint = CoolerArticleResource.detail().extend({
      schema: { data: CoolerArticleResource },
    });
    await testMalformedResponse({ data: 5, parcel: 2 }, endpoint);
  });

  it('should throw error when response is nested missing id when expecting nested entity', async () => {
    const endpoint = CoolerArticleResource.detail().extend({
      schema: { data: CoolerArticleResource },
    });
    await testMalformedResponse(
      { data: { ...payload, id: undefined }, parcel: 2 },
      endpoint,
    );
  });

  it('should throw error when response is expected Resource inside Record', async () => {
    class Scheme extends SimpleRecord {
      data: CoolerArticleResource = CoolerArticleResource.fromJS();
      optional: UserResource | null = null;
      static schema = {
        data: CoolerArticleResource,
        optional: UserResource,
      };
    }
    const endpoint = CoolerArticleResource.detail().extend({
      schema: Scheme,
    });
    await testMalformedResponse({ data: null }, endpoint);
  });*/
  });

  /*it('should not suspend with null params to useSuspense()', () => {
    let article: CoolerArticle | undefined;
    const { result } = renderRestHook(() => {
      const a = useSuspense(CoolerArticleResource.get, null);
      a.tags;
      article = a;
      // @ts-expect-error
      const b: CoolerArticleResource = a;
      return 'done';
    });
    expect(result.current).toBe('done');
    expect(article).toBeUndefined();
  });*/

  it('should maintain schema structure even with null params', () => {
    let articles: PaginatedArticle[] | undefined;
    const { result } = renderRestHook(
      () => {
        const { results, nextPage } = useSuspense(
          PaginatedArticleResource.getList,
          null,
        );
        articles = results;
        // @ts-expect-error
        const b: PaginatedArticleResource[] = results;
        return nextPage;
      },
      {
        results: [
          {
            endpoint: PaginatedArticleResource.getList,
            args: [],
            response: articlesPages,
          },
        ],
      },
    );
    expect(result.current).toBe('');
    expect(articles).toBeUndefined();
  });

  it('should suspend with no params to useSuspense()', async () => {
    const List = CoolerArticleResource.getList;
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(List);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current.length).toEqual(nested.length);

    // @ts-expect-error
    () => useSuspense(List, 5);
    // @ts-expect-error
    () => useSuspense(List, '5');
  });

  it('should read with id params Endpoint', async () => {
    const Detail = FutureArticleResource.get;
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(Detail, 5);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toEqual(CoolerArticle.fromJS(payload));

    // @ts-expect-error
    () => useSuspense(Detail);
    // @ts-expect-error
    () => useSuspense(Detail, 5, 10);
    // @ts-expect-error
    () => useSuspense(Detail, {});
    // @ts-expect-error
    () => useSuspense(Detail, new Date());
  });

  it('should work with shapes with no entities', async () => {
    const userId = '5';
    const response = { firstThing: '', someItems: [{ a: 5 }] };
    nock(/.*/)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(`/users/${userId}/simple`)
      .reply(200, response);
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(GetNoEntities, { userId });
    });
    // undefined means it threw
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toStrictEqual(response);
  });

  it('should work with ArrayBuffer shapes', async () => {
    const userId = '5';
    const response = new ArrayBuffer(10);
    nock(/.*/)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(`/users/${userId}/photo`)
      .reply(200, response);
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(GetPhoto, { userId });
    });
    // undefined means it threw
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toEqual(response);
  });

  it('should work with ArrayBuffer endpoint with undefined schema', async () => {
    const userId = '5';
    const response = new ArrayBuffer(99);
    nock(/.*/)
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
      })
      .get(`/users/${userId}/photo2`)
      .reply(200, response);
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(GetPhotoUndefined, { userId });
    });
    // undefined means it threw
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toEqual(response);
  });

  it('should work with Serializable shapes', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(ArticleTimedResource.get, { id: payload.id });
    });
    // undefined means it threw
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current.createdAt.getDate()).toBe(
      result.current.createdAt.getDate(),
    );
    expect(result.current.createdAt).toEqual(
      new Date('2020-06-07T02:00:15+0000'),
    );
    expect(result.current.id).toEqual(payload.id);
    expect(result.current).toBeInstanceOf(ArticleTimed);
  });

  it('reset promises do not propagate', async () => {
    let rejectIt: (reason?: any) => void = () => {};
    const func = () => {
      return new Promise((resolve, reject) => {
        rejectIt = reject;
      });
    };
    const MyEndpoint = new Endpoint(func, {
      key() {
        return 'MyEndpoint';
      },
    });
    const { result, unmount } = renderRestHook(() => {
      return useSuspense(MyEndpoint);
    });
    expect(result.current).toBeUndefined();
    unmount();
    act(() => rejectIt('failed'));
    // the test will fail if promise is not caught
  });

  describe('context authentication', () => {
    beforeAll(() => {
      const mynock = nock(/.*/)
        .persist()
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Access-Token',
          'Content-Type': 'application/json',
        })
        .options(/.*/)
        .reply(200);

      mynock
        .get(`/article/${payload.id}`)
        .matchHeader('access-token', '')
        .reply(200, { ...payload, title: 'unauthorized' })
        .get(`/article/${payload.id}`)
        .matchHeader('access-token', 'thepassword')
        .reply(200, payload);
    });

    it('should use latest context when making requests', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const wrapper = ({
        children,
        authToken,
      }: React.PropsWithChildren<{
        authToken: string;
      }>) => (
        <AuthContext.Provider value={authToken}>
          {children}
        </AuthContext.Provider>
      );
      const { result, waitForNextUpdate, rerender } = renderRestHook(
        () => {
          return {
            data: useSuspense(ContextAuthdArticleResource.useGet(), {
              id: payload.id,
            }),
            controller: useController(),
            endpoint: ContextAuthdArticleResource.useGet(),
          };
        },
        {
          wrapper,
          initialProps: { authToken: '' },
        },
      );
      // undefined means it threw (suspended)
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.data.title).toBe('unauthorized');
      rerender({ authToken: 'thepassword' });
      const data = await result.current.controller.fetch(
        result.current.endpoint,
        { id: payload.id },
      );
      expect(data).toEqual(payload);
      expect(result.current.data.title).toEqual(payload.title);
      // ensure we don't violate call-order changes
      expect(consoleSpy.mock.calls.length).toBeLessThan(1);
    });
  });
});
