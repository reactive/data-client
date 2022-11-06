import {
  CoolerArticleResource,
  EditorArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  ListPaginatedArticle,
  CoolerArticleDetail,
  TypedArticleResource,
  UnionResource,
  CoolerArticle,
  FirstUnion,
  PaginatedArticle,
} from '__tests__/new';
import nock from 'nock';
import { act } from '@testing-library/react-hooks';
// relative imports to avoid circular dependency in tsconfig references
import { schema, Entity, Query } from '@rest-hooks/endpoint';
import { SimpleRecord } from '@rest-hooks/legacy';
import { Endpoint } from '@rest-hooks/endpoint';
import { RestEndpoint } from '@rest-hooks/rest';

import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../../../test';
import { useCache, useController, useFetch, useSuspense } from '../hooks';
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

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

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
    renderRestHook = makeRenderRestHook(makeProvider);
  });

  describe('Endpoint', () => {
    it('should resolve await', async () => {
      const result = await CoolerArticleDetail(payload);
      expect(result.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.lafsjlfd).toBeUndefined();
    });

    it('should resolve useSuspense()', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useSuspense(CoolerArticleDetail, payload);
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.current.lafsjlfd).toBeUndefined();
    });

    it('should maintain global referential equality', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
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

      const { result, waitForNextUpdate } = renderRestHook(() => {
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

    it('should resolve useSuspense() with SimpleRecords', async () => {
      mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);

      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useSuspense(ListPaginatedArticle);
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current).toBeInstanceOf(SimpleRecord);
      expect(result.current.nextPage).toBe('');
      expect(result.current.prevPage).toBe('');
      expect(result.current.results).toMatchSnapshot();
      // @ts-expect-error
      expect(result.current.lafsjlfd).toBeUndefined();
    });
  });

  describe('renderRestHook()', () => {
    let warnspy: jest.SpyInstance;
    beforeEach(() => {
      warnspy = jest.spyOn(global.console, 'warn');
    });
    afterEach(() => {
      warnspy.mockRestore();
    });

    it('should resolve useSuspense()', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
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
      schema: new schema.Values(CoolerArticle),
      path: `${CoolerArticleResource.getList.path}/values` as const,
    });

    const { result, waitForNextUpdate } = renderRestHook(() => {
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

  it('should denormalize Query', async () => {
    const getList = CoolerArticleResource.getList.extend({
      schema: new schema.All(CoolerArticle),
    });
    const queryArticle = new Query(new schema.All(CoolerArticle));

    const { result, waitForNextUpdate } = renderRestHook(() => {
      useFetch(getList);
      return useCache(queryArticle);
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
      new schema.All(CoolerArticle),
      (entries, { tags }: { tags: string }) => {
        if (!tags) return entries;
        return entries.filter(article => article.tags.includes(tags));
      },
    );

    const { result, waitForNextUpdate, rerender } = renderRestHook(
      ({ tags }: { tags: string }) => {
        useFetch(CoolerArticleResource.getList);
        return {
          data: useCache(queryArticle, { tags }),
          controller: useController(),
        };
      },
      { initialProps: { tags: 'a' } },
    );
    expect(result.current.data).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data).toMatchSnapshot();

    await act(async () =>
      result.current.controller.fetch(CoolerArticleResource.create, {
        id: 1000,
        title: 'bob says',
        tags: ['a'],
      }),
    );
    await act(async () =>
      result.current.controller.fetch(CoolerArticleResource.create, {
        id: 2000,
        title: 'should not exist',
        tags: [],
      }),
    );
    expect(result.current.data).toBeDefined();
    // should only include the one with the tag
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data).toMatchSnapshot();
    rerender({ tags: '' });
    expect(result.current.data).toBeDefined();
    // should not need to fetch as data already provided
    // with no tags should include all entries
    expect(result.current.data?.length).toBe(4);
    expect(result.current.data).toMatchSnapshot();
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
        new schema.Union(
          {
            users: User,
            groups: Group,
          },
          'type',
        ),
      ],
    });

    const { result } = renderRestHook(
      () => {
        return useSuspense(unionEndpoint, {});
      },
      {
        results: [
          {
            request: unionEndpoint,
            params: {},
            result: [
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

    const { result } = renderRestHook(
      () => {
        return useSuspense(UnionResource.getList);
      },
      {
        results: [
          {
            endpoint: UnionResource.getList,
            args: [],
            response: [
              null,
              { id: '5', body: 'hi', type: 'first' },
              { id: '5', body: 'hi', type: 'another' },
              { id: '5', body: 'hi' },
            ],
          },
        ],
      },
    );
    expect(result.current).toBeDefined();
    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBeInstanceOf(FirstUnion);
    expect(result.current[2]).not.toBeInstanceOf(FirstUnion);
    expect(result.current[3]).not.toBeInstanceOf(FirstUnion);
    expect((global.console.warn as jest.Mock).mock.calls).toMatchSnapshot();
    global.console.warn = prevWarn;
  });

  it('should resolve useSuspense() with SimpleRecords', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(PaginatedArticleResource.getListDefaults);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toBeInstanceOf(SimpleRecord);
    expect(result.current.nextPage).toBe('');
    expect(result.current.prevPage).toBe('');
    expect(result.current.results).toMatchSnapshot();
  });

  it('should suspend once deleted', async () => {
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
    const { result, waitForNextUpdate } = renderRestHook(() => {
      try {
        return [
          useSuspense(CoolerArticleResource.get, {
            id: temppayload.id,
          }),
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
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    let [data, fetch] = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data.title).toBe(temppayload.title);
    expect(throws.length).toBe(1);

    mynock
      .persist()
      .get(`/article-cooler/${temppayload.id}`)
      .reply(200, { ...temppayload, title: 'othertitle' });

    await act(async () => {
      await fetch(CoolerArticleResource.delete, { id: temppayload.id });
    });
    expect(throws.length).toBeGreaterThanOrEqual(2); //TODO: delete seems to have receive process multiple times. we suspect this is because of test+act integration.
    await waitForNextUpdate();
    await throws[throws.length - 1];
    [data, fetch] = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data.title).toBe('othertitle');
  });

  it('should suspend once invalidated', async () => {
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
    const { result, waitForNextUpdate } = renderRestHook(() => {
      try {
        return [
          useSuspense(CoolerArticleResource.get, {
            id: temppayload.id,
          }),
          useController(),
        ] as const;
      } catch (e: any) {
        if (typeof e.then === 'function') {
          if (e !== throws[throws.length - 1]) {
            throws.push(e);
          }
        }
        throw e;
      }
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    let [data, { invalidate }] = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data.title).toBe(temppayload.title);
    expect(throws.length).toBe(1);

    mynock
      .persist()
      .get(`/article-cooler/${temppayload.id}`)
      .reply(200, { ...temppayload, title: 'othertitle' });
    act(() => {
      invalidate(CoolerArticleResource.get, { id: temppayload.id });
    });
    expect(throws.length).toBe(2);
    await waitForNextUpdate();
    [data, { invalidate }] = result.current;
    expect(data).toBeInstanceOf(CoolerArticle);
    expect(data.title).toBe('othertitle');
  });

  it('should throw when retrieving an empty string', async () => {
    const { result } = renderRestHook(() => {
      return useController().fetch;
    });

    await expect(
      result.current(CoolerArticleResource.get, { id: 666 }),
    ).rejects.toThrowError('Unexpected end of JSON input');
  });

  it.each([
    ['CoolerArticleResource', CoolerArticleResource.delete],
    ['ArticleResource', ArticleResource.delete],
  ] as const)(`should not throw on delete [%s]`, async (_, endpoint) => {
    const { result } = renderRestHook(() => {
      return useController().fetch;
    });
    await expect(
      result.current(endpoint, { id: payload.id }),
    ).resolves.toBeDefined();
  });

  it('useSuspense() should throw errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
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

  /*it('useResource() should throw errors on bad network (multiarg)', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource([
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
    const { result, waitForNextUpdate } = renderRestHook(() => {
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
    const { result, waitForNextUpdate } = renderRestHook(
      () => {
        return [
          useSuspense(TypedArticleResource.get, {
            id: 500,
          }),
          useController(),
        ] as const;
      },
      {
        results: [
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
    const { result, waitForNextUpdate } = renderRestHook(() => {
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
  it('should resolve parallel useResource() request', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(
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
      const { result } = renderRestHook(() => {
        article = useSuspense(endpoint, null);
        return 'done';
      });
      expect(result.current).toBe('done');
      expect(article).toBeUndefined();
    },
  );

  it('should update on create', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      const articles = useSuspense(CoolerArticleResource.getList);
      const { fetch } = useController();
      return { articles, fetch };
    });
    await waitForNextUpdate();
    const createEndpoint = CoolerArticleResource.create.extend({
      update: (newid: string) => ({
        [CoolerArticleResource.getList.key()]: (existing: string[] = []) => [
          ...existing,
          newid,
        ],
      }),
    });
    await act(async () => {
      await result.current.fetch(createEndpoint, { id: 1 });
    });
    expect(
      result.current.articles.map(({ id }: Partial<CoolerArticle>) => id),
    ).toEqual([5, 3, 1]);
  });

  it('should update on get for a paginated resource', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { results: articles } = useSuspense(
        PaginatedArticleResource.getList,
      );
      const { fetch } = useController();
      return { articles, fetch };
    });
    await waitForNextUpdate();
    const extendEndpoint = PaginatedArticleResource.getList.extend({
      update: (newArticles: { results: string[] }, ...args: any) => ({
        [PaginatedArticleResource.getList.key()]: (articles: {
          results?: string[];
        }) => ({
          results: [...(articles.results || []), ...newArticles.results],
        }),
      }),
    });
    await act(async () => {
      await result.current.fetch(extendEndpoint, { cursor: 2 });
    });
    expect(
      result.current.articles.map(({ id }: Partial<PaginatedArticle>) => id),
    ).toEqual([5, 3, 7, 8]);
  });
  describe("a parent resource endpoint returns an attribute NOT in its own schema but used in a child's schemas", () => {
    it('should not error when fetching the child entity from cache', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
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
