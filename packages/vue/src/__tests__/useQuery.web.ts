import { schema } from '@data-client/endpoint';
import { resource } from '@data-client/rest';
import { reactive, computed } from 'vue';

import {
  ArticleWithSlug,
  ArticleSlugResource,
  ArticleResource,
  Article,
  IDEntity,
  UnionSchema,
  FirstUnion,
  SecondUnion,
} from '../../../../__tests__/new';
import useQuery from '../consumers/useQuery';
import { renderDataCompose } from '../test';

// Inline fixtures (duplicated from React tests to avoid cross-project imports)
const payloadSlug = {
  id: 5,
  title: 'hi ho',
  slug: 'hi-ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

const nested = [
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

describe('vue useQuery()', () => {
  it('should be undefined with empty state', () => {
    const { result } = renderDataCompose(() => {
      return useQuery(ArticleWithSlug, { id: payloadSlug.id });
    }, {});
    // @ts-expect-error
    result.current?.value?.doesnotexist;
    expect(result.current?.value).toBe(undefined);
  });

  it('All should be undefined with empty state', () => {
    const { result } = renderDataCompose(() => {
      return useQuery(new schema.All(ArticleWithSlug));
    }, {});
    // @ts-expect-error
    result.current?.value?.doesnotexist;
    expect(result.current?.value).toBe(undefined);
  });

  it('should fail on schema.Array', () => {
    const { result } = renderDataCompose(() => {
      // @ts-expect-error
      return useQuery(new schema.Array(ArticleWithSlug));
    }, {});
    // @ts-expect-error
    result.current?.value?.doesnotexist;
    expect(result.current?.value).toBe(undefined);
  });

  it('should find Entity by pk', async () => {
    const { result } = renderDataCompose(
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
    expect(result.current?.value).toEqual(ArticleWithSlug.fromJS(payloadSlug));

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
    const { result } = renderDataCompose(
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
    expect(result.current?.value).toEqual(ArticleWithSlug.fromJS(payloadSlug));
  });

  it('should select Collections', () => {
    const initialFixtures = [
      {
        endpoint: ArticleResource.getList,
        args: [],
        response: nested,
      },
    ];
    const { result } = renderDataCompose(
      () => {
        return useQuery(ArticleResource.getList.schema);
      },
      { initialFixtures },
    );
    expect(result.current?.value).toBeDefined();
    if (!result.current?.value) return;
    expect(result.current.value.length).toBe(nested.length);
    expect(result.current.value[0]).toBeInstanceOf(Article);
    expect(result.current.value).toMatchSnapshot();
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
    const { result, controller, waitForNextUpdate } = renderDataCompose(
      () => {
        return useQuery(ArticleResource.getList.schema, {});
      },
      { initialFixtures, resolverFixtures },
    );
    expect(result.current?.value).toBeDefined();
    if (!result.current?.value) return;
    expect(result.current.value.length).toBe(nested.length);
    await controller.fetch(ArticleResource.getList.push, {
      id: 50,
      title: 'newly added',
      content: 'this one is pushed',
    });
    await waitForNextUpdate();
    expect(result.current.value.length).toBe(nested.length + 1);
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
        todos: new schema.Collection(new schema.Array(Todo), {
          nestKey: parent => ({
            userId: parent.id,
          }),
        }),
      };
    }

    const userTodos = new schema.Collection(new schema.Array(Todo), {
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
    const { result } = renderDataCompose(
      () => {
        return useQuery(userTodos, { userId: '1' });
      },
      { initialFixtures },
    );
    expect(result.current?.value).toBeDefined();
    if (!result.current?.value) return;
    expect(result.current.value.length).toBe(1);
    expect(result.current.value[0]).toBeInstanceOf(Todo);
    expect(result.current.value).toMatchSnapshot();

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
      .mockImplementation(() => {
        // noop
      });
    const UnionResource = resource({
      path: '/union/:id',
      schema: UnionSchema,
    });

    const { result } = renderDataCompose(
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
    expect(result.current?.value).toBeDefined();
    if (!result.current?.value) {
      warnSpy.mockRestore();
      return;
    }
    expect(result.current.value.type).toBe('first');
    expect(result.current.value).toBeInstanceOf(FirstUnion);

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
      .mockImplementation(() => {
        // noop
      });

    const UnionResource = resource({
      path: '/union/:id',
      schema: UnionSchema,
    });

    const { result, controller, waitForNextUpdate } = renderDataCompose(
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
    expect(result.current?.value).toBeDefined();
    if (!result.current?.value) return;
    expect(result.current.value[0]).toBeNull();
    expect(result.current.value[1]).toBeInstanceOf(FirstUnion);
    expect(result.current.value[2]).not.toBeInstanceOf(FirstUnion);
    expect(result.current.value[3]).not.toBeInstanceOf(FirstUnion);
    expect(warnSpy.mock.calls).toMatchSnapshot();

    await controller.fetch(UnionResource.getList.push, {
      body: 'hi',
      type: 'second',
      id: '100',
    });
    await waitForNextUpdate();
    expect(result.current.value[4]).toBeInstanceOf(SecondUnion);
    expect(result.current.value).toMatchSnapshot();
    warnSpy.mockRestore();
  });

  describe('changing args', () => {
    it('should update result when Entity args change', () => {
      const payload1 = {
        id: 1,
        title: 'First Article',
        slug: 'first-article',
        content: 'content 1',
        tags: ['tag1'],
      };
      const payload2 = {
        id: 2,
        title: 'Second Article',
        slug: 'second-article',
        content: 'content 2',
        tags: ['tag2'],
      };

      const props = reactive({ id: 1 });
      const { result } = renderDataCompose(
        () => {
          return useQuery(
            ArticleWithSlug,
            computed(() => ({ id: props.id })),
          );
        },
        {
          initialFixtures: [
            {
              endpoint: ArticleSlugResource.get,
              args: [{ id: 1 }],
              response: payload1,
            },
            {
              endpoint: ArticleSlugResource.get,
              args: [{ id: 2 }],
              response: payload2,
            },
          ],
        },
      );

      expect(result.current?.value).toEqual(ArticleWithSlug.fromJS(payload1));
      expect(result.current?.value?.id).toBe(1);
      expect(result.current?.value?.title).toBe('First Article');

      props.id = 2;
      expect(result.current?.value).toEqual(ArticleWithSlug.fromJS(payload2));
      expect(result.current?.value?.id).toBe(2);
      expect(result.current?.value?.title).toBe('Second Article');
    });

    it('should update result when Entity args change from slug to id', () => {
      const props = reactive({
        id: 5 as number | undefined,
        slug: undefined as string | undefined,
      });
      const { result } = renderDataCompose(
        () => {
          return useQuery(
            ArticleWithSlug,
            computed(() => props as any),
          );
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

      expect(result.current?.value).toEqual(
        ArticleWithSlug.fromJS(payloadSlug),
      );
      expect(result.current?.value?.id).toBe(5);

      props.id = undefined;
      props.slug = payloadSlug.slug;
      expect(result.current?.value).toEqual(
        ArticleWithSlug.fromJS(payloadSlug),
      );
      expect(result.current?.value?.slug).toBe(payloadSlug.slug);
    });

    it('should return undefined when changing to non-existent entity', () => {
      const payload1 = {
        id: 1,
        title: 'First Article',
        slug: 'first-article',
        content: 'content 1',
        tags: ['tag1'],
      };

      const props = reactive({ id: 1 });
      const { result } = renderDataCompose(
        () => {
          return useQuery(
            ArticleWithSlug,
            computed(() => ({ id: props.id })),
          );
        },
        {
          initialFixtures: [
            {
              endpoint: ArticleSlugResource.get,
              args: [{ id: 1 }],
              response: payload1,
            },
          ],
        },
      );

      expect(result.current?.value).toEqual(ArticleWithSlug.fromJS(payload1));
      expect(result.current?.value?.id).toBe(1);

      props.id = 999;
      expect(result.current?.value).toBe(undefined);
    });

    it('should update nested collection when args change', () => {
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
            nestKey: parent => ({
              userId: parent.id,
            }),
          }),
        };
      }

      const userTodos = new schema.Collection(new schema.Array(Todo), {
        argsKey: ({ userId }: { userId: string }) => ({
          userId,
        }),
      });

      const UserResource = resource({ schema: User, path: '/users/:id' });

      const props = reactive({ userId: '1' });
      const { result } = renderDataCompose(
        () => {
          return useQuery(
            userTodos,
            computed(() => ({ userId: props.userId })),
          );
        },
        {
          initialFixtures: [
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
                  {
                    id: '6',
                    title: 'write tests',
                    userId: '1',
                  },
                ],
                username: 'bob',
              },
            },
            {
              endpoint: UserResource.get,
              args: [{ id: '2' }],
              response: {
                id: '2',
                todos: [
                  {
                    id: '7',
                    title: 'review code',
                    userId: '2',
                  },
                ],
                username: 'alice',
              },
            },
          ],
        },
      );

      expect(result.current?.value).toBeDefined();
      expect(result.current?.value?.length).toBe(2);
      expect(result.current?.value?.[0]?.title).toBe('finish collections');
      expect(result.current?.value?.[1]?.title).toBe('write tests');

      props.userId = '2';
      expect(result.current?.value).toBeDefined();
      expect(result.current?.value?.length).toBe(1);
      expect(result.current?.value?.[0]?.title).toBe('review code');
    });

    it('should return undefined when changing collection args to non-existent collection', () => {
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
            nestKey: parent => ({
              userId: parent.id,
            }),
          }),
        };
      }

      const userTodos = new schema.Collection(new schema.Array(Todo), {
        argsKey: ({ userId }: { userId: string }) => ({
          userId,
        }),
      });

      const UserResource = resource({ schema: User, path: '/users/:id' });

      const props = reactive({ userId: '1' });
      const { result } = renderDataCompose(
        () => {
          return useQuery(
            userTodos,
            computed(() => ({ userId: props.userId })),
          );
        },
        {
          initialFixtures: [
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
          ],
        },
      );

      expect(result.current?.value).toBeDefined();
      expect(result.current?.value?.length).toBe(1);

      props.userId = '999';
      expect(result.current?.value).toBe(undefined);
    });
  });
});
