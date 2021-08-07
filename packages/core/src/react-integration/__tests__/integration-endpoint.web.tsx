import {
  CoolerArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  UserResource,
  ArticleResourceWithOtherListUrl,
  ListPaginatedArticle,
  CoolerArticleDetail,
  TypedArticleResource,
  IndexedUserResource,
  UnionResource,
  FutureArticleResource,
} from '__tests__/new';
import nock from 'nock';
import { act } from '@testing-library/react-hooks';

// relative imports to avoid circular dependency in tsconfig references
import { schema, Entity } from '@rest-hooks/normalizr';
import { SimpleRecord } from '@rest-hooks/legacy';
import { Endpoint } from '@rest-hooks/endpoint';
import { useContext } from 'react';

import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../../../test';
import {
  useResource,
  useFetcher,
  useCache,
  useInvalidator,
  useInvalidateDispatcher,
  useResetter,
} from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
  valuesFixture,
} from '../test-fixtures';
import { StateContext } from '../context';

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

for (const makeProvider of [makeCacheProvider]) {
  describe(`${makeProvider.name} => <Provider />`, () => {
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
        .get(`/article-cooler/`)
        .reply(200, nested)
        .get(`/article-cooler/values`)
        .reply(200, valuesFixture)
        .post(`/article-cooler/`)
        .reply(200, createPayload)
        .get(`/user/`)
        .reply(200, users);

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

      it('should resolve useResource()', async () => {
        const { result, waitForNextUpdate } = renderRestHook(() => {
          return useResource(CoolerArticleDetail, payload);
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
            useResource(CoolerArticleDetail, payload),
            useCache(CoolerArticleDetail, payload),
          ];
        });
        expect(result.current).toBeUndefined();
        await waitForNextUpdate();
        expect(result.current[0]?.title).toBe(payload.title);
        expect(result.current[0]).toBe(result.current[1]);
      });

      it('should gracefully abort in useResource()', async () => {
        const abort = new AbortController();
        const AbortableArticle = CoolerArticleResource.detail().extend({
          signal: abort.signal,
        });

        const { result, waitForNextUpdate } = renderRestHook(() => {
          return {
            data: useResource(AbortableArticle, payload),
            fetch: useFetcher(AbortableArticle),
          };
        });
        expect(result.current).toBeUndefined();
        await waitForNextUpdate();
        expect(result.current.data.title).toBe(payload.title);
        // @ts-expect-error
        expect(result.current.data.lafsjlfd).toBeUndefined();
        const promise = result.current.fetch(payload);
        abort.abort();
        await expect(promise).rejects.toMatchSnapshot();
        expect(result.error).toBeUndefined();
        expect(result.current.data.title).toBe(payload.title);
      });

      it('should resolve useResource() with SimpleRecords', async () => {
        mynock.get(`/article-paginated/`).reply(200, paginatedFirstPage);

        const { result, waitForNextUpdate } = renderRestHook(() => {
          return useResource(ListPaginatedArticle, {});
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

    it('should resolve useResource()', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(CoolerArticleResource.detail(), payload);
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current instanceof CoolerArticleResource).toBe(true);
      expect(result.current.title).toBe(payload.title);
    });

    it('should denormalize schema.Values()', async () => {
      class ValuesResource extends CoolerArticleResource {
        static values() {
          const urlRoot = this.urlRoot;
          return this.detail().extend({
            schema: new schema.Values(this),
            url() {
              return `${urlRoot}values`;
            },
          });
        }
      }
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(ValuesResource.values(), {});
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      Object.keys(result.current).forEach(k => {
        expect(result.current[k] instanceof ValuesResource).toBe(true);
        expect(result.current[k].title).toBeDefined();
        // @ts-expect-error
        expect(result.current[k].doesnotexist).toBeUndefined();
      });
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
          return useResource(unionEndpoint, {});
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
          return useResource(UnionResource.list(), {});
        },
        {
          results: [
            {
              request: UnionResource.list(),
              params: {},
              result: [
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
      expect(result.current[1]).toBeInstanceOf(UnionResource);
      expect(result.current[2]).not.toBeInstanceOf(UnionResource);
      expect(result.current[3]).not.toBeInstanceOf(UnionResource);
      expect((global.console.warn as jest.Mock).mock.calls).toMatchSnapshot();
      global.console.warn = prevWarn;
    });

    it('should resolve useResource() with SimpleRecords', async () => {
      mynock.get(`/article-paginated/`).reply(200, paginatedFirstPage);

      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(PaginatedArticleResource.listDefaults(), {});
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
            useResource(CoolerArticleResource.detail(), {
              id: temppayload.id,
            }),
            useFetcher(CoolerArticleResource.delete()),
          ] as const;
        } catch (e) {
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
      let [data, del] = result.current;
      expect(data).toBeInstanceOf(CoolerArticleResource);
      expect(data.title).toBe(temppayload.title);
      expect(throws.length).toBe(1);

      mynock
        .persist()
        .get(`/article-cooler/${temppayload.id}`)
        .reply(200, { ...temppayload, title: 'othertitle' });

      await act(async () => {
        await del({ id: temppayload.id });
      });
      expect(throws.length).toBeGreaterThanOrEqual(2); //TODO: delete seems to have receive process multiple times. we suspect this is because of test+act integration.
      await waitForNextUpdate();
      await throws[throws.length - 1];
      [data, del] = result.current;
      expect(data).toBeInstanceOf(CoolerArticleResource);
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
            useResource(CoolerArticleResource.detail(), {
              id: temppayload.id,
            }),
            useInvalidator(CoolerArticleResource.detail()),
          ] as const;
        } catch (e) {
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
      let [data, invalidate] = result.current;
      expect(data).toBeInstanceOf(CoolerArticleResource);
      expect(data.title).toBe(temppayload.title);
      expect(throws.length).toBe(1);

      mynock
        .persist()
        .get(`/article-cooler/${temppayload.id}`)
        .reply(200, { ...temppayload, title: 'othertitle' });
      act(() => {
        invalidate({ id: temppayload.id });
      });
      expect(throws.length).toBe(2);
      await waitForNextUpdate();
      [data, invalidate] = result.current;
      expect(data).toBeInstanceOf(CoolerArticleResource);
      expect(data.title).toBe('othertitle');
    });

    it('should throw when retrieving an empty string', async () => {
      const { result } = renderRestHook(() => {
        return useFetcher(CoolerArticleResource.detail());
      });

      await expect(result.current({ id: 666 })).rejects.toThrowError(
        'Unexpected end of JSON input',
      );
    });

    it('should not throw on delete', async () => {
      const { result } = renderRestHook(() => {
        return [
          useFetcher(CoolerArticleResource.delete()),
          useFetcher(ArticleResource.delete()),
        ];
      });

      for (const del of result.current) {
        await expect(del(payload)).resolves.toBeDefined();
      }
    });

    it('useResource() should throw errors on bad network', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        // @ts-expect-error
        return useResource(TypedArticleResource.detail(), {
          title: '0',
        });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(403);
    });

    it('useResource() should throw errors on bad network (multiarg)', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource([
          CoolerArticleResource.detail(),
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

    it('useResource() should throw 500 errors', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(TypedArticleResource.detail(), {
          id: 500,
        });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(500);
    });

    it('useResource() should not throw 500 if data already available', async () => {
      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          return [
            useResource(TypedArticleResource.detail(), {
              id: 500,
            }),
            useFetcher(CoolerArticleResource.detail()),
            useInvalidateDispatcher(),
          ] as const;
        },
        {
          results: [
            {
              request: TypedArticleResource.detail().extend({
                dataExpiryLength: 1000,
              }),
              params: {
                id: 500,
              },
              result: { id: 500, title: 'hi' },
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
        await result.current[1]({ id: 500 });
        // eslint-disable-next-line no-empty
      } catch (e) {}
      expect(result.current).toBeDefined();
      expect(result.current[0].title).toBe('hi');

      // invalidate will clear this possibility though
      /*try {
        act(() =>
          result.current[2](TypedArticleResource.detail(), { id: 500 }),
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

    it('useResource() should throw errors on malformed response', async () => {
      const response = [1];
      mynock.get(`/article-cooler/${878}`).reply(200, response);
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(CoolerArticleResource.detail(), {
          id: 878,
        });
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(400);
      expect(result.error).toMatchSnapshot();
    });

    it('should resolve parallel useResource() request', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(
          [
            CoolerArticleResource.detail(),
            {
              id: payload.id,
            },
          ],
          [UserResource.list(), {}],
        );
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      const [article, users] = result.current;
      expect(article instanceof CoolerArticleResource).toBe(true);
      expect(article.title).toBe(payload.title);
      // @ts-expect-error
      expect(article.doesnotexist).toBeUndefined();
      expect(users).toBeDefined();
      expect(users.length).toBeTruthy();
      expect(users[0] instanceof UserResource).toBe(true);
    });

    it('should not suspend with no params to useResource()', () => {
      let article: any;
      const { result } = renderRestHook(() => {
        article = useResource(CoolerArticleResource.detail(), null);
        return 'done';
      });
      expect(result.current).toBe('done');
      expect(article).toBeUndefined();
    });

    it('should update on create', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        const articles = useResource(CoolerArticleResource.list(), {});
        const createNewArticle = useFetcher(CoolerArticleResource.create());
        return { articles, createNewArticle };
      });
      await waitForNextUpdate();
      await result.current.createNewArticle({}, { id: 1 }, [
        [
          CoolerArticleResource.list(),
          {},
          (newArticle: string, articles: string[]): string[] => [
            ...articles,
            newArticle,
          ],
        ],
      ]);
      expect(
        result.current.articles.map(
          ({ id }: Partial<CoolerArticleResource>) => id,
        ),
      ).toEqual([5, 3, 1]);
    });

    it('should update on get for a paginated resource', async () => {
      mynock.get(`/article-paginated/`).reply(200, paginatedFirstPage);
      mynock
        .get(`/article-paginated/?cursor=2`)
        .reply(200, paginatedSecondPage);

      const { result, waitForNextUpdate } = renderRestHook(() => {
        const { results: articles } = useResource(
          PaginatedArticleResource.list(),
          {},
        );
        const getNextPage = useFetcher(PaginatedArticleResource.list());
        return { articles, getNextPage };
      });
      await waitForNextUpdate();
      await result.current.getNextPage({ cursor: 2 }, undefined, [
        [
          PaginatedArticleResource.list(),
          {},
          (
            newArticles: { results: string[] },
            articles: { results?: string[] },
          ) => ({
            results: [...(articles.results || []), ...newArticles.results],
          }),
        ],
      ]);
      expect(
        result.current.articles.map(
          ({ id }: Partial<PaginatedArticleResource>) => id,
        ),
      ).toEqual([5, 3, 7, 8]);
    });

    describe.only('useResetter()', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        renderRestHook = makeRenderRestHook(makeProvider);
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      it('should refetch useResource() ', async () => {
        mynock
          .get(`/article-cooler/${9999}`)
          .delay(2000)
          .reply(200, { ...payload, id: 9999 });

        let reset: any;

        const { result, waitForNextUpdate, rerender } = renderRestHook(() => {
          // cheating result since useResource will suspend
          reset = useResetter();
          console.log('render', reset);
          return useResource(CoolerArticleDetail, { id: 9999 });
        });
        expect(result.current).toBeUndefined();
        jest.advanceTimersByTime(1000);
        // should not be resolved
        expect(result.current).toBeUndefined();
        console.log('reset');
        reset();
        jest.advanceTimersByTime(5000);
        act(() => rerender());
        jest.advanceTimersByTime(5000);

        console.log(result.error, result.current);
        await waitForNextUpdate();
        expect(result.current).toBeDefined();
      });
    });
  });
}
