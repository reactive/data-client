import { CoolerArticle, FutureArticleResource } from '__tests__/new';
import nock from 'nock';
import { useCache, useSuspense, ResolveType } from '@rest-hooks/core';
import { act } from '@testing-library/react-hooks';

// relative imports to avoid circular dependency in tsconfig references
import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
  FixtureEndpoint,
} from '../../../../test';
import useController from '../../react-integration/hooks/useController';

export const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

export const createPayload = {
  id: 1,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

export const nested = [
  {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
    author: {
      id: 23,
      username: 'bob',
    },
  },
  {
    id: 3,
    title: 'the next time',
    content: 'whatever',
    author: {
      id: 23,
      username: 'charles',
      email: 'bob@bob.com',
    },
  },
];

describe.each([
  ['CacheProvider', makeCacheProvider],
  ['ExternalCacheProvider', makeExternalCacheProvider],
] as const)(`%s`, (_, makeProvider) => {
  // TODO: add nested resource test case that has multiple partials to test merge functionality

  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
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
    renderRestHook = makeRenderRestHook(makeProvider);
  });

  let errorspy: jest.SpyInstance;
  beforeEach(() => {
    errorspy = jest.spyOn(global.console, 'error');
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  it('should fetch', async () => {
    const { result } = renderRestHook(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        fetch: useController().fetch,
      };
    });
    expect(result.current.data).toBeUndefined();
    let response;
    await act(async () => {
      result.current.fetch(FutureArticleResource.get, payload.id);
      result.current.fetch(FutureArticleResource.get, payload.id);
      result.current.fetch(FutureArticleResource.get, payload.id);
      response = await result.current.fetch(
        FutureArticleResource.get,
        payload.id,
      );
    });
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.content).toEqual(payload.content);
    expect(response).toEqual(payload);

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.get);
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.get, {
        id: payload.id,
      });
      result.current.fetch(FutureArticleResource.create, payload);
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.create, {}, payload);
      result.current.fetch(FutureArticleResource.update, payload.id, payload);
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.update, payload);
    };
  });

  it('should fetch with resolver', async () => {
    // we use this id because it is not nock'd
    const id = 10000;
    const fixture = {
      endpoint: FutureArticleResource.get,
      args: [10000],
      response: payload,
    };
    const { result } = renderRestHook(
      () => {
        return {
          data: useCache(FutureArticleResource.get, id),
          fetch: useController().fetch,
        };
      },
      { resolverFixtures: [fixture] },
    );
    expect(result.current.data).toBeUndefined();
    let response;
    await act(async () => {
      result.current.fetch(FutureArticleResource.get, id);
      result.current.fetch(FutureArticleResource.get, id);
      result.current.fetch(FutureArticleResource.get, id);
      response = await result.current.fetch(FutureArticleResource.get, id);
    });
  });

  it('should update on create', async () => {
    const endpoint = FutureArticleResource.create;
    const response: ResolveType<typeof endpoint> = createPayload;
    const fixtures: FixtureEndpoint[] = [
      {
        endpoint,
        args: [{ id: 1 }],
        response,
      },
    ];
    // use nock, and use resolver
    for (const resolverFixtures of [undefined, fixtures]) {
      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const articles = useSuspense(FutureArticleResource.getList);
          const fetch = useController().fetch;
          return { articles, fetch };
        },
        { resolverFixtures },
      );
      await waitForNextUpdate();
      await act(async () => {
        const article = await result.current.fetch(
          FutureArticleResource.create,
          {
            id: 1,
          },
        );
        article.content;
        // @ts-expect-error
        article.asdf;
        // @ts-expect-error
        article.pk;
      });

      expect(result.current.articles.map(({ id }) => id)).toEqual([1, 5, 3]);
    }
  });

  it('should log error message when user update method throws', async () => {
    const endpoint = FutureArticleResource.create.extend({
      update: () => {
        throw new Error('usererror');
      },
    });
    const response: ResolveType<typeof endpoint> = createPayload;
    const fixtures: FixtureEndpoint[] = [
      {
        endpoint,
        args: [{ id: 1 }],
        response,
      },
    ];
    const { result, waitForNextUpdate } = renderRestHook(
      () => {
        const articles = useSuspense(FutureArticleResource.getList);
        const fetch = useController().fetch;
        return { articles, fetch };
      },
      { resolverFixtures: fixtures },
    );
    await waitForNextUpdate();
    await act(async () => {
      await result.current.fetch(endpoint, {
        id: 1,
      });
    }),
      // still keeps old list
      expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3]);

    expect(errorspy.mock.calls).toMatchSnapshot();
  });

  it('should not suspend once deleted and redirected at same time', async () => {
    const temppayload = {
      ...payload,
      id: 1234,
    };
    mynock
      .get(`/article-cooler/${temppayload.id}`)
      .reply(200, temppayload)
      .delete(`/article-cooler/${temppayload.id}`)
      .reply(204, '');
    const throws: Promise<any>[] = [];
    const { result, waitForNextUpdate, rerender } = renderRestHook(
      ({ id }) => {
        try {
          return [
            useSuspense(FutureArticleResource.get, id) ?? null,
            useController().fetch,
          ] as const;
        } catch (e: any) {
          if (typeof e.then === 'function') {
            if (e !== throws[throws.length - 1]) {
              throws.push(e);
            }
          }
          throw e;
        }
      },
      { initialProps: { id: temppayload.id as number | null } },
    );
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    const [data, fetch] = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data?.title).toBe(temppayload.title);
    expect(throws.length).toBe(1);

    mynock
      .persist()
      .get(`/article-cooler/${temppayload.id}`)
      .reply(200, { ...temppayload, title: 'othertitle' });

    expect(throws.length).toBe(1);
    await act(async () => {
      await fetch(FutureArticleResource.delete, temppayload.id);
      rerender({ id: null });
    });
    expect(throws.length).toBe(1);
    expect(result.current[0]).toBe(null);
  });
});
