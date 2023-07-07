import { CacheProvider } from '@data-client/react';
import { CacheProvider as ExternalCacheProvider } from '@data-client/redux';
import { schema, RestEndpoint } from '@data-client/rest';
import { createResource } from '@data-client/rest';
import {
  IDEntity,
  Article,
  UnionSchema,
  FirstUnion,
  SecondUnion,
} from '__tests__/new';
import nock from 'nock';

import { makeRenderRestHook, act } from '../../../test';
import { useSuspense } from '../hooks';
import {
  paginatedFirstPage,
  paginatedSecondPage,
  valuesFixture,
} from '../test-fixtures';

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
    todos: new schema.Collection(new schema.Array(Todo), {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}

const UserResource = createResource({
  path: '/users/:id',
  schema: User,
});
const TodoResource = createResource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string } | undefined,
  schema: Todo,
});
// for nesting test
const BaseArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
const ArticleResource = {
  ...BaseArticleResource,
  getList: BaseArticleResource.getList.extend({
    schema: {
      results: new schema.Collection([Article], {
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
const ArticlePaginatedResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  searchParams: {} as { userId?: number } | undefined,
  schema: Article,
  paginationField: 'cursor',
});

const UnionResource = createResource({
  path: '/union/:id',
  schema: UnionSchema,
});

const UserResourceLegacy = createResource({
  path: '/users/:id',
  schema: User,
  Endpoint: RestEndpoint as any,
});
const TodoResourceLegacy = createResource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string } | undefined,
  schema: Todo,
  Endpoint: RestEndpoint as any,
});
const BaseArticleResourceLegacy = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
  Endpoint: RestEndpoint as any,
});
const ArticleResourceLegacy = {
  ...BaseArticleResourceLegacy,
  getList: BaseArticleResourceLegacy.getList.extend({
    schema: new schema.Object({
      results: new schema.Collection([Article], {
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
  ['ExternalCacheProvider', ExternalCacheProvider],
] as const)(`%s`, (_, makeProvider) => {
  // TODO: add nested resource test case that has multiple partials to test merge functionality
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeProvider);
  });

  it('should work with unions', async () => {
    const prevWarn = global.console.warn;
    global.console.warn = jest.fn();

    const { result, controller } = renderRestHook(
      () => {
        return useSuspense(UnionResource.getList);
      },
      {
        initialFixtures: [
          {
            endpoint: UnionResource.getList,
            args: [],
            response: [
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
            args: [],
            response(body) {
              return body;
            },
          },
        ],
      },
    );
    expect(result.current).toBeDefined();
    expect(result.current[0]).toBeInstanceOf(FirstUnion);
    expect(result.current[1]).not.toBeInstanceOf(FirstUnion);
    expect(result.current[2]).not.toBeInstanceOf(FirstUnion);
    expect((global.console.warn as jest.Mock).mock.calls).toMatchSnapshot();

    await act(async () => {
      await controller.fetch(UnionResource.getList.push, {
        body: 'hi',
        type: 'second',
        id: 100,
      });
    });
    expect(result.current[3]).toBeInstanceOf(SecondUnion);
    expect(result.current).toMatchSnapshot();
    global.console.warn = prevWarn;
  });

  it('pagination should work with cursor field in createResource', async () => {
    const mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });

    mynock.get(`/article`).reply(200, paginatedFirstPage.results);
    mynock.get(`/article?userId=2`).reply(200, paginatedFirstPage.results);
    mynock.get(`/article?userId=1`).reply(200, paginatedFirstPage.results);
    mynock
      .get(`/article?userId=1&cursor=2`)
      .reply(200, paginatedSecondPage.results);

    const { result, waitForNextUpdate, controller } = renderRestHook(() => {
      const userArticles = useSuspense(ArticlePaginatedResource.getList, {
        userId: 1,
      });
      const anotherUserArticles = useSuspense(
        ArticlePaginatedResource.getList,
        { userId: 2 },
      );
      const allArticles = useSuspense(ArticlePaginatedResource.getList);
      return { userArticles, allArticles, anotherUserArticles };
    });
    await waitForNextUpdate();
    expect(result.current.userArticles).toMatchSnapshot();

    await controller.fetch(ArticlePaginatedResource.getNextPage, {
      cursor: 2,
      userId: 1,
    });

    expect(result.current.userArticles.map(({ id }) => id)).toEqual([
      5, 3, 7, 8,
    ]);
    // pagination we only explicitly extend one
    expect(result.current.allArticles.map(({ id }) => id)).toEqual([5, 3]);
    expect(result.current.anotherUserArticles.map(({ id }) => id)).toEqual([
      5, 3,
    ]);

    () =>
      controller.fetch(ArticlePaginatedResource.getNextPage, {
        cursor: 2,
        userId: 1,
        // @ts-expect-error
        sdlkjfsd: 5,
      });
    () =>
      controller.fetch(ArticlePaginatedResource.getNextPage, {
        // @ts-expect-error
        sdf: 2,
        userId: 1,
      });
    () =>
      // @ts-expect-error
      controller.fetch(ArticlePaginatedResource.getNextPage, {
        userId: 1,
      });

    nock.cleanAll();
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
            todos: [{ id: 5, title: 'do things', userId: '1' }],
          })
          .get(`/todos`)
          .reply(200, [
            { id: 5, title: 'do things', userId: '1' },
            { id: 3, title: 'ssdf', userId: '2' },
          ])
          .get(`/todos?userId=1`)
          .reply(200, [{ id: 5, title: 'do things', userId: '1' }])
          .post(`/todos`)
          .reply(200, (uri, body: any) => ({ ...body }))
          .post(`/todos?userId=5`)
          .reply(200, (uri, body: any) => ({ userId: '5', ...body }))
          .post(`/todos?userId=1`)
          .reply(200, (uri, body: any) => ({ userId: '1', ...body }));

        mynock = nock(/.*/).defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
      });

      afterEach(() => {
        nock.cleanAll();
      });

      it('should update collection on push/unshift', async () => {
        const { result, waitForNextUpdate, controller } = renderRestHook(() => {
          const todos = useSuspense(TodoResource.getList);
          const userTodos = useSuspense(TodoResource.getList, { userId: '1' });
          const user = useSuspense(UserResource.get, { id: '1' });
          return { todos, userTodos, user };
        });
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
            {
              id: 1,
              title: 'push',
              userId: '5',
            },
          );
        });
        expect(result.current.userTodos.map(({ id }) => id)).toEqual([5]);
        expect(result.current.todos.map(({ id }) => id)).toEqual([5, 3, 1]);
        expect(result.current.user.todos).toBe(result.current.userTodos);
        // userTodos didn't change so should maintain referential equality
        expect(result.current.userTodos).toBe(firstUserTodos);
        expect(result.current.user).toBe(firstUser);

        await act(async () => {
          await controller.fetch(
            TodoResource.getList.unshift,
            { userId: '1' },
            {
              id: 55,
              title: 'unshift',
            },
          );
        });
        // this adds to both the base todo list, the one with userId filter, and the nested todo list inside user object
        expect(result.current.todos.map(({ id }) => id)).toEqual([55, 5, 3, 1]);
        expect(result.current.userTodos.map(({ id }) => id)).toEqual([55, 5]);
        expect(result.current.user.todos).toBe(result.current.userTodos);

        // type checks

        () =>
          controller.fetch(
            TodoResource.getList.unshift,
            // @ts-expect-error
            { sdf: '1' },
            {
              id: 55,
              title: 'unshift',
            },
          );

        () =>
          controller.fetch(
            TodoResource.getList.unshift,
            // @ts-expect-error
            5,
            {
              id: 55,
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

        const { result, waitForNextUpdate, controller } = renderRestHook(() => {
          const ret = useSuspense(ArticleResource.getList);
          return ret;
        });
        await waitForNextUpdate();
        expect(result.current).toMatchSnapshot();

        await controller.fetch(getNextPage, { cursor: 2 });

        expect(result.current.results.map(({ id }) => id)).toEqual([
          5, 3, 7, 8,
        ]);
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

        const { result, waitForNextUpdate, controller } = renderRestHook(() => {
          const userArticles = useSuspense(getArticles, { userId: 1 });
          const anotherUserArticles = useSuspense(getArticles, { userId: 2 });
          const allArticles = useSuspense(getArticles);
          return { userArticles, allArticles, anotherUserArticles };
        });
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

        const { result, waitForNextUpdate, controller } = renderRestHook(() => {
          const userArticles = useSuspense(getArticles, { userId: 1 });
          const anotherUserArticles = useSuspense(getArticles, { userId: 2 });
          const allArticles = useSuspense(getArticles);
          return { userArticles, allArticles, anotherUserArticles };
        });
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

        const { result, waitForNextUpdate, controller } = renderRestHook(() => {
          return useSuspense(ArticleResource.getList);
        });
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
          schema: new schema.Collection(new schema.Values(Article), {
            argsKey: (urlParams, body) => ({
              ...urlParams,
            }),
          }),
        });

        const { result, waitForNextUpdate, controller } = renderRestHook(() => {
          return useSuspense(getValues);
        });
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
