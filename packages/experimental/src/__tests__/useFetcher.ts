import { FutureArticleResource } from '__tests__/new';
import nock from 'nock';
import { useCache, useResource, ResolveType } from '@rest-hooks/core';
import { act } from '@testing-library/react-hooks';

// relative imports to avoid circular dependency in tsconfig references
import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
  FixtureEndpoint,
} from '../../../test';
import useFetcher from '../useFetcher';

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
      .get(`/article-cooler/`)
      .reply(200, nested)

      .post(`/article-cooler/`)
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

  it('should fetch', async () => {
    const { result } = renderRestHook(() => {
      return {
        data: useCache(FutureArticleResource.detail(), payload.id),
        fetch: useFetcher(),
      };
    });
    expect(result.current.data).toBeUndefined();
    let response;
    await act(async () => {
      response = await result.current.fetch(
        FutureArticleResource.detail(),
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
      result.current.fetch(FutureArticleResource.detail());
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.detail(), {
        id: payload.id,
      });
      result.current.fetch(FutureArticleResource.create(), payload);
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.create(), {}, payload);
      result.current.fetch(
        FutureArticleResource.update(),
        { id: payload.id },
        payload,
      );
      // @ts-expect-error
      result.current.fetch(FutureArticleResource.update(), payload);
    };
  });

  it('should update on create', async () => {
    const endpoint = FutureArticleResource.create();
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
          const articles = useResource(FutureArticleResource.list(), {});
          const fetch = useFetcher();
          return { articles, fetch };
        },
        { resolverFixtures },
      );
      await waitForNextUpdate();
      await act(async () => {
        await result.current.fetch(FutureArticleResource.create(), {
          id: 1,
        });
      });

      expect(result.current.articles.map(({ id }) => id)).toEqual([1, 5, 3]);
    }
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
            useResource(FutureArticleResource.detail(), id) ?? null,
            useFetcher(),
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
    expect(data).toBeInstanceOf(FutureArticleResource);
    expect(data?.title).toBe(temppayload.title);
    expect(throws.length).toBe(1);

    mynock
      .persist()
      .get(`/article-cooler/${temppayload.id}`)
      .reply(200, { ...temppayload, title: 'othertitle' });

    expect(throws.length).toBe(1);
    await act(async () => {
      await fetch(FutureArticleResource.delete(), temppayload.id);
      rerender({ id: null });
    });
    expect(throws.length).toBe(1);
    expect(result.current[0]).toBe(null);
  });
});
