import { schema, All, Collection } from '@data-client/endpoint';
import { CacheProvider } from '@data-client/react';
import { resource } from '@data-client/rest';
import {
  ArticleWithSlug,
  ArticleSlugResource,
  ArticleResource,
  Article,
  IDEntity,
  UnionSchema,
  FirstUnion,
  SecondUnion,
} from '__tests__/new';

// relative imports to avoid circular dependency in tsconfig references
import { act, makeRenderDataClient } from '../../../../test';
import { nested, payloadSlug } from '../test-fixtures';
import useQuery from '../useQuery';

describe('useQuery()', () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;
  beforeEach(() => {
    renderDataClient = makeRenderDataClient(CacheProvider);
  });

  it('should be undefined with empty state', () => {
    const { result } = renderDataClient(() => {
      return useQuery(ArticleWithSlug, { id: payloadSlug.id });
    }, {});
    // @ts-expect-error
    result.current?.doesnotexist;
    expect(result.current).toBe(undefined);
  });

  it('All should be undefined with empty state', () => {
    const { result } = renderDataClient(() => {
      return useQuery(new All(ArticleWithSlug));
    }, {});
    // @ts-expect-error
    result.current?.doesnotexist;
    expect(result.current).toBe(undefined);
  });

  it('should fail on schema.Array', () => {
    const { result } = renderDataClient(() => {
      // @ts-expect-error
      return useQuery(new schema.Array(ArticleWithSlug));
    }, {});
    // @ts-expect-error
    result.current?.doesnotexist;
    expect(result.current).toBe(undefined);
  });

  it('should find Entity by pk', async () => {
    const { result } = renderDataClient(
      () => {
        return useQuery(ArticleWithSlug, { id: payloadSlug.id });
      },
      {
        initialFixtures: [
          {
            endpoint: ArticleSlugResource.get,
            args: [{ id: 5 }],
            response: payloadSlug,
          },
        ],
      },
    );
    expect(result.current).toEqual(ArticleWithSlug.fromJS(payloadSlug));

    // @ts-expect-error
    () => useQuery(ArticleWithSlug);
    // @ts-expect-error
    () => useQuery(ArticleWithSlug, 5, 10);
    // @ts-expect-error
    () => useQuery(ArticleWithSlug, 5);
    // @ts-expect-error
    () => useQuery(ArticleWithSlug, { id5: 5 });
    // @ts-expect-error
    () => useQuery(ArticleWithSlug, '5');
  });

  it('should find Entity by slug', async () => {
    const { result } = renderDataClient(
      () => {
        return useQuery(ArticleWithSlug, { slug: payloadSlug.slug });
      },
      {
        initialFixtures: [
          {
            endpoint: ArticleSlugResource.get,
            args: [{ id: 5 }],
            response: payloadSlug,
          },
        ],
      },
    );
    expect(result.current).toEqual(ArticleWithSlug.fromJS(payloadSlug));
  });

  it('should select Collections', () => {
    const initialFixtures = [
      {
        endpoint: ArticleResource.getList,
        args: [],
        response: nested,
      },
    ];
    const { result } = renderDataClient(
      () => {
        return useQuery(ArticleResource.getList.schema);
      },
      { initialFixtures },
    );
    expect(result.current).toBeDefined();
    if (!result.current) return;
    expect(result.current.length).toBe(nested.length);
    expect(result.current[0]).toBeInstanceOf(Article);
    expect(result.current).toMatchSnapshot();
  });

  it('should update Collections when pushed', async () => {
    const initialFixtures = [
      {
        endpoint: ArticleResource.getList,
        args: [],
        response: nested,
      },
    ];
    const resolverFixtures = [
      {
        endpoint: ArticleResource.getList.push,
        response(body: any) {
          return body;
        },
      },
    ];
    const { result, controller } = renderDataClient(
      () => {
        return useQuery(ArticleResource.getList.schema, {});
      },
      { initialFixtures, resolverFixtures },
    );
    expect(result.current).toBeDefined();
    if (!result.current) return;
    expect(result.current.length).toBe(nested.length);
    await act(async () => {
      await controller.fetch(ArticleResource.getList.push, {
        id: 50,
        title: 'newly added',
        content: 'this one is pushed',
      });
    });
    expect(result.current.length).toBe(nested.length + 1);
  });

  it('should retrieve a nested collection', () => {
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

    const userTodos = new Collection(new schema.Array(Todo), {
      argsKey: ({ userId }: { userId: string }) => ({
        userId,
      }),
    });

    const UserResource = resource({ schema: User, path: '/users/:id' });

    const initialFixtures = [
      {
        endpoint: UserResource.get,
        args: [{ id: '1' }],
        response: {
          id: '1',
          todos: [
            {
              id: '5',
              title: 'finish collections',
              userId: '1',
            },
          ],
          username: 'bob',
        },
      },
    ];
    const { result } = renderDataClient(
      () => {
        return useQuery(userTodos, { userId: '1' });
      },
      { initialFixtures },
    );
    expect(result.current).toBeDefined();
    if (!result.current) return;
    expect(result.current.length).toBe(1);
    expect(result.current[0]).toBeInstanceOf(Todo);
    expect(result.current).toMatchSnapshot();

    // @ts-expect-error
    () => useQuery(userTodos, { userId: { hi: '5' } });
    // @ts-expect-error
    () => useQuery(userTodos, { userIdd: '1' });
    // @ts-expect-error
    () => useQuery(userTodos, { bob: '1' });
    // @ts-expect-error
    () => useQuery(userTodos);
  });

  it('should work with unions', async () => {
    const warnSpy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    const UnionResource = resource({
      path: '/union/:id',
      schema: UnionSchema,
    });

    const { result } = renderDataClient(
      () => {
        return useQuery(UnionResource.get.schema, { id: '5', type: 'first' });
      },
      {
        initialFixtures: [
          {
            endpoint: UnionResource.getList,
            args: [],
            response: [
              { id: '5', body: 'hi', type: 'first' },
              { id: '6', body: 'hi', type: 'another' },
            ],
          },
        ],
      },
    );
    expect(result.current).toBeDefined();
    if (!result.current) {
      warnSpy.mockRestore();
      return;
    }
    expect(result.current.type).toBe('first');
    expect(result.current).toBeInstanceOf(FirstUnion);

    // these are the 'fallback case' where it cannot determine type discriminator, so just enumerates
    () => useQuery(UnionResource.get.schema, { id: '5' });
    () => useQuery(UnionResource.get.schema, { body: '5' });

    // @ts-expect-error
    () => useQuery(UnionResource.get.schema, { id: '5', type: 'notvalid' });
    // @ts-expect-error
    () => useQuery(UnionResource.get.schema, { doesnotexist: '5' });
    // @ts-expect-error
    () => useQuery(UnionResource.get.schema);

    expect(warnSpy.mock.calls).toMatchSnapshot();
    warnSpy.mockRestore();
  });

  it('should work with unions collections', async () => {
    const warnSpy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});

    const UnionResource = resource({
      path: '/union/:id',
      schema: UnionSchema,
    });

    const { result, controller } = renderDataClient(
      () => {
        return useQuery(UnionResource.getList.schema);
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
    if (!result.current) return;
    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBeInstanceOf(FirstUnion);
    expect(result.current[2]).not.toBeInstanceOf(FirstUnion);
    expect(result.current[3]).not.toBeInstanceOf(FirstUnion);
    expect(warnSpy.mock.calls).toMatchSnapshot();

    await act(async () => {
      await controller.fetch(UnionResource.getList.push, {
        body: 'hi',
        type: 'second',
        id: '100',
      });
    });
    expect(result.current[4]).toBeInstanceOf(SecondUnion);
    expect(result.current).toMatchSnapshot();
    warnSpy.mockRestore();
  });
});
