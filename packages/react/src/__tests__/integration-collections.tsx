import { CacheProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import {
  schema,
  RestEndpoint,
  PolymorphicInterface,
  RestGenerics,
  Entity,
  Collection,
  Values,
} from '@data-client/rest';
import { resource } from '@data-client/rest';
import {
  IDEntity,
  Article,
  UnionSchema,
  FirstUnion,
  SecondUnion,
} from '__tests__/new';
import nock from 'nock';
import qs from 'qs';

import { makeRenderDataClient, act } from '../../../test';
import { useSuspense } from '../hooks';
import {
  paginatedFirstPage,
  paginatedSecondPage,
  valuesFixture,
} from '../test-fixtures';

class QSEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  searchToString(searchParams: any) {
    return qs.stringify(searchParams);
  }
}

class Todo extends IDEntity {
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}

class User extends IDEntity {
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  static key = 'User';
  static schema = {
    todos: new Collection(new schema.Array(Todo), {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}

const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
const TodoResource = resource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string } | undefined,
  schema: Todo,
});
// for nesting test
const BaseArticleResource = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
const ArticleResource = {
  ...BaseArticleResource,
  getList: BaseArticleResource.getList.extend({
    schema: {
      results: new Collection([Article], {
        argsKey: (urlParams, body) => ({
          ...urlParams,
        }),
      }),
      prevPage: '',
      nextPage: '',
    },
  }),
};
// for pagination test
const ArticlePaginatedResource = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  searchParams: {} as { userId?: number; extra?: undefined } | undefined,
  schema: Article,
  paginationField: 'cursor',
}).extend('getList', {
  schema: {
    results: new Collection([Article]),
    nextPage: 0,
  },
});

const UnionResource = resource({
  path: '/union/:id',
  schema: UnionSchema,
});

const UserResourceLegacy = resource({
  path: '/users/:id',
  schema: User,
  Endpoint: RestEndpoint as any,
});
const TodoResourceLegacy = resource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string } | undefined,
  schema: Todo,
  Endpoint: RestEndpoint as any,
});
const BaseArticleResourceLegacy = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
  Endpoint: RestEndpoint as any,
});
const ArticleResourceLegacy = {
  ...BaseArticleResourceLegacy,
  getList: BaseArticleResourceLegacy.getList.extend({
    schema: new schema.Object({
      results: new Collection([Article], {
        argsKey: (urlParams, body) => ({
          ...urlParams,
        }),
      }),
      prevPage: '',
      nextPage: '',
    }),
  }),
};

const ResourceCombos: [
  string,
  {
    UserResource: typeof UserResource;
    TodoResource: typeof TodoResource;
    ArticleResource: typeof ArticleResource;
  },
][] = [
  ['/next', { UserResource, TodoResource, ArticleResource }],
  [
    '/current',
    {
      UserResource: UserResourceLegacy,
      TodoResource: TodoResourceLegacy,
      ArticleResource: ArticleResourceLegacy as any,
    },
  ],
];
describe.each([
  ['CacheProvider', CacheProvider],
  ['ExternalDataProvider', ExternalDataProvider],
] as const)(`%s`, (_, makeProvider) => {
  // TODO: add nested resource test case that has multiple partials to test merge functionality
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;

  beforeEach(() => {
    renderDataClient = makeRenderDataClient(makeProvider);
  });

  it('should work with unions', async () => {
    const prevWarn = global.console.warn;
    global.console.warn = jest.fn();

    const { result, controller } = renderDataClient(
      () => {
        return useSuspense(UnionResource.getList);
      },
      {
        initialFixtures: [
          {
            endpoint: UnionResource.getList,
            args: [],
            response: [
              undefined,
              null,
              { id: '5', body: 'hi', type: 'first' },
              { id: '6', body: 'hi', type: 'another' },
              { id: '7', body: 'hi' },
            ],
          },
        ],
        resolverFixtures: [
          {
            endpoint: UnionResource.getList.push,
            response(body) {
              return body;
            },
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

    await act(async () => {
      await controller.fetch(UnionResource.getList.push, {
        body: 'hi',
        type: 'second',
        id: '100',
      });
    });
    expect(result.current[4]).toBeInstanceOf(SecondUnion);
    expect(result.current).toMatchSnapshot();
    global.console.warn = prevWarn;
  });

  it('pagination should work with cursor field from getList.paginated', async () => {
    const mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });

    mynock.get(`/article`).reply(200, paginatedFirstPage);
    mynock.get(`/article?userId=2`).reply(200, paginatedFirstPage);
    mynock.get(`/article?userId=1`).reply(200, paginatedFirstPage);
    mynock.get(`/article?userId=1&cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      const { results: userArticles, nextPage } = useSuspense(
        ArticlePaginatedResource.getList,
        {
          userId: 1,
        },
      );
      const anotherUserArticles = useSuspense(
        ArticlePaginatedResource.getList,
        { userId: 2 },
      ).results;
      const allArticles = useSuspense(ArticlePaginatedResource.getList).results;
      return { userArticles, allArticles, anotherUserArticles, nextPage };
    });
    await waitForNextUpdate();
    expect(result.current.userArticles).toMatchSnapshot();
    expect(result.current.nextPage).toBe(2);

    await controller.fetch(ArticlePaginatedResource.getList.getPage, {
      cursor: 2,
      userId: 1,
    });

    expect(result.current.userArticles.map(({ id }) => id)).toEqual([
      5, 3, 7, 8,
    ]);
    // should update the entire response - not just collection
    expect(result.current.nextPage).toBe(3);
    // pagination we only explicitly extend one
    expect(result.current.allArticles.map(({ id }) => id)).toEqual([5, 3]);
    expect(result.current.anotherUserArticles.map(({ id }) => id)).toEqual([
      5, 3,
    ]);

    () =>
      controller.fetch(ArticlePaginatedResource.getList.getPage, {
        cursor: 2,
        userId: 1,
        // @ts-expect-error
        sdlkjfsd: 5,
      });
    () =>
      controller.fetch(ArticlePaginatedResource.getList.getPage, {
        // @ts-expect-error
        sdf: 2,
        userId: 1,
      });
    () =>
      // @ts-expect-error
      controller.fetch(ArticlePaginatedResource.getList.getPage, {
        userId: 1,
      });

    nock.cleanAll();
  });

  it('pagination should ignore undefined values', async () => {
    const mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });

    mynock.get(`/article`).reply(200, paginatedFirstPage);
    mynock.get(`/article?userId=2`).reply(200, paginatedFirstPage);
    mynock.get(`/article?userId=1`).reply(200, paginatedFirstPage);
    mynock
      .get(`/article?userId=1&cursor=2&extra=undefined`)
      .reply(200, paginatedSecondPage);
    mynock.get(`/article?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      const userArticles = useSuspense(ArticlePaginatedResource.getList, {
        userId: 1,
      }).results;
      const userArticlesUndefined = useSuspense(
        ArticlePaginatedResource.getList,
        {
          userId: 1,
          // ignored
          extra: undefined,
        },
      ).results;
      const anotherUserArticles = useSuspense(
        ArticlePaginatedResource.getList,
        { userId: 2 },
      ).results;
      const allArticles = useSuspense(ArticlePaginatedResource.getList).results;
      return {
        userArticles,
        allArticles,
        anotherUserArticles,
        userArticlesUndefined,
      };
    });
    await waitForNextUpdate();
    expect(result.current.userArticles).toMatchSnapshot();

    await controller.fetch(ArticlePaginatedResource.getList.getPage, {
      cursor: 2,
      userId: 1,
      // ignored
      extra: undefined,
    });

    expect(result.current.userArticles.map(({ id }) => id)).toEqual([
      5, 3, 7, 8,
    ]);
    // pagination we only explicitly extend one
    expect(result.current.allArticles.map(({ id }) => id)).toEqual([5, 3]);
    expect(result.current.anotherUserArticles.map(({ id }) => id)).toEqual([
      5, 3,
    ]);
    expect(result.current.userArticlesUndefined).toEqual(
      result.current.userArticles,
    );

    await controller.fetch(ArticlePaginatedResource.getList.getPage, {
      cursor: 2,
    });
    // now we got the next page
    expect(result.current.allArticles.map(({ id }) => id)).toEqual([
      5, 3, 7, 8,
    ]);

    nock.cleanAll();
  });

  it('should use custom Collection class', async () => {
    const mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
    mynock
      .get(`/todos?sorted=true`)
      .reply(200, [
        { id: '5', title: 'do things', userId: '1' },
        { id: '3', title: 'ssdf', userId: '2' },
      ])
      .get(`/todos?userId=1`)
      .reply(200, [{ id: '5', title: 'do things', userId: '1' }])
      .post(`/todos`)
      .reply(200, (uri, body: any) => ({ ...body }))
      .post(`/todos?userId=7`)
      .reply(200, (uri, body: any) => ({ userId: '7', ...body }))
      .post(`/todos?userId=1`)
      .reply(200, (uri, body: any) => ({ userId: '1', ...body }));

    class MyCollection<
      S extends any[] | PolymorphicInterface = any,
      Parent extends any[] = [urlParams: any, body?: any],
    > extends schema.Collection<S, Parent> {
      nonFilterArgumentKeys(key: string) {
        return key === 'sorted';
      }
    }
    const TodoResource = resource({
      path: '/todos/:id',
      searchParams: {} as { userId?: string; sorted?: boolean } | undefined,
      schema: Todo,
      Collection: MyCollection,
    });
    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      const todos = useSuspense(TodoResource.getList, { sorted: true });
      const userTodos = useSuspense(TodoResource.getList, { userId: '1' });
      return { todos, userTodos };
    });
    await waitForNextUpdate();
    expect(result.current).toMatchSnapshot();
    const firstUserTodos = result.current.userTodos;
    await act(async () => {
      await controller.fetch(
        TodoResource.getList.push,
        { userId: '7' },
        {
          title: 'push',
          userId: 7,
        },
      );
    });
    // added to main list (ignoring sorted argument), but not userTodos
    expect(result.current.userTodos.map(({ id }) => id)).toEqual(['5']);
    expect(result.current.todos.map(({ title }) => title)).toEqual([
      'do things',
      'ssdf',
      'push',
    ]);
    // userTodos didn't change so should maintain referential equality
    expect(result.current.userTodos).toBe(firstUserTodos);

    await act(async () => {
      await controller.fetch(
        TodoResource.getList.unshift,
        { userId: '1' },
        {
          title: 'unshift',
        },
      );
    });
    // this adds to both the base todo list, the one with userId filter, and the nested todo list inside user object
    expect(result.current.todos.map(({ title }) => title)).toEqual([
      'unshift',
      'do things',
      'ssdf',
      'push',
    ]);
    expect(result.current.userTodos.map(({ title }) => title)).toEqual([
      'unshift',
      'do things',
    ]);
  });

  describe.each(ResourceCombos)(
    `RestEndpoint%s`,
    (_, { UserResource, TodoResource, ArticleResource }) => {
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
          .get(`/users/1`)
          .reply(200, {
            id: '1',
            username: 'bob',
            todos: [{ id: '5', title: 'do things', userId: '1' }],
          })
          .get(`/todos`)
          .reply(200, [
            { id: '5', title: 'do things', userId: '1' },
            { id: '3', title: 'ssdf', userId: '2' },
          ])
          .get(`/todos?userId=1`)
          .reply(200, [{ id: '5', title: 'do things', userId: '1' }])
          .post(`/todos`)
          .reply(200, (uri, body: any) => ({ ...ensurePojo(body) }))
          .post(`/todos?userId=5`)
          .reply(200, (uri, body: any) => {
            return {
              userId: '5',
              ...ensurePojo(body),
            };
          })
          .post(`/todos?userId=1`)
          .reply(200, (uri, body: any) => ({
            userId: '1',
            ...ensurePojo(body),
          }));

        mynock = nock(/.*/).defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      const formPayload = new FormData();
      formPayload.set('title', 'push');
      formPayload.set('userId', '5');
      it.each([
        [
          'pojo',
          {
            title: 'push',
            userId: 5,
          },
        ],
        ['FormData', formPayload],
      ])('should update collection on push/unshift %s', async (_, payload) => {
        const { result, waitForNextUpdate, controller } = renderDataClient(
          () => {
            const todos = useSuspense(TodoResource.getList);
            const userTodos = useSuspense(TodoResource.getList, {
              userId: '1',
            });
            const user = useSuspense(UserResource.get, { id: '1' });
            return { todos, userTodos, user };
          },
          {
            resolverFixtures: [
              {
                endpoint: TodoResource.getList.push,
                response({ userId }, body) {
                  return { id: Math.random(), userId, ...ensurePojo(body) };
                },
              },
            ],
          },
        );
        await waitForNextUpdate();
        expect(result.current).toMatchSnapshot();
        const firstUserTodos = result.current.userTodos;
        const firstUser = result.current.user;
        // referential equality guarantee
        expect(result.current.user.todos).toBe(result.current.userTodos);
        await act(async () => {
          await controller.fetch(
            TodoResource.getList.push,
            { userId: '5' },
            payload as any,
          );
        });
        expect(result.current.userTodos.map(({ id }) => id)).toEqual(['5']);
        expect(result.current.todos.map(({ title }) => title)).toEqual([
          'do things',
          'ssdf',
          'push',
        ]);
        expect(result.current.user.todos).toBe(result.current.userTodos);
        // userTodos didn't change so should maintain referential equality
        expect(result.current.userTodos).toBe(firstUserTodos);
        expect(result.current.user).toBe(firstUser);

        await act(async () => {
          await controller.fetch(
            TodoResource.getList.unshift,
            { userId: '1' },
            {
              title: 'unshift',
            },
          );
        });
        // this adds to both the base todo list, the one with userId filter, and the nested todo list inside user object
        expect(result.current.todos.map(({ title }) => title)).toEqual([
          'unshift',
          'do things',
          'ssdf',
          'push',
        ]);
        expect(result.current.userTodos.map(({ title }) => title)).toEqual([
          'unshift',
          'do things',
        ]);
        expect(result.current.user.todos).toBe(result.current.userTodos);

        // type checks

        () =>
          controller.fetch(
            TodoResource.getList.unshift,
            // @ts-expect-error
            { sdf: '1' },
            {
              id: '55',
              title: 'unshift',
            },
          );

        () =>
          controller.fetch(
            TodoResource.getList.unshift,
            // @ts-expect-error
            5,
            {
              id: '55',
              title: 'unshift',
            },
          );
      });

      it('should update on get for a paginated resource', async () => {
        mynock.get(`/article`).reply(200, paginatedFirstPage);
        mynock.get(`/article?cursor=2`).reply(200, paginatedSecondPage);

        const getNextPage = ArticleResource.getList.paginated(
          ({ cursor, ...rest }: { cursor?: number }) => [],
        );

        const { result, waitForNextUpdate, controller } = renderDataClient(
          () => {
            const ret = useSuspense(ArticleResource.getList);
            return ret;
          },
        );
        await waitForNextUpdate();
        expect(result.current).toMatchSnapshot();

        await controller.fetch(getNextPage, { cursor: 2 });

        expect(result.current.results.map(({ id }) => id)).toEqual([
          5, 3, 7, 8,
        ]);
      });

      it('should update on get for nested args change', async () => {
        const filtersA = {
          search: {
            type: 'Coupon',
          },
        };
        const filtersB = {
          search: {
            type: 'Cashback',
          },
        };
        class Offer extends Entity {
          id = '';
          text = '';
        }
        const OfferResource = resource({
          Endpoint: QSEndpoint,
          schema: Offer,
          searchParams: filtersA,
          path: '/offers/:id',
          paginationField: 'page',
        });

        const { result, rerender } = renderDataClient(
          ({ filters }) => {
            return useSuspense(OfferResource.getList, filters);
          },
          {
            initialProps: { filters: filtersA },
            initialFixtures: [
              {
                endpoint: OfferResource.getList,
                args: [filtersA],
                response: [
                  { id: '5', text: 'hi' },
                  { id: '2', text: 'next' },
                ],
              },
              {
                endpoint: OfferResource.getList,
                args: [filtersB],
                response: [
                  { id: '10', text: 'second' },
                  { id: '11', text: 'page' },
                ],
              },
            ],
          },
        );
        expect(result.current).toMatchSnapshot();
        const firstResult = result.current;
        rerender({ filters: filtersB });
        expect(result.current).not.toEqual(firstResult);
        expect(result.current).toMatchSnapshot();
      });

      it('should update on get for a paginated resource with searchParams', async () => {
        mynock.get(`/article`).reply(200, paginatedFirstPage);
        mynock.get(`/article?userId=2`).reply(200, paginatedFirstPage);
        mynock.get(`/article?userId=1`).reply(200, paginatedFirstPage);
        mynock
          .get(`/article?userId=1&cursor=2`)
          .reply(200, paginatedSecondPage);

        const getArticles = ArticleResource.getList.extend({
          searchParams: {} as { userId?: number } | undefined,
        });
        const getNextPage = getArticles.paginated(
          ({ cursor, ...rest }: { cursor?: number; userId?: number }) => [rest],
        );

        const { result, waitForNextUpdate, controller } = renderDataClient(
          () => {
            const userArticles = useSuspense(getArticles, { userId: 1 });
            const anotherUserArticles = useSuspense(getArticles, { userId: 2 });
            const allArticles = useSuspense(getArticles);
            return { userArticles, allArticles, anotherUserArticles };
          },
        );
        await waitForNextUpdate();
        expect(result.current.userArticles).toMatchSnapshot();

        await controller.fetch(getNextPage, { cursor: 2, userId: 1 });

        expect(result.current.userArticles.results.map(({ id }) => id)).toEqual(
          [5, 3, 7, 8],
        );
        // pagination we only explicitly extend one
        expect(result.current.allArticles.results.map(({ id }) => id)).toEqual([
          5, 3,
        ]);
        expect(
          result.current.anotherUserArticles.results.map(({ id }) => id),
        ).toEqual([5, 3]);

        () =>
          // @ts-expect-error
          controller.fetch(getNextPage, { cursor: 2, userId: 1, sdlkjfsd: 5 });
      });

      it('pagination should work with cursor field parameters', async () => {
        mynock.get(`/article`).reply(200, paginatedFirstPage);
        mynock.get(`/article?userId=2`).reply(200, paginatedFirstPage);
        mynock.get(`/article?userId=1`).reply(200, paginatedFirstPage);
        mynock
          .get(`/article?userId=1&cursor=2`)
          .reply(200, paginatedSecondPage);

        const getArticles = ArticleResource.getList.extend({
          searchParams: {} as { userId?: number } | undefined,
        });
        const getNextPage = getArticles.paginated('cursor');

        const { result, waitForNextUpdate, controller } = renderDataClient(
          () => {
            const userArticles = useSuspense(getArticles, { userId: 1 });
            const anotherUserArticles = useSuspense(getArticles, { userId: 2 });
            const allArticles = useSuspense(getArticles);
            return { userArticles, allArticles, anotherUserArticles };
          },
        );
        await waitForNextUpdate();
        expect(result.current.userArticles).toMatchSnapshot();

        await controller.fetch(getNextPage, { cursor: 2, userId: 1 });

        expect(result.current.userArticles.results.map(({ id }) => id)).toEqual(
          [5, 3, 7, 8],
        );
        // pagination we only explicitly extend one
        expect(result.current.allArticles.results.map(({ id }) => id)).toEqual([
          5, 3,
        ]);
        expect(
          result.current.anotherUserArticles.results.map(({ id }) => id),
        ).toEqual([5, 3]);

        () =>
          // @ts-expect-error
          controller.fetch(getNextPage, { cursor: 2, userId: 1, sdlkjfsd: 5 });
        () =>
          // @ts-expect-error
          controller.fetch(getNextPage, { sdf: 2, userId: 1 });
      });

      it('should update nested collection on push/unshift', async () => {
        mynock.get(`/article`).reply(200, paginatedFirstPage);
        mynock
          .persist()
          .post(`/article`)
          .reply(200, (uri, body: any) => ({ ...body }));

        const { result, waitForNextUpdate, controller } = renderDataClient(
          () => {
            return useSuspense(ArticleResource.getList);
          },
        );
        await waitForNextUpdate();
        expect(result.current.results.map(({ id }) => id)).toEqual([5, 3]);

        await act(async () => {
          await controller.fetch(ArticleResource.create, {
            id: 1,
            title: 'create',
          });
        });
        expect(result.current.results.map(({ id }) => id)).toEqual([5, 3, 1]);
        await act(async () => {
          await controller.fetch(ArticleResource.getList.push, {
            id: 11,
            title: 'push',
          });
        });
        expect(result.current.results.map(({ id }) => id)).toEqual([
          5, 3, 1, 11,
        ]);
      });

      it('endpoint.assign should add to schema.Values Collections', async () => {
        mynock.get(`/article`).reply(200, valuesFixture);
        mynock
          .persist()
          .post(`/article`)
          .reply(200, (uri, body: any) => ({ ...body }));

        const getValues = ArticleResource.getList.extend({
          schema: new Collection(new Values(Article), {
            argsKey: (urlParams, body) => ({
              ...urlParams,
            }),
          }),
        });

        const { result, waitForNextUpdate, controller } = renderDataClient(
          () => {
            return useSuspense(getValues);
          },
        );
        expect(result.current).toBeUndefined();
        await waitForNextUpdate();
        Object.keys(result.current).forEach(k => {
          expect(result.current[k] instanceof Article).toBe(true);
          expect(result.current[k].title).toBeDefined();
          // @ts-expect-error
          expect(result.current[k].doesnotexist).toBeUndefined();
        });

        await act(async () => {
          await controller.fetch(getValues.assign, {
            added: {
              id: 1,
              title: 'newly assigned',
            },
          });
        });

        expect(result.current.added).toBeInstanceOf(Article);
        expect(result.current.added).toMatchSnapshot();
      });
    },
  );
});

function ensurePojo(body: any) {
  return body instanceof FormData ?
      Object.fromEntries((body as any).entries())
    : body;
}
