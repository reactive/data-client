import {
  CoolerArticleResource,
  UserResource,
  InvalidIfStaleArticleResource,
  photoShape,
  noEntitiesShape,
  ArticleTimedResource,
} from '__tests__/common';
import { createEntityMeta } from '__tests__/utils';
import { State, ReadShape } from '@rest-hooks/core';
import { initialState } from '@rest-hooks/core/state/reducer';
import React, { Suspense } from 'react';
import { render } from '@testing-library/react';
import nock from 'nock';

// relative imports to avoid circular dependency in tsconfig references

import { normalize, SimpleRecord } from '@rest-hooks/normalizr';

import {
  makeRenderRestHook,
  makeCacheProvider,
  mockInitialState,
} from '../../../../test';
import { DispatchContext, StateContext } from '../context';
import { useResource } from '../hooks';
import { payload, users, nested } from '../test-fixtures';

async function testDispatchFetch(
  Component: React.FunctionComponent<any>,
  payloads: any[],
) {
  const dispatch = jest.fn();
  const tree = (
    <DispatchContext.Provider value={dispatch}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </DispatchContext.Provider>
  );
  render(tree);
  expect(dispatch).toHaveBeenCalled();
  expect(dispatch.mock.calls.length).toBe(payloads.length);
  let i = 0;
  for (const call of dispatch.mock.calls) {
    expect(call[0]).toMatchSnapshot();
    const action = call[0];
    const res = await action.payload();
    expect(res).toEqual(payloads[i]);
    i++;
  }
}

function ArticleComponentTester({ invalidIfStale = false }) {
  const resource = invalidIfStale
    ? InvalidIfStaleArticleResource
    : CoolerArticleResource;
  const article = useResource(resource.detailShape(), {
    id: payload.id,
  });
  return (
    <div>
      <h3>{article.title}</h3>
      <p>{article.content}</p>
    </div>
  );
}

describe('useResource()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  const fbmock = jest.fn();

  async function testMalformedResponse(
    payload: any,
    fetchShape: ReadShape<any> = CoolerArticleResource.detailShape(),
  ) {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/400`)
      .reply(200, payload);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(fetchShape, {
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
      .get(`/article-cooler/`)
      .reply(200, nested)
      .get(`/user/`)
      .reply(200, users);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });
  afterEach(() => {
    try {
      renderRestHook.cleanup();
    } catch (e) {
      console.log('error in cleanup');
    }
  });

  it('should dispatch an action that fetches', async () => {
    await testDispatchFetch(ArticleComponentTester, [payload]);
  });

  it('should dispatch fetch when sent multiple arguments', async () => {
    function MultiResourceTester() {
      const [article, user] = useResource(
        [
          CoolerArticleResource.detailShape(),
          {
            id: payload.id,
          },
        ],
        [UserResource.listShape(), {}],
      );
      return null;
    }
    await testDispatchFetch(MultiResourceTester, [payload, users]);
  });
  it('should throw same promise until both resolve', async () => {
    const renderRestHook = makeRenderRestHook(makeCacheProvider);
    jest.useFakeTimers();
    nock('http://test.com')
      .get(`/article-cooler/${payload.id}`)
      .delay(1000)
      .reply(200, payload);
    nock('http://test.com').get(`/user/`).delay(2000).reply(200, users);

    function MultiResourceTester() {
      try {
        const [article, user] = useResource(
          [
            CoolerArticleResource.detailShape(),
            {
              id: payload.id,
            },
          ],
          [UserResource.listShape(), {}],
        );
        return article;
      } catch (e) {
        // TODO: we're not handling suspense properly so react complains
        // When upgrading test util we should be able to fix this as we'll suspense ourselves.
        if (typeof e.then === 'function') {
          return e;
        } else {
          throw e;
        }
      }
    }
    const { rerender, result } = renderRestHook(MultiResourceTester);
    const firstPromise = result.current;
    expect(firstPromise).toBeDefined();
    expect(typeof firstPromise.then).toBe('function');

    jest.advanceTimersByTime(50);
    rerender();
    expect(result.current).toBe(firstPromise);
    jest.advanceTimersByTime(1000);
    rerender();
    expect(result.current).toBe(firstPromise);
    jest.advanceTimersByTime(2000);
    rerender();
    expect(result.current).toBe(firstPromise);

    // TODO: we're not handling suspense properly so react complains
    // When upgrading test util we should be able to fix this as we'll suspense ourselves.
    const oldError = console.error;
    console.error = () => {};
    jest.runAllTimers();
    await result.current;
    rerender();
    expect(result.current).toMatchInlineSnapshot(`
      CoolerArticleResource {
        "author": null,
        "content": "whatever",
        "id": 5,
        "tags": Array [
          "a",
          "best",
          "react",
        ],
        "title": "hi ho",
      }
    `);
    // eslint-disable-next-line require-atomic-updates
    console.error = oldError;
  });
  it('should NOT suspend if result already in cache and options.invalidIfStale is false', () => {
    const state: State<unknown> = mockInitialState([
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
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
    const { entities, result } = normalize(payload, CoolerArticleResource);
    const fetchKey = CoolerArticleResource.detailShape().getFetchKey(payload);
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

    const tree = (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={() => Promise.resolve()}>
          <Suspense fallback={<Fallback />}>
            <ArticleComponentTester />
          </Suspense>{' '}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
    const { getByText } = render(tree);
    expect(fbmock).not.toBeCalled();
    const title = getByText(payload.title);
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H3');
  });
  it('should NOT suspend if result is not stale and options.invalidIfStale is true', () => {
    const { entities, result } = normalize(
      payload,
      InvalidIfStaleArticleResource,
    );
    const fetchKey = InvalidIfStaleArticleResource.detailShape().getFetchKey(
      payload,
    );

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
    const { entities, result } = normalize(
      payload,
      InvalidIfStaleArticleResource,
    );
    const fetchKey = InvalidIfStaleArticleResource.detailShape().getFetchKey(
      payload,
    );
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

    const tree = (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={() => Promise.resolve()}>
          <Suspense fallback={<Fallback />}>
            <ArticleComponentTester invalidIfStale />
          </Suspense>
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
    render(tree);
    expect(fbmock).toHaveBeenCalled();
  });

  // taken from integration
  it('should throw errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(CoolerArticleResource.detailShape(), {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });

  it('should throw errors on bad network (multiarg)', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource([
        CoolerArticleResource.detailShape(),
        {
          title: '0',
        },
      ]);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });

  it('should suspend when already has a network error', async () => {
    const error: any = { message: 'network error', status: 400 };
    const FS = { ...CoolerArticleResource.detailShape() };
    FS.options = { ...FS.options, errorExpiryLength: -100 };
    const { result, waitForNextUpdate } = renderRestHook(
      () => {
        return useResource(CoolerArticleResource.detailShape(), {
          id: '0',
        });
      },
      {
        results: [
          {
            request: FS,
            params: {
              id: '0',
            },
            result: error,
            error: true,
          },
        ],
      },
    );
    expect(result.current).toBeUndefined();
    expect(result.error).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });

  it('should suspend when already has a network error (multiarg)', async () => {
    const error: any = { message: 'network error', status: 400 };
    const expiredShape = { ...CoolerArticleResource.detailShape() };
    expiredShape.options = { ...expiredShape.options, errorExpiryLength: -100 };
    const { result, waitForNextUpdate } = renderRestHook(
      () => {
        return useResource([
          CoolerArticleResource.detailShape(),
          {
            id: '0',
          },
        ]);
      },
      {
        results: [
          {
            request: expiredShape,
            params: {
              id: '0',
            },
            result: error,
            error: true,
          },
        ],
      },
    );
    expect(result.current).toBeUndefined();
    expect(result.error).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });

  // We need to ensure we don't suspend when error is based on network response
  // as we don't expect another network call to fix it.
  // (fixes infinite loop with badly defined schemas)
  it('should throw error when response is bad (on mount)', async () => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/4000`)
      .reply(200, { data: null });

    class Scheme extends SimpleRecord {
      data: CoolerArticleResource = CoolerArticleResource.fromJS();
      optional: UserResource | null = null;
      static schema = {
        data: CoolerArticleResource,
        optional: UserResource,
      };
    }
    const shape = {
      ...CoolerArticleResource.detailShape(),
      schema: Scheme,
    };
    const expiredShape = { ...shape };
    expiredShape.options = { ...expiredShape.options, dataExpiryLength: -100 };

    const { result, rerender } = renderRestHook(
      () => {
        return useResource(shape, {
          id: '4000',
        });
      },
      {
        results: [
          {
            request: expiredShape,
            params: {
              id: '4000',
            },
            result: { data: null },
          },
        ],
      },
    );

    const firsterror = result.error;
    expect(result.error).not.toBe(null);
    expect((result.error as any).status).toBe(400);
    expect(result.error).toMatchSnapshot();
    rerender();
    expect(result.error).not.toBe(null);
    expect((result.error as any).status).toBe(400);
    expect(result.error).not.toBe(firsterror);
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

  it('should throw error when response is string when expecting nested entity', async () => {
    const shape = {
      ...CoolerArticleResource.detailShape(),
      schema: { data: CoolerArticleResource },
    };
    await testMalformedResponse('hi', shape);
  });

  it('should throw error when response is nested string when expecting nested entity', async () => {
    const shape = {
      ...CoolerArticleResource.detailShape(),
      schema: { data: CoolerArticleResource },
    };
    await testMalformedResponse({ data: 5, parcel: 2 }, shape);
  });

  it('should throw error when response is nested missing id when expecting nested entity', async () => {
    const shape = {
      ...CoolerArticleResource.detailShape(),
      schema: { data: CoolerArticleResource },
    };
    await testMalformedResponse(
      { data: { ...payload, id: undefined }, parcel: 2 },
      shape,
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
    const shape = {
      ...CoolerArticleResource.detailShape(),
      schema: Scheme,
    };
    await testMalformedResponse({ data: null }, shape);
  });

  it('should resolve parallel useResource() request', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(
        [
          CoolerArticleResource.detailShape(),
          {
            id: payload.id,
          },
        ],
        [UserResource.listShape(), {}],
      );
    });
    await waitForNextUpdate();
    const [article, users] = result.current;
    expect(article instanceof CoolerArticleResource).toBe(true);
    expect(article.title).toBe(payload.title);
    expect(users).toBeDefined();
    expect(users.length).toBeTruthy();
    expect(users[0] instanceof UserResource).toBe(true);
  });

  it('should not suspend with no params to useResource()', () => {
    let article: any;
    const { result } = renderRestHook(() => {
      article = useResource(CoolerArticleResource.detailShape(), null);
      return 'done';
    });
    expect(result.current).toBe('done');
    expect(article).toBeUndefined();
  });

  it('should work with shapes with no entities', async () => {
    const userId = '5';
    const response = { firstThing: '', someItems: [{ a: 5 }] };
    nock(/.*/)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(`/users/${userId}/simple`)
      .reply(200, response);
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(noEntitiesShape, { userId });
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
      return useResource(photoShape, { userId });
    });
    // undefined means it threw
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toStrictEqual(response);
  });

  it('should work with Serializable shapes', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(ArticleTimedResource.detailShape(), payload);
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
    expect(result.current).toBeInstanceOf(ArticleTimedResource);
  });
});
