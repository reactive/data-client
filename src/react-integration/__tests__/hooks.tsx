import React, { Suspense, useEffect } from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import nock from 'nock';
import { normalize } from '../../resource';

import { DispatchContext, StateContext } from '../context';
import {
  CoolerArticleResource,
  UserResource,
  PaginatedArticleResource,
  ArticleResourceWithOtherListUrl,
  StaticArticleResource,
  InvalidIfStaleArticleResource,
} from '../../__tests__/common';
import {
  useFetcher,
  useRetrieve,
  useResourceLegacy,
  useCacheLegacy,
  useInvalidator,
  useResetter,
} from '../hooks';
import { initialState } from '../../state/reducer';
import { State, ActionTypes } from '../../types';
import makeRenderRestHook from '../../test/makeRenderRestHook';
import { makeCacheProvider } from '../../test/providers';
import mockInitialState from '../../test/mockState';
import { users, articlesPages, payload } from './fixtures';

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
  expect(dispatch).toHaveBeenCalledTimes(payloads.length);
  let i = 0;
  for (const call of dispatch.mock.calls) {
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
    wrapper: function Wrapper({ children }) {
      return (
        <DispatchContext.Provider value={dispatch}>
          <StateContext.Provider value={state}>
            {children}
          </StateContext.Provider>
        </DispatchContext.Provider>
      );
    },
  });
}

function ArticleComponentTester({ invalidIfStale = false }) {
  const resource = invalidIfStale
    ? InvalidIfStaleArticleResource
    : CoolerArticleResource;
  const article = useResourceLegacy(resource.detailShape(), {
    id: payload.id,
  });
  return (
    <div>
      <h3>{article.title}</h3>
      <p>{article.content}</p>
    </div>
  );
}

describe('useFetcher', () => {
  const payload = { id: 1, content: 'hi' };

  it('should dispatch an action that fetches a create', async () => {
    nock('http://test.com')
      .post(`/article-cooler/`)
      .reply(201, payload);

    function DispatchTester() {
      const a = useFetcher(CoolerArticleResource.createShape());
      a({}, { content: 'hi' });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should dispatch an action with updater in the meta if update shapes params are passed in', async () => {
    nock('http://test.com')
      .post(`/article-cooler/`)
      .reply(201, payload);

    function DispatchTester() {
      const create = useFetcher(CoolerArticleResource.createShape());
      const params = { content: 'hi' };
      create({}, params, [
        [
          CoolerArticleResource.listShape(),
          {},
          (article: any, articles: any) => [...articles, article],
        ],
      ]);
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should dispatch an action with multiple updaters in the meta if update shapes params are passed in', async () => {
    nock('http://test.com')
      .post(`/article/`)
      .reply(201, payload);

    function DispatchTester() {
      const create = useFetcher(ArticleResourceWithOtherListUrl.createShape());
      const params = { content: 'hi' };
      create({}, params, [
        [
          ArticleResourceWithOtherListUrl.listShape(),
          {},
          (article: any, articles: any) => [...articles, article],
        ],
        [
          ArticleResourceWithOtherListUrl.otherListShape(),
          {},
          (article: any, articles: any) => [...articles, article],
        ],
      ]);
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should console.error() a warning when fetching without a Provider', () => {
    const oldError = console.error;
    const spy = (console.error = jest.fn());
    renderHook(() => {
      const a = useFetcher(CoolerArticleResource.createShape());
      a({}, { content: 'hi' });
      return null;
    });
    expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "It appears you are trying to use Rest Hooks without a provider.
      Follow instructions: https://resthooks.io/docs/getting-started/installation#add-provider-at-top-level-component",
      ]
    `);
    console.error = oldError;
  });

  it('should dispatch an action that fetches a partial update', async () => {
    nock('http://test.com')
      .patch(`/article-cooler/1`)
      .reply(200, payload);

    function DispatchTester() {
      const a = useFetcher(CoolerArticleResource.partialUpdateShape());
      a({ id: payload.id }, { content: 'changed' });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });

  it('should dispatch an action that fetches a full update', async () => {
    nock('http://test.com')
      .put(`/article-cooler/1`)
      .reply(200, payload);

    function DispatchTester() {
      const a = useFetcher(CoolerArticleResource.updateShape());
      a({ id: payload.id }, { content: 'changed' });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });
});

describe('useInvalidate', () => {
  it('should not invalidate anything if params is null', () => {
    const state = mockInitialState([
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ]);
    const dispatch = jest.fn();
    let invalidate: any;
    testRestHook(
      () => {
        invalidate = useInvalidator(PaginatedArticleResource.listShape());
      },
      state,
      dispatch,
    );
    invalidate(null);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('should return a function that dispatches an action to invalidate a resource', () => {
    const state = mockInitialState([
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ]);
    const dispatch = jest.fn();
    let invalidate: any;
    testRestHook(
      () => {
        invalidate = useInvalidator(PaginatedArticleResource.listShape());
      },
      state,
      dispatch,
    );
    invalidate({});
    expect(dispatch).toHaveBeenCalledWith({
      type: 'rest-hooks/invalidate',
      meta: {
        url: 'GET http://test.com/article-paginated/',
      },
    });
  });
  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const invalidate = useInvalidator(PaginatedArticleResource.listShape());
      useEffect(track, [invalidate]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});

describe('useResetter', () => {
  it('should return a function that dispatches an action to reset the cache', () => {
    const state = mockInitialState([
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ]);
    const dispatch = jest.fn();
    let reset: any;
    testRestHook(
      () => {
        reset = useResetter();
      },
      state,
      dispatch,
    );
    reset({});
    expect(dispatch).toHaveBeenCalledWith({
      type: 'rest-hooks/reset',
    });
  });
  it('should return the same === function each time', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => {
      const reset = useResetter();
      useEffect(track, [reset]);
    });
    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 4; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});

describe('useCacheLegacy', () => {
  it('should select singles', () => {
    let article: any;
    let state = { ...initialState };
    const { rerender } = renderHook(
      () =>
        (article = useCacheLegacy(
          CoolerArticleResource.detailShape(),
          payload,
        )),
      {
        wrapper: function Wrapper({ children }) {
          return (
            <StateContext.Provider value={state}>
              {children}
            </StateContext.Provider>
          );
        },
      },
    );
    expect(article).toBe(null);
    state = mockInitialState([
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ]);
    rerender();
    expect(article).toBeTruthy();
    expect(article.title).toBe(payload.title);
  });

  it('should select paginated results', () => {
    const state = mockInitialState([
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ]);
    let articles: any;
    testRestHook(() => {
      articles = useCacheLegacy(PaginatedArticleResource.listShape(), {});
    }, state);
    expect(articles).toBeDefined();
    expect(articles.length).toBe(articlesPages.results.length);
    expect(articles[0]).toBeInstanceOf(PaginatedArticleResource);
    expect(articles).toMatchSnapshot();
  });

  it('should return identical value no matter how many re-renders', () => {
    const state = mockInitialState([
      {
        request: PaginatedArticleResource.listShape(),
        params: {},
        result: articlesPages,
      },
    ]);
    const track = jest.fn();

    const { rerender } = testRestHook(() => {
      const articles = useCacheLegacy(PaginatedArticleResource.listShape(), {});
      useEffect(track, [articles]);
    }, state);

    expect(track.mock.calls.length).toBe(1);
    for (let i = 0; i < 2; ++i) {
      rerender();
    }
    expect(track.mock.calls.length).toBe(1);
  });
});

describe('useRetrieve', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    nock('http://test.com')
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload);
    nock('http://test.com')
      .get(`/article-static/${payload.id}`)
      .reply(200, payload);
    nock('http://test.com')
      .get(`/user/`)
      .reply(200, users);
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });
  afterEach(() => {
    nock.cleanAll();
    renderRestHook.cleanup();
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
    nock('http://test.com')
      .get(`/article-cooler/${payload.id}`)
      .reply(200, fetchMock)
      .persist();
    const results: any[] = [
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ];
    const { result, rerender } = renderRestHook(
      () => {
        return useRetrieve(CoolerArticleResource.detailShape(), payload);
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

describe('useResourceLegacy()', () => {
  const fbmock = jest.fn();

  function Fallback() {
    fbmock();
    return null;
  }

  beforeEach(() => {
    nock('http://test.com')
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload);
    nock('http://test.com')
      .get(`/user/`)
      .reply(200, users);
  });

  it('should dispatch an action that fetches', async () => {
    await testDispatchFetch(ArticleComponentTester, [payload]);
  });

  it('should dispatch fetch when sent multiple arguments', async () => {
    function MultiResourceTester() {
      const [article, user] = useResourceLegacy(
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
    nock('http://test.com')
      .get(`/user/`)
      .delay(2000)
      .reply(200, users);

    function MultiResourceTester() {
      try {
        const [article, user] = useResourceLegacy(
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
    // When upgrading test until we should be able to fix this as we'll suspense ourselves.
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
    const state = mockInitialState([
      {
        request: CoolerArticleResource.detailShape(),
        params: payload,
        result: payload,
      },
    ]);

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
    const { entities, result } = normalize(
      payload,
      CoolerArticleResource.getEntitySchema(),
    );
    const fetchKey = CoolerArticleResource.detailShape().getFetchKey(payload);
    const state = {
      entities,
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
      InvalidIfStaleArticleResource.getEntitySchema(),
    );
    const fetchKey = InvalidIfStaleArticleResource.detailShape().getFetchKey(
      payload,
    );
    const state = {
      entities,
      results: {
        [fetchKey]: result,
      },
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
      InvalidIfStaleArticleResource.getEntitySchema(),
    );
    const fetchKey = InvalidIfStaleArticleResource.detailShape().getFetchKey(
      payload,
    );
    const state = {
      entities,
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
            <ArticleComponentTester invalidIfStale />
          </Suspense>
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
    render(tree);
    expect(fbmock).toHaveBeenCalled();
  });
});
