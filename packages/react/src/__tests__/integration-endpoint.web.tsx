import { DataProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import {
  Entity,
  Endpoint,
  Values,
  All,
  Query,
  Union,
  Collection,
} from '@data-client/rest';
import {
  CoolerArticleResource,
  EditorArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  CoolerArticleDetail,
  TypedArticleResource,
  UnionResource,
  CoolerArticle,
  FirstUnion,
  PaginatedArticle,
  CoolerArticleResourceFromMixin,
} from '__tests__/new';
import nock from 'nock';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderDataHook, act } from '../../../test';
import {
  useCache,
  useController,
  useFetch,
  useQuery,
  useSuspense,
} from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
  valuesFixture,
  editorPayload,
} from '../test-fixtures';

let errorspy: jest.Spied<any>;
beforeEach(() => {
  errorspy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
  jest.spyOn(global.console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  errorspy.mockRestore();
});

describe.each([
  ['DataProvider', DataProvider],
  ['ExternalDataProvider', ExternalDataProvider],
] as const)(`%s`, (_, makeProvider) => {
  // TODO: add nested resource test case that has multiple partials to test merge functionality
  let renderDataHook: ReturnType<typeof makeRenderDataHook>;
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
      .delete(`/user/23`)
      .reply(204, '')
      .get(`/article-cooler/0`)
      .reply(403, {})
      .get(`/article-cooler/500`)
      .reply(500, { message: 'server failure' })
      .get(`/article-cooler/666`)
      .reply(200, '')
      .get(`/article-cooler`)
      .reply(200, nested)
      .get(`/article-cooler?tags=a`)
      .reply(200, nested)
      .get(`/article-cooler/values`)
      .reply(200, valuesFixture)
      .post(`/article-cooler`)
      .reply(200, (uri, body: any) => ({ ...createPayload, ...body }))
      .get(`/user`)
      .reply(200, users)
      .get(`/article-cooler/withEditor`)
      .reply(200, editorPayload);

    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderDataHook = makeRenderDataHook(makeProvider);
  });

  describe('Endpoint', () => {
    it('should resolve await', async () => {
      const result = await CoolerArticleDetail(payload);
      expect(result.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.lafsjlfd).toBeUndefined();
    });

    it('should resolve useSuspense()', async () => {
      const { result, waitForNextUpdate } = renderDataHook(() => {
        const a = useSuspense(CoolerArticleDetail, payload);
        return a;
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.current.lafsjlfd).toBeUndefined();
    });

    it.each([CoolerArticleResource, CoolerArticleResourceFromMixin])(
      'should resolve useSuspense() with Interceptors',
      async ArticleResource => {
        nock.cleanAll();
        const { result, waitFor, controller } = renderDataHook(
          () => {
            return useSuspense(ArticleResource.get, { id: 'abc123' });
          },
          {
            resolverFixtures: [
              {
                endpoint: ArticleResource.get,
                response: ({ id }) => ({ ...payload, id }),
              },
              {
                endpoint: ArticleResource.partialUpdate,
                response: ({ id }, body) => ({ ...body, id }),
                delay: () => 1,
              },
            ],
          },
        );
        expect(result.current).toBeUndefined();
        await waitFor(() => expect(result.current).toBeDefined());
        expect(result.current.title).toBe(payload.title);
        // @ts-expect-error
        expect(result.current.lafsjlfd).toBeUndefined();
        await controller.fetch(
          ArticleResource.partialUpdate,
          { id: 'abc123' },
          { title: 'updated title' },
        );
        expect(result.current.title).toBe('updated title');
      },
    );

    it('should maintain global referential equality', async () => {
      const { result, waitForNextUpdate } = renderDataHook(() => {
        return [
          useSuspense(CoolerArticleDetail, payload),
          useCache(CoolerArticleDetail, payload),
        ] as const;
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current[0]?.title).toBe(payload.title);
      expect(result.current[0]).toBe(result.current[1]);
    });

    it('should gracefully abort in useSuspense()', async () => {
      const abort = new AbortController();
      const AbortableArticle = CoolerArticleResource.get.extend({
        signal: abort.signal,
      });

      const { result, waitForNextUpdate } = renderDataHook(() => {
        return {
          data: useSuspense(AbortableArticle, { id: payload.id }),
          fetch: useController().fetch,
        };
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.data.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.current.data.lafsjlfd).toBeUndefined();
      const promise = result.current.fetch(AbortableArticle, payload);
      abort.abort();
      await expect(promise).rejects.toMatchSnapshot();
      expect(result.error).toBeUndefined();
      expect(result.current.data.title).toBe(payload.title);
    });
  });

  describe('renderDataClient()', () => {
    let warnspy: jest.Spied<any>;
    beforeEach(() => {
      warnspy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnspy.mockRestore();
    });

    it('should resolve useSuspense()', async () => {
      const { result, waitForNextUpdate } = renderDataHook(() => {
        return useSuspense(CoolerArticleResource.get, { id: payload.id });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current instanceof CoolerArticle).toBe(true);
      expect(result.current.title).toBe(payload.title);
      expect(warnspy).not.toHaveBeenCalled();
      // @ts-expect-error
      expect(result.current.lafsjlfd).toBeUndefined();
    });
  });

  it('should denormalize schema.Values()', async () => {
    const GetValues = CoolerArticleResource.get.extend({
      schema: new Values(CoolerArticle),
      path: `${CoolerArticleResource.getList.path}/values` as const,
    });

    const { result, waitForNextUpdate } = renderDataHook(() => {
      return useSuspense(GetValues);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    Object.keys(result.current).forEach(k => {
      expect(result.current[k] instanceof CoolerArticle).toBe(true);
      expect(result.current[k].title).toBeDefined();
      // @ts-expect-error
      expect(result.current[k].doesnotexist).toBeUndefined();
    });
  });

  it('should denormalize All', async () => {
    const getList = CoolerArticleResource.getList.extend({
      schema: new All(CoolerArticle),
    });
    const allArticles = new All(CoolerArticle);

    const { result, waitForNextUpdate } = renderDataHook(() => {
      useFetch(getList);
      return useQuery(allArticles);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toBeDefined();
    result.current?.forEach(article => {
      expect(article instanceof CoolerArticle).toBe(true);
      expect(article.title).toBeDefined();
      // @ts-expect-error
      expect(article.doesnotexist).toBeUndefined();
    });
  });

  it('should filter Query based on arguments', async () => {
    const queryArticle = new Query(
      new All(CoolerArticle),
      (entries, { tags }: { tags: string }) => {
        if (!tags) return entries;
        return entries.filter(article => article.tags.includes(tags));
      },
    );

    const { result, waitForNextUpdate, rerender, controller } = renderDataHook(
      ({ tags }: { tags: string }) => {
        useFetch(CoolerArticleResource.getList);
        return useQuery(queryArticle, { tags });
      },
      { initialProps: { tags: 'a' } },
    );
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toBeDefined();
    expect(result.current?.length).toBe(1);
    expect(result.current).toMatchSnapshot();

    await act(
      async () =>
        await controller.fetch(CoolerArticleResource.create, {
          id: 1000,
          title: 'bob says',
          tags: ['a'],
        }),
    );
    await act(
      async () =>
        await controller.fetch(CoolerArticleResource.create, {
          id: 2000,
          title: 'should not exist',
          tags: [],
        }),
    );
    expect(result.current).toBeDefined();
    // should only include the one with the tag
    expect(result.current?.length).toBe(2);
    expect(result.current).toMatchSnapshot();
    rerender({ tags: '' });
    expect(result.current).toBeDefined();
    // should not need to fetch as data already provided
    // with no tags should include all entries
    expect(result.current?.length).toBe(4);
    expect(result.current).toMatchSnapshot();
  });

  it('Query should work as endpoint Schema', async () => {
    const queryArticle = new Query(
      CoolerArticleResource.getList.schema,
      (entries, { tags }: { tags: string }) => {
        if (!tags || !entries) return entries;
        return entries.filter(article => article.tags.includes(tags));
      },
    );
    const getList = CoolerArticleResource.getList.extend({
      schema: queryArticle,
    });

    const { result, waitForNextUpdate, controller } = renderDataHook(
      ({ tags }: { tags: string }) => {
        return useSuspense(getList, { tags });
      },
      { initialProps: { tags: 'a' } },
    );
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toBeDefined();
    expect(result.current?.length).toBe(1);

    expect(result.current).toMatchSnapshot();

    await act(
      async () =>
        await controller.fetch(getList.push, {
          id: 1000,
          title: 'bob says',
          tags: ['a'],
        }),
    );
    await act(
      async () =>
        await controller.fetch(getList.push, {
          id: 2000,
          title: 'should not exist',
          tags: [],
        }),
    );
    expect(result.current).toBeDefined();
    // should only include the one with the tag
    expect(result.current?.length).toBe(2);
    expect(result.current).toMatchSnapshot();
  });

  it('should denormalize schema.Union()', async () => {
    class IDEntity extends Entity {
      readonly id: string = '';
      pk() {
        return this.id;
      }
    }
    class User extends IDEntity {
      readonly type = 'user';
      readonly username: string = '';
    }
    class Group extends IDEntity {
      readonly type = 'group';
      readonly groupname: string = '';
      readonly memberCount = 0;
    }
    const unionEndpoint = new Endpoint((a: any) => Promise.resolve(), {
      schema: [
        new Union(
          {
            users: User,
            groups: Group,
          },
          'type',
        ),
      ],
    });

    const { result } = renderDataHook(
      () => {
        return useSuspense(unionEndpoint, {});
      },
      {
        initialFixtures: [
          {
            endpoint: unionEndpoint,
            args: [{}],
            response: [
              { id: '1', type: 'users', username: 'bob' },
              { id: '2', type: 'groups', grouname: 'fast', memberCount: 5 },
            ],
          },
        ],
      },
    );
    result.current.forEach(item => {
      expect(item instanceof IDEntity).toBe(true);
      expect(item.type).toBeDefined();
      // @ts-expect-error
      expect(item.doesnotexist).toBeUndefined();

      // test union discrimination
      if ('username' in item) {
        expect(item.username).toBeDefined();
        // @ts-expect-error
        expect(item.memberCount).toBeUndefined();
      } else {
        expect(item.memberCount).toBeDefined();
        // @ts-expect-error
        expect(item.username).toBeUndefined();
      }
    });
  });

  it('should passthrough union with unexpected schema attribute', () => {
    const prevWarn = global.console.warn;
    global.console.warn = jest.fn();

    const response = [
      null,
      { id: '5', body: 'hi', type: 'first' },
      { id: '5', body: 'hi', type: 'another' },
      { id: '5', body: 'hi' },
    ];
    const { result } = renderDataHook(
      () => {
        return useSuspense(UnionResource.getList);
      },
      {
        initialFixtures: [
          {
            endpoint: UnionResource.getList,
            args: [],
            response,
          },
        ],
      },
    );
    expect(result.current).toBeDefined();
    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBeInstanceOf(FirstUnion);
    expect(result.current[2]).not.toBeInstanceOf(FirstUnion);
    expect(result.current[3]).not.toBeInstanceOf(FirstUnion);
    // should still passthrough objects
    expect(result.current[2]).toEqual(result.current[2]);
    expect(result.current[3]).toEqual(result.current[3]);
    expect((global.console.warn as jest.Mock).mock.calls).toMatchSnapshot();
    global.console.warn = prevWarn;
  });

  it.each([CoolerArticleResource, CoolerArticleResourceFromMixin])(
    'should suspend once deleted (%#)',
    async ArticleResource => {
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
      const { result, waitForNextUpdate, waitFor, controller } = renderDataHook(
        () => {
          try {
            return useSuspense(ArticleResource.get, {
              id: temppayload.id,
            });
          } catch (e: any) {
            if (typeof e.then === 'function') {
              if (e !== throws[throws.length - 1]) {
                throws.push(e);
              }
            }
            throw e;
          }
        },
      );
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      let data = result.current;
      expect(data).toBeInstanceOf(ArticleResource.get.schema);
      expect(data.title).toBe(temppayload.title);
      // react 19 suspends twice
      expect(throws.length).toBeGreaterThanOrEqual(1);

      mynock
        .persist()
        .get(`/article-cooler/${temppayload.id}`)
        .reply(200, { ...temppayload, title: 'othertitle' });

      await act(async () => {
        await controller.fetch(ArticleResource.delete, { id: temppayload.id });
      });
      expect(throws.length).toBeGreaterThanOrEqual(2); //TODO: delete seems to have receive process multiple times. we suspect this is because of test+act integration.
      await Promise.race([
        waitFor(() => expect(data.title).toBe('othertitle')),
        throws[throws.length - 1],
      ]);
      data = result.current;
      expect(data).toBeInstanceOf(ArticleResource.get.schema);
    },
  );

  it('should suspend once deleted (Union schema)', async () => {
    const unionPayload = {
      id: '9999',
      body: 'test body',
      type: 'first' as const,
    };
    mynock
      .get(`/union/${unionPayload.id}`)
      .reply(200, unionPayload)
      .delete(`/union/${unionPayload.id}`)
      .reply(200, unionPayload); // Return the full payload so Invalidate knows which entity to invalidate
    const throws: Promise<any>[] = [];
    const { result, waitForNextUpdate, waitFor, controller } = renderDataHook(
      () => {
        try {
          return useSuspense(UnionResource.get, {
            id: unionPayload.id,
          });
        } catch (e: any) {
          if (typeof e.then === 'function') {
            if (e !== throws[throws.length - 1]) {
              throws.push(e);
            }
          }
          throw e;
        }
      },
    );
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    let data = result.current;
    expect(data).toBeInstanceOf(FirstUnion);
    expect(data.body).toBe(unionPayload.body);
    // react 19 suspends twice
    expect(throws.length).toBeGreaterThanOrEqual(1);

    mynock
      .persist()
      .get(`/union/${unionPayload.id}`)
      .reply(200, { ...unionPayload, body: 'refetched body' });

    await act(async () => {
      await controller.fetch(UnionResource.delete, { id: unionPayload.id });
    });
    // Should have suspended after delete (entity invalidated)
    expect(throws.length).toBeGreaterThanOrEqual(2);
    await Promise.race([
      waitFor(() => expect(data.body).toBe('refetched body')),
      throws[throws.length - 1],
    ]);
    data = result.current;
    expect(data).toBeInstanceOf(FirstUnion);
  });

  it('should remove deleted item from Union collection (getList)', async () => {
    const unionPayloads = [
      { id: '101', body: 'first item', type: 'first' as const },
      { id: '102', body: 'second item', type: 'second' as const },
      { id: '103', body: 'third item', type: 'first' as const },
    ];
    mynock
      .get(`/union`)
      .reply(200, unionPayloads)
      .delete(`/union/102`)
      .reply(200, unionPayloads[1]); // Return the deleted item so Invalidate knows which entity

    const { result, waitForNextUpdate, controller } = renderDataHook(() => {
      return useSuspense(UnionResource.getList);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toHaveLength(3);
    expect(result.current.map((item: any) => item.id)).toEqual([
      '101',
      '102',
      '103',
    ]);

    await act(async () => {
      await controller.fetch(UnionResource.delete, { id: '102' });
    });

    // Item should be removed from the list, not cause suspension
    expect(result.current).toHaveLength(2);
    expect(result.current.map((item: any) => item.id)).toEqual(['101', '103']);
  });

  it('should suspend once invalidated', async () => {
    const temppayload = {
      ...payload,
      id: 1234,
    };
    const getMockFn = jest.fn(function ({ id }) {
      return temppayload;
    });
    const throws: Promise<any>[] = [];
    const { result, waitForNextUpdate, controller } = renderDataHook(
      () => {
        try {
          return useSuspense(CoolerArticleResource.get, {
            id: temppayload.id,
          });
        } catch (e: any) {
          if (typeof e.then === 'function') {
            if (e !== throws[throws.length - 1]) {
              throws.push(e);
            }
          }
          throw e;
        }
      },
      {
        resolverFixtures: [
          {
            endpoint: CoolerArticleResource.get,
            response: getMockFn,
          },
        ],
      },
    );
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    let data = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data.title).toBe(temppayload.title);
    // react 19 suspends twice
    expect(throws.length).toBeGreaterThanOrEqual(1);

    getMockFn.mockImplementation(() => ({
      ...temppayload,
      title: 'othertitle',
    }));
    act(() => {
      controller.invalidate(CoolerArticleResource.get, { id: temppayload.id });
    });
    // react 19 suspends twice
    expect(throws.length).toBeGreaterThanOrEqual(2);
    await waitForNextUpdate();
    data = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data.title).toBe('othertitle');
  });

  it('should throw when retrieving an empty string', async () => {
    const { result } = renderDataHook(() => {
      return useController().fetch;
    });

    await expect(
      result.current(CoolerArticleResource.get, { id: 666 }),
    ).rejects.toThrow('Unexpected end of JSON input');
  });

  it.each([
    ['CoolerArticleResource', CoolerArticleResource.delete],
    ['ArticleResource', ArticleResource.delete],
  ] as const)(`should not throw on delete [%s]`, async (_, endpoint) => {
    const { result } = renderDataHook(() => {
      return useController().fetch;
    });
    await expect(
      result.current(endpoint, { id: payload.id }),
    ).resolves.toBeDefined();
  });

  it('useSuspense() should throw errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderDataHook(() => {
      return useSuspense(CoolerArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
    // @ts-expect-error
    () => useSuspense(TypedArticleResource.get, { title: '0' });
  });

  /*it('useSuspense() should throw errors on bad network (multiarg)', async () => {
    const { result, waitForNextUpdate } = renderDataClient(() => {
      return useSuspense([
        CoolerArticleResource.get,
        {
          title: '0',
        },
      ]);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });*/

  it('useSuspense() should throw 500 errors', async () => {
    const { result, waitForNextUpdate } = renderDataHook(() => {
      return useSuspense(TypedArticleResource.get, {
        id: 500,
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(500);
  });

  it('useSuspense() should not throw 500 if data already available', async () => {
    const { result, waitForNextUpdate } = renderDataHook(
      () => {
        return [
          useSuspense(TypedArticleResource.get, {
            id: 500,
          }),
          useController(),
        ] as const;
      },
      {
        initialFixtures: [
          {
            endpoint: TypedArticleResource.get.extend({
              dataExpiryLength: 1000,
            }),
            args: [
              {
                id: 500,
              },
            ],
            response: { id: 500, title: 'hi' },
          },
        ],
      },
    );
    // initially data is defined
    expect(result.current).toBeDefined();
    expect(result.current[0].title).toBe('hi');

    // force fetch
    try {
      // this will 500
      await result.current[1].fetch(CoolerArticleResource.get, {
        id: 500,
      });
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(result.current).toBeDefined();
    expect(result.current[0].title).toBe('hi');

    // invalidate will clear this possibility though
    /*try {
      act(() =>
        result.current[1].invalidate(TypedArticleResource.get, {
          id: 500,
        }),
      );
      await waitForNextUpdate();
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      expect(result.current).toBeUndefined();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(500);
    }*/
  });

  it('useSuspense() should throw errors on malformed response', async () => {
    const response = [1];
    mynock.get(`/article-cooler/${878}`).reply(200, response);
    const { result, waitForNextUpdate } = renderDataHook(() => {
      return useSuspense(CoolerArticleResource.get, {
        id: 878,
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(400);
    expect(result.error).toMatchSnapshot();
  });

  /* TODO: when we have parallel patterns for useSuspense
  it('should resolve parallel useSuspense() request', async () => {
    const { result, waitForNextUpdate } = renderDataClient(() => {
      return useSuspense(
        [
          CoolerArticleResource.get,
          {
            id: payload.id,
          },
        ],
        [UserResource.getList, {}],
      );
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    const [article, users] = result.current;
    expect(article instanceof CoolerArticle).toBe(true);
    expect(article.title).toBe(payload.title);
    // @ts-expect-error
    expect(article.doesnotexist).toBeUndefined();
    expect(users).toBeDefined();
    expect(users.length).toBeTruthy();
    expect(users[0] instanceof User).toBe(true);
  });*/

  it.each([
    ['Resource', CoolerArticleResource.get],
    ['Union', UnionResource.get],
    ['Array<Union>', UnionResource.getList],
  ] as const)(
    `should not suspend with no params to useSuspense() [%s]`,
    (_, endpoint) => {
      let article: any;
      const { result } = renderDataHook(() => {
        article = useSuspense(endpoint, null);
        return 'done';
      });
      expect(result.current).toBe('done');
      expect(article).toBeUndefined();
    },
  );

  it('should update on create (legacy)', async () => {
    const { result, waitForNextUpdate, controller } = renderDataHook(() => {
      const articles = useSuspense(
        CoolerArticleResource.getList.extend({ schema: [CoolerArticle] }),
      );
      return { articles };
    });
    await waitForNextUpdate();
    const createEndpoint = CoolerArticleResource.create
      .extend({ schema: CoolerArticle })
      .extend({
        update: newid => ({
          [CoolerArticleResource.getList.key()]: (existing: string[] = []) => [
            ...existing,
            newid,
          ],
        }),
      });
    await act(async () => {
      await controller.fetch(createEndpoint, { id: 1 });
    });
    expect(
      result.current.articles.map(({ id }: Partial<CoolerArticle>) => id),
    ).toEqual([5, 3, 1]);
  });

  it('should update on create', async () => {
    const { result, waitForNextUpdate, controller } = renderDataHook(() => {
      const articles = useSuspense(CoolerArticleResource.getList);
      return { articles };
    });
    await waitForNextUpdate();
    await act(async () => {
      await controller.fetch(CoolerArticleResource.create, { id: 1 });
    });
    expect(
      result.current.articles.map(({ id }: Partial<CoolerArticle>) => id),
    ).toEqual([5, 3, 1]);
  });

  it('should update collection on push/unshift', async () => {
    const getArticles = CoolerArticleResource.getList
      .extend({ schema: [CoolerArticle] })
      .extend({
        schema: new Collection([CoolerArticle], {
          argsKey: (urlParams, body) => ({
            ...urlParams,
          }),
        }),
      });
    const { result, waitForNextUpdate, controller } = renderDataHook(() => {
      const articles = useSuspense(getArticles);
      return articles;
    });
    await waitForNextUpdate();
    expect(result.current.map(({ id }: Partial<CoolerArticle>) => id)).toEqual([
      5, 3,
    ]);
    await act(async () => {
      await controller.fetch(getArticles.push, { id: 1, title: 'hi' });
    });
    expect(result.current.map(({ id }: Partial<CoolerArticle>) => id)).toEqual([
      5, 3, 1,
    ]);
    await act(async () => {
      await controller.fetch(getArticles.unshift, { id: 55, title: 'hi' });
    });
    expect(result.current.map(({ id }: Partial<CoolerArticle>) => id)).toEqual([
      55, 5, 3, 1,
    ]);
  });

  it('should update on get for a paginated resource', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate } = renderDataHook(() => {
      const { results: articles } = useSuspense(
        PaginatedArticleResource.getList,
      );
      const { fetch } = useController();
      return { articles, fetch };
    });
    await waitForNextUpdate();
    const extendEndpoint = PaginatedArticleResource.getList.extend({
      update: (newArticles, ...args) => ({
        [PaginatedArticleResource.getList.key()]: (articles: {
          results?: string[];
        }) => ({
          results: [...(articles.results || []), ...newArticles.results],
        }),
      }),
    });
    await result.current.fetch(extendEndpoint, { cursor: 2 });
    expect(
      result.current.articles.map(({ id }: Partial<PaginatedArticle>) => id),
    ).toEqual([5, 3, 7, 8]);
  });
  describe("a parent resource endpoint returns an attribute NOT in its own schema but used in a child's schemas", () => {
    it('should not error when fetching the child entity from cache', async () => {
      const { result, waitForNextUpdate } = renderDataHook(() => {
        // CoolerArticleResource does NOT have editor in its schema, but return editor from the server
        const articleWithoutEditorSchema = useSuspense(
          CoolerArticleResource.get,
          {
            title: 'withEditor',
          },
        );
        // EditorArticleResource does have editor in its schema, get it from cache
        const articleWithEditorSchema = useCache(EditorArticleResource.get, {
          id: payload.id,
        });
        return { articleWithoutEditorSchema, articleWithEditorSchema };
      });
      await waitForNextUpdate();
      // This throws TypeError: Cannot read properties of undefined (reading '[object Object]')
      expect(result.current.articleWithEditorSchema?.editor?.id).toEqual(
        editorPayload.editor.id,
      );
    });
  });
});
