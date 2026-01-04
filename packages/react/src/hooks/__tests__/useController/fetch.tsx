import { ResolveType } from '@data-client/core';
import { CacheProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import {
  CoolerArticle,
  CoolerArticleResource,
  FirstUnion,
  FutureArticleResource,
  UnionResource,
} from '__tests__/new';
import nock from 'nock';

import { useCache, useSuspense } from '../..';
// relative imports to avoid circular dependency in tsconfig references
import {
  makeRenderDataClient,
  FixtureEndpoint,
  act,
} from '../../../../../test';
import useController from '../../useController';

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
  ['CacheProvider', CacheProvider],
  ['ExternalDataProvider', ExternalDataProvider],
] as const)(`%s`, (_, makeProvider) => {
  // TODO: add nested resource test case that has multiple partials to test merge functionality

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
    renderDataClient = makeRenderDataClient(makeProvider);
  });

  let errorspy: jest.Spied<any>;
  beforeEach(() => {
    errorspy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    errorspy.mockRestore();
  });
  let warnSpy: jest.Spied<typeof console.warn>;
  afterEach(() => {
    warnSpy.mockRestore();
  });
  beforeEach(() => {
    (warnSpy = jest.spyOn(console, 'warn')).mockImplementation(() => {});
  });

  it('should fetch', async () => {
    const { result } = renderDataClient(() => {
      return {
        data: useCache(FutureArticleResource.get, payload.id),
        fetch: useController().fetch,
      };
    });
    expect(result.current.data).toBeUndefined();
    result.current.fetch(FutureArticleResource.get, payload.id);
    result.current.fetch(FutureArticleResource.get, payload.id);
    result.current.fetch(FutureArticleResource.get, payload.id);
    const response = await result.current.fetch(
      FutureArticleResource.get,
      payload.id,
    );
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.content).toEqual(payload.content);
    expect(response).toEqual(CoolerArticle.fromJS(payload));
    expect(response.content).toBe(payload.content);

    // @ts-expect-error
    () => response.slkdf;

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
    const { result } = renderDataClient(
      () => {
        return {
          data: useCache(FutureArticleResource.get, id),
          fetch: useController().fetch,
        };
      },
      { resolverFixtures: [fixture] },
    );
    expect(result.current.data).toBeUndefined();
    result.current.fetch(FutureArticleResource.get, id);
    result.current.fetch(FutureArticleResource.get, id);
    result.current.fetch(FutureArticleResource.get, id);
    await result.current.fetch(FutureArticleResource.get, id);
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
      const { result, waitForNextUpdate } = renderDataClient(
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
        article.pk();
      });

      expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 1]);
    }
  });

  it('should log error message when user update method throws', async () => {
    const endpoint = FutureArticleResource.create.extend({
      schema: CoolerArticle,
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
    const { result, waitForNextUpdate } = renderDataClient(
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
    });
    // still keeps old list
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3]);

    expect(errorspy.mock.calls[0]).toMatchSnapshot();
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
    const { result, waitForNextUpdate, rerender } = renderDataClient(
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
    // react 19 suspends twice
    expect(throws.length).toBeGreaterThanOrEqual(1);

    mynock
      .persist()
      .get(`/article-cooler/${temppayload.id}`)
      .reply(200, { ...temppayload, title: 'othertitle' });

    // react 19 suspends twice
    expect(throws.length).toBeGreaterThanOrEqual(1);
    await act(async () => {
      await fetch(FutureArticleResource.delete, temppayload.id);
      rerender({ id: null });
    });
    // react 19 suspends twice
    expect(throws.length).toBeGreaterThanOrEqual(1);
    expect(result.current[0]).toBe(null);
  });

  it('should return denormalized value when schema is present', async () => {
    const { controller } = renderDataClient(
      () => {
        return 'hi';
      },
      {
        resolverFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );
    const ret = await controller.fetch(CoolerArticleResource.get, {
      id: payload.id,
    });
    expect(ret.content).toEqual(payload.content);
    expect(ret).toBeInstanceOf(CoolerArticle);
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should return denormalized value when schema is present (delete)', async () => {
    const { controller } = renderDataClient(
      () => {
        return 'hi';
      },
      {
        resolverFixtures: [
          {
            endpoint: CoolerArticleResource.delete,
            args: [{ id: payload.id }],
            response: payload,
          },
        ],
      },
    );
    const ret = await controller.fetch(CoolerArticleResource.delete, {
      id: payload.id,
    });
    expect(ret.content).toEqual(payload.content);
    expect(ret).toBeInstanceOf(CoolerArticle);
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should return undefined when delete response is just an id (no entity in store)', async () => {
    const { controller } = renderDataClient(
      () => {
        return 'hi';
      },
      {
        resolverFixtures: [
          {
            endpoint: CoolerArticleResource.delete,
            args: [{ id: payload.id }],
            response: payload.id,
          },
        ],
      },
    );
    const ret = await controller.fetch(CoolerArticleResource.delete, {
      id: payload.id,
    });
    // When server returns just an id (not the full entity), denormalization
    // returns undefined since the entity was invalidated and removed from store
    expect(ret).toBeUndefined();
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should return denormalized value when schema is present (unions)', async () => {
    const response = [
      null,
      { id: '5', body: 'hi', type: 'first' },
      { id: '6', body: 'hi', type: 'another' },
      { id: '7', body: 'hi' },
    ];
    const { controller } = renderDataClient(
      () => {
        return 'hi';
      },
      {
        resolverFixtures: [
          {
            endpoint: UnionResource.getList,
            args: [],
            response,
          },
        ],
      },
    );
    const ret = await controller.fetch(UnionResource.getList);
    expect(ret[0]).toBeNull();
    expect(ret[1]).toBeInstanceOf(FirstUnion);
    expect(ret[2]).toEqual(response[2]);
    expect(ret[3]).toEqual(response[3]);
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });
});
