import React, { Suspense } from 'react';
import { cleanup, render, testHook } from 'react-testing-library';
import nock from 'nock';
import { normalize } from '../../resource';

import { DispatchContext, StateContext } from '../context';
import {
  CoolerArticleResource,
  UserResource,
  PaginatedArticleResource,
  StaticArticleResource,
} from '../../__tests__/common';
import {
  useFetcher,
  useRetrieve,
  useResource,
  useCache,
  useResultCache,
} from '../hooks';
import { initialState } from '../../state/reducer';
import { State, ActionTypes } from '../../types';
import { Resource, Schema } from '../../resource';
import { ReadShape } from '../../resource';

async function testDispatchFetch(
  Component: React.FunctionComponent,
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

function testRestHook(
  callback: () => void,
  state: State<unknown>,
  dispatch = (v: ActionTypes) => {},
) {
  return testHook(callback, {
    wrapper: ({ children }) => (
      <DispatchContext.Provider value={dispatch}>
        <StateContext.Provider value={state}>{children}</StateContext.Provider>
      </DispatchContext.Provider>
    ),
  });
}

function buildState<S extends Schema>(
  payload: any,
  requestShape: ReadShape<S, any, any>,
  params: object,
): State<Resource> {
  const { entities, result } = normalize(payload, requestShape.schema);
  const url = requestShape.getUrl(params);
  return {
    entities,
    results: {
      [url]: result,
    },
    meta: {
      [url]: {
        date: Date.now(),
        expiresAt: Date.now() + 10000,
      },
    },
  };
}

afterEach(cleanup);

const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};
const articlesPages = {
  prevPage: '23asdl',
  nextPage: 's3f3',
  results: [
    {
      id: 23,
      title: 'the first draft',
      content: 'the best things in life com efree',
      tags: ['one', 'two'],
    },
    {
      id: 44,
      title: 'the second book',
      content: 'the best things in life com efree',
      tags: ['hbh', 'wew'],
    },
    {
      id: 2,
      title: 'the third novel',
      content: 'the best things in life com efree',
      tags: ['free', 'honey'],
    },
    {
      id: 643,
      title: 'a long time ago',
      content: 'the best things in life com efree',
    },
  ],
};
const users = [
  {
    id: 23,
    username: 'bob',
    email: 'bob@bob.com',
    isAdmin: false,
  },
  {
    id: 7342,
    username: 'lindsey',
    email: 'lindsey@bob.com',
    isAdmin: true,
  },
];
function ArticleComponentTester() {
  const article = useResource(CoolerArticleResource.singleRequest(), {
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
      const a = useFetcher(CoolerArticleResource.createRequest());
      a({ content: 'hi' }, {});
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });
  it('should dispatch an action that fetches a partial update', async () => {
    nock('http://test.com')
      .patch(`/article-cooler/1`)
      .reply(200, payload);

    function DispatchTester() {
      const a = useFetcher(CoolerArticleResource.partialUpdateRequest());
      a({ content: 'changed' }, { id: payload.id });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });
  it('should dispatch an action that fetches a full update', async () => {
    nock('http://test.com')
      .put(`/article-cooler/1`)
      .reply(200, payload);

    function DispatchTester() {
      const a = useFetcher(CoolerArticleResource.updateRequest());
      a({ content: 'changed' }, { id: payload.id });
      return null;
    }
    await testDispatchFetch(DispatchTester, [payload]);
  });
});
describe('useCache', () => {
  it('should select singles', async () => {
    let article: any;
    let state = { ...initialState };
    const { rerender } = testHook(
      () =>
        (article = useCache(CoolerArticleResource.singleRequest(), payload)),
      {
        wrapper: ({ children }) => (
          <StateContext.Provider value={state}>
            {children}
          </StateContext.Provider>
        ),
      },
    );
    expect(article).toBe(null);
    state = buildState(payload, CoolerArticleResource.singleRequest(), payload);
    rerender();
    expect(article).toBeTruthy();
    expect(article.title).toBe(payload.title);
  });
  it('should select paginated results', async () => {
    const state = buildState(
      articlesPages,
      PaginatedArticleResource.listRequest(),
      {},
    );
    let articles: any;
    testRestHook(() => {
      articles = useCache(PaginatedArticleResource.listRequest(), {});
    }, state);
    expect(articles).toBeDefined();
    expect(articles.length).toBe(articlesPages.results.length);
    expect(articles[0]).toBeInstanceOf(PaginatedArticleResource);
    expect(articles).toMatchSnapshot();
  });
});
describe('useResultCache', () => {
  it('should be null with nothing in state', () => {
    let results: any;
    let state = { ...initialState };
    const { rerender } = testRestHook(() => {
      results = useResultCache(PaginatedArticleResource.listRequest(), {});
    }, state);
    expect(results).toBe(null);
  });
  it('should send defaults with nothing in state', () => {
    let results: any;
    let state = { ...initialState };
    const defaults = { prevPage: '', nextPage: '' };
    testRestHook(() => {
      results = useResultCache(
        PaginatedArticleResource.listRequest(),
        {},
        defaults,
      );
    }, state);
    expect(results).toEqual(defaults);
  });
  it('should find results', async () => {
    const state = buildState(
      articlesPages,
      PaginatedArticleResource.listRequest(),
      {},
    );
    let results: any;
    testRestHook(() => {
      results = useResultCache(PaginatedArticleResource.listRequest(), {});
    }, state);
    expect(results).toBeTruthy();
    expect(results.nextPage).toBe(articlesPages.nextPage);
    expect(results.prevPage).toBe(articlesPages.prevPage);
    expect(results.results).toEqual(['23', '44', '2', '643']);
  });
});
describe('useRetrieve', () => {
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
  });
  it('should dispatch singles', async () => {
    function FetchTester() {
      useRetrieve(CoolerArticleResource.singleRequest(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });
  it('should not dispatch will null params', async () => {
    const dispatch = jest.fn();
    let params: any = null;
    const { rerender } = testRestHook(
      () => {
        useRetrieve(CoolerArticleResource.singleRequest(), params);
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
      useRetrieve(StaticArticleResource.singleRequest(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });
  it('should dispatch with request shape defined dataExpiryLength', async () => {
    function FetchTester() {
      useRetrieve(StaticArticleResource.longLivingRequest(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });
  it('should dispatch with request shape defined errorExpiryLength', async () => {
    function FetchTester() {
      useRetrieve(StaticArticleResource.neverRetryOnErrorRequest(), payload);
      return null;
    }
    await testDispatchFetch(FetchTester, [payload]);
  });
});

describe('useResource', () => {
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
      const [article, user] = useResource(
        [
          CoolerArticleResource.singleRequest(),
          {
            id: payload.id,
          },
        ],
        [UserResource.listRequest(), {}],
      );
      return null;
    }
    await testDispatchFetch(MultiResourceTester, [payload, users]);
  });
  it('should NOT suspend if result already in cache', () => {
    const state = buildState(
      payload,
      CoolerArticleResource.singleRequest(),
      payload,
    );

    const fbmock = jest.fn();
    function Fallback() {
      fbmock();
      return null;
    }
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
  it('should NOT suspend even when result is stale', () => {
    const { entities, result } = normalize(
      payload,
      CoolerArticleResource.getEntitySchema(),
    );
    const url = CoolerArticleResource.url(payload);
    const state = {
      entities,
      results: {
        [url]: result,
      },
      meta: {
        [url]: {
          date: 0,
          expiresAt: 0,
        },
      },
    };

    const fbmock = jest.fn();
    function Fallback() {
      fbmock();
      return null;
    }
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
});
