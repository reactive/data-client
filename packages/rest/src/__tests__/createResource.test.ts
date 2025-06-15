import { Entity, PolymorphicInterface, schema } from '@data-client/endpoint';
import type { DefaultArgs } from '@data-client/endpoint';
import {
  CacheProvider,
  useCache,
  useController,
  Controller,
  useSuspense,
  useQuery,
} from '@data-client/react';
import { makeRenderDataClient, act } from '@data-client/test';
import nock, { ReplyHeaders } from 'nock';

import resource from '../resource';
import RestEndpoint, { RestGenerics } from '../RestEndpoint';

describe('resource()', () => {
  const renderDataClient: ReturnType<typeof makeRenderDataClient> =
    makeRenderDataClient(CacheProvider);
  let mynock: nock.Scope;

  class User extends Entity {
    readonly id: number | undefined = undefined;
    readonly username: string = '';
    readonly email: string = '';
    readonly isAdmin: boolean = false;

    pk() {
      return this.id?.toString();
    }
  }
  class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
    parseResponse(response: Response): Promise<any> {
      return super.parseResponse(response);
    }

    getRequestInit(body: any) {
      if (typeof body === 'object') {
        return super.getRequestInit({ ...body, email: 'always@always.com' });
      }
      return super.getRequestInit(body);
    }

    additional = 5;
  }

  const UserResource = resource({
    path: 'http\\://test.com/groups/:group/users/:id',
    schema: User,
    Endpoint: MyEndpoint,
  });

  const userPayload = {
    id: 5,
    username: 'ntucker',
    email: 'bob@vila.com',
    isAdmin: true,
  };

  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/groups/five/users/${userPayload.id}`)
      .reply(200, userPayload)
      .get(`/groups/five/users`)
      .reply(200, [userPayload])
      .options(/.*/)
      .reply(200);
    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('can override endpoint options', async () => {
    const UserResourceBase = resource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
    });
    // @ts-expect-error
    UserResourceBase.getList.getPage.paginationField;
    const UserResource = UserResourceBase.extend('getList', {
      path: ':blob',
      searchParams: {} as { isAdmin?: boolean },
      paginationField: 'cursor',
      getOptimisticResponse(snap, params) {
        params.isAdmin;
        params.blob;
        // @ts-expect-error
        params.nothere;
        return [] as User[];
      },
      process(users: User[]) {
        if (!Array.isArray(users)) return users;
        return users.slice(0, 7);
      },
    })
      .extend('partialUpdate', {
        getOptimisticResponse(snap, params, body) {
          params.id;
          params.group;
          // @ts-expect-error
          params.nothere;
          return {
            id: params.id,
            ...body,
          };
        },
      })
      .extend('delete', {
        getOptimisticResponse(snap, params) {
          return params;
        },
      })
      .extend('justget', {})
      .extend('current', {
        path: '/current',
        searchParams: {} as { isAdmin?: boolean },
      })
      .extend('toggleAdmin', {
        path: '/toggle/:id',
        method: 'POST',
        body: undefined,
      });

    () => UserResource.getList({ blob: '5', isAdmin: true });
    () =>
      UserResource.getList.getPage({
        blob: '5',
        isAdmin: true,
        cursor: 'next',
      });
    () => UserResource.getList.getPage({ blob: '5', cursor: 'next' });
    () =>
      // @ts-expect-error
      UserResource.getList.getPage({ blob: '5', isAdmin: true });
    () =>
      // @ts-expect-error
      UserResource.getList.getPage({
        cursor: 'next',
        isAdmin: true,
      });
    () => UserResource.get({ group: '1', id: '5' });
    () => UserResource.getList.push({ blob: '5' }, { username: 'bob' });
    () =>
      UserResource.getList.push(
        { blob: '5', isAdmin: true },
        { username: 'bob' },
      );
    () =>
      UserResource.getList.push(
        { blob: '5', isAdmin: false },
        { username: 'bob' },
      );
    // @ts-expect-error
    () => UserResource.getList.push({ group: 'bob' }, { username: 'bob' });
    () => UserResource.get({ id: 'hi', group: 'group' });
    () => UserResource.justget({ group: 'blob', id: '5' });
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });
    () => UserResource.current();
    () => UserResource.current({ isAdmin: true });
    () => UserResource.toggleAdmin({ id: '5' });
    () => {
      // @ts-expect-error - POST should make this have sideEffect true
      const DONOTUSE: false = UserResource.toggleAdmin.sideEffect;
    };
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });

    mynock.get(`/current`).reply(200, {
      id: 5,
      username: 'bob',
      email: 'bob@bob.com',
      isAdmin: false,
    });

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      return useSuspense(UserResource.current);
    });
    await waitForNextUpdate();
    expect(result.current.email).toBe('bob@bob.com');
    // @ts-expect-error
    expect(result.current.notexist).toBeUndefined();

    mynock.post(`/5`).reply(200, (uri, body) => ({
      id: 10,
      username: 'bob',
      email: 'bob@bob.com',
      ...(body as any),
    }));

    const user = await controller.fetch(
      UserResource.getList.push,
      { blob: '5' },
      { username: 'newbob' },
    );
    expect(user.username).toBe('newbob');
    expect(user).toBeInstanceOf(User);
    expect(user.isAdmin).toBe(false);

    // check types
    () => controller.getResponse(UserResource.current, controller.getState());
  });

  it('can override endpoint options', async () => {
    const UserResourceBase = resource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
      paginationField: 'cursor',
    });
    const UserResource = UserResourceBase.extend({
      getList: {
        path: ':blob',
        searchParams: {} as { isAdmin?: boolean },
        getOptimisticResponse(snap, params) {
          params.isAdmin;
          params.blob;
          // @ts-expect-error
          params.nothere;
          return [] as User[];
        },
        /*process(users: User[]) {
            return users.slice(0, 7);
          }, TODO: why doesn't this work?*/
      },
      partialUpdate: {
        getOptimisticResponse(snap, params, body) {
          params.id;
          params.group;
          // @ts-expect-error
          params.nothere;
          return {
            id: params.id,
            ...body,
          };
        },
      },
      delete: {
        getOptimisticResponse(snap, params) {
          return params;
        },
      },
    })
      .extend('justget', {})
      .extend('current', {
        path: '/current',
        searchParams: {} as { isAdmin?: boolean },
      })
      .extend('toggleAdmin', {
        path: '/toggle/:id',
        method: 'POST',
        body: undefined,
        getOptimisticResponse(snap, params) {
          params.id;
          // @ts-expect-error
          params.group;
          return {
            id: params.id,
          };
        },
      });

    () => UserResource.getList({ blob: '5', isAdmin: true });
    () =>
      UserResource.getList.getPage({
        blob: '5',
        isAdmin: true,
        cursor: 'next',
      });
    () => UserResource.getList.getPage({ blob: '5', cursor: 'next' });
    // @ts-expect-error
    () => UserResource.getList.getPage({ blob: '5', isAdmin: true });
    // @ts-expect-error
    () => UserResource.getList.getPage({ cursor: 'next', isAdmin: true });
    () => UserResource.get({ group: '1', id: '5' });
    () => UserResource.getList.push({ blob: '5' }, { username: 'bob' });
    () =>
      UserResource.getList.push(
        { blob: '5', isAdmin: true },
        { username: 'bob' },
      );
    () =>
      UserResource.getList.push(
        { blob: '5', isAdmin: false },
        { username: 'bob' },
      );
    // @ts-expect-error
    () => UserResource.getList.push({ group: 'bob' }, { username: 'bob' });
    () => UserResource.get({ id: 'hi', group: 'group' });
    () => UserResource.justget({ group: 'blob', id: '5' });
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });
    () => UserResource.current();
    () => UserResource.current({ isAdmin: true });
    () => UserResource.toggleAdmin({ id: '5' });
    () => {
      // @ts-expect-error - POST should make this have sideEffect true
      const DONOTUSE: false = UserResource.toggleAdmin.sideEffect;
    };
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });

    mynock.get(`/current`).reply(200, {
      id: 5,
      username: 'bob',
      email: 'bob@bob.com',
      isAdmin: false,
    });

    mynock.get(`/5?isAdmin=false`).reply(200, [
      {
        id: 5,
        username: 'bob',
        email: 'bob@bob.com',
        isAdmin: false,
      },
    ]);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      return [
        useSuspense(UserResource.current),
        useSuspense(UserResource.getList, { blob: '5', isAdmin: false }),
      ] as const;
    });
    await waitForNextUpdate();
    expect(result.current[1].length).toBe(1);

    expect(result.current[0].email).toBe('bob@bob.com');
    // @ts-expect-error
    expect(result.current[0].notexist).toBeUndefined();

    mynock.post(`/5?isAdmin=false`).reply(201, (uri, body) => ({
      id: 10,
      username: 'bob',
      email: 'newbob@bob.com',
      ...(body as any),
    }));

    await act(async () => {
      const user = await controller.fetch(
        UserResource.getList.push,
        { blob: '5', isAdmin: false },
        { username: 'newbob' },
      );
      expect(user.username).toBe('newbob');
      expect(user).toBeInstanceOf(User);
      expect(user.isAdmin).toBe(false);
    });
    expect(result.current[1].length).toBe(2);
    expect(result.current[1][1].username).toBe('newbob');
  });

  it('can override with no generics', async () => {
    const UserResource = resource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
      paginationField: 'cursor',
    }).extend({
      getList: {
        dataExpiryLength: 10 * 60 * 1000,
      },
    });

    const a: undefined = UserResource.getList.sideEffect;
    // @ts-expect-error
    const b: true = UserResource.getList.sideEffect;
    () => useSuspense(UserResource.getList, { group: 'hi' });
  });

  it('can override resource endpoints (function form)', async () => {
    const UserResource = resource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
      paginationField: 'cursor',
    }).extend(resourceBase => ({
      getList: resourceBase.getList.extend({
        path: ':blob',
        searchParams: {} as { isAdmin?: boolean },
        getOptimisticResponse(snap, params) {
          params.isAdmin;
          params.blob;
          // @ts-expect-error
          params.nothere;
          return [] as User[];
        },
        process(users: User[]) {
          if (!Array.isArray(users)) return users;
          return users.slice(0, 7);
        },
      }),
      partialUpdate: resourceBase.partialUpdate.extend({
        getOptimisticResponse(snap, params, body) {
          params.id;
          params.group;
          // @ts-expect-error
          params.nothere;
          return {
            id: params.id,
            ...body,
          };
        },
      }),
      delete: resourceBase.delete.extend({
        getOptimisticResponse(snap, params) {
          return params;
        },
      }),
      justget: resourceBase.get,
      current: resourceBase.get.extend({
        path: '/current',
        searchParams: {} as { isAdmin?: boolean },
      }),
      toggleAdmin: resourceBase.get.extend({
        path: '/toggle/:id',
        method: 'POST',
        body: undefined,
        getOptimisticResponse(snap, params) {
          params.id;
          // @ts-expect-error
          params.group;
          return {
            id: params.id,
          };
        },
      }),
    }));

    () => UserResource.getList({ blob: '5', isAdmin: true });
    () =>
      UserResource.getList.getPage({
        blob: '5',
        isAdmin: true,
        cursor: 'next',
      });
    () => UserResource.getList.getPage({ blob: '5', cursor: 'next' });
    // @ts-expect-error
    () => UserResource.getList.getPage({ blob: '5', isAdmin: true });
    // @ts-expect-error
    () => UserResource.getList.getPage({ cursor: 'next', isAdmin: true });
    () => UserResource.get({ group: '1', id: '5' });
    () => UserResource.getList.unshift({ blob: '5' }, { username: 'bob' });
    () =>
      UserResource.getList.push(
        { blob: '5', isAdmin: true },
        { username: 'bob' },
      );
    () =>
      UserResource.getList.push(
        { blob: '5', isAdmin: false },
        { username: 'bob' },
      );
    // @ts-expect-error
    () => UserResource.getList.push({ group: 'bob' }, { username: 'bob' });
    () => UserResource.get({ id: 'hi', group: 'group' });
    () => UserResource.justget({ group: 'blob', id: '5' });
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });
    () => UserResource.current();
    () => UserResource.current({ isAdmin: true });
    () => UserResource.toggleAdmin({ id: '5' });
    () => {
      // @ts-expect-error - POST should make this have sideEffect true
      const DONOTUSE: false = UserResource.toggleAdmin.sideEffect;
    };
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });

    mynock.get(`/current`).reply(200, {
      id: 5,
      username: 'bob',
      email: 'bob@bob.com',
      isAdmin: false,
    });

    mynock.get(`/5?isAdmin=false`).reply(200, [
      {
        id: 5,
        username: 'bob',
        email: 'bob@bob.com',
        isAdmin: false,
      },
    ]);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      return [
        useSuspense(UserResource.current),
        useSuspense(UserResource.getList, { blob: '5', isAdmin: false }),
      ] as const;
    });
    await waitForNextUpdate();
    expect(result.current[1].length).toBe(1);

    expect(result.current[0].email).toBe('bob@bob.com');
    // @ts-expect-error
    expect(result.current[0].notexist).toBeUndefined();

    mynock.post(`/5?isAdmin=false`).reply(201, (uri, body) => ({
      id: 10,
      username: 'bob',
      email: 'newbob@bob.com',
      ...(body as any),
    }));

    await act(async () => {
      const user = await controller.fetch(
        UserResource.getList.push,
        { blob: '5', isAdmin: false },
        { username: 'newbob' },
      );
      expect(user.username).toBe('newbob');
      expect(user).toBeInstanceOf(User);
      expect(user.isAdmin).toBe(false);
    });
    expect(result.current[1].length).toBe(2);
    expect(result.current[1][1].username).toBe('newbob');
  });

  it('should not allow paths without at least one argument', () => {
    class Todo extends Entity {
      id = '';
      userId = 0;
      title = '';
      completed = false;

      static key = 'Todo';
      pk() {
        return this.id;
      }
    }

    expect(() =>
      resource({
        // TODO(see path types): @ts-expect-error
        path: '/todos/',
        schema: Todo,
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('UserResource.get should work', async () => {
    const { result, waitForNextUpdate } = renderDataClient(() => {
      return useSuspense(UserResource.get, { group: 'five', id: '5' });
    });
    await waitForNextUpdate();
    expect(result.current).toEqual(User.fromJS(userPayload));
    result.current.isAdmin;
    //@ts-expect-error
    expect(result.current.notaMember).toBeUndefined();

    // @ts-expect-error
    () => useSuspense(UserResource.get, { id: '5' });
    // @ts-expect-error
    () => useSuspense(UserResource.get, { group: 'five' });
  });

  it('UserResource.getList should work', async () => {
    const { result, waitForNextUpdate } = renderDataClient(() => {
      return useSuspense(UserResource.getList, { group: 'five' });
    });
    await waitForNextUpdate();
    expect(result.current[0]).toEqual(User.fromJS(userPayload));
    result.current[0].isAdmin;
    //@ts-expect-error
    expect(result.current[0].notaMember).toBeUndefined();
    type A = Parameters<typeof UserResource.getList>;

    // @ts-expect-error
    () => useSuspense(UserResource.getList, { id: '5' });
    // @ts-expect-error
    () => useSuspense(UserResource.getList, {});
    // @ts-expect-error
    () => useSuspense(UserResource.getList);
  });

  it('UserResource.update should work', async () => {
    mynock
      .put(`/groups/five/users/${userPayload.id}`)
      .reply(200, (uri, body: any) => ({
        ...userPayload,
        ...body,
      }));

    const { result, waitForNextUpdate } = renderDataClient(
      () => {
        return [
          useSuspense(UserResource.get, { group: 'five', id: '5' }),
          useController(),
        ] as const;
      },
      {
        initialFixtures: [
          {
            endpoint: UserResource.get,
            args: [{ group: 'five', id: '5' }],
            response: userPayload,
          },
        ],
      },
    );
    // eslint-disable-next-line prefer-const
    let [user, controller] = result.current;
    expect(user.username).toBe(userPayload.username);
    await act(() => {
      controller.fetch(
        UserResource.update,
        { group: 'five', id: '5' },
        { username: 'never' },
      );
    });
    await waitForNextUpdate();
    [user] = result.current;
    expect(user.username).toBe('never');

    () =>
      controller.fetch(
        UserResource.update,
        { group: 'five', id: '5' },
        { username: 'never' },
        // @ts-expect-error
        { username: 'never' },
      );
    // @ts-expect-error
    () => controller.fetch(UserResource.update, { username: 'never' });
    // @ts-expect-error
    () => controller.fetch(UserResource.update, 1, 'hi');
    () =>
      controller.fetch(
        UserResource.update,
        { group: 'five', id: '5' },
        // @ts-expect-error
        { sdf: 'never' },
      );
    () =>
      controller.fetch(
        UserResource.update,
        // @ts-expect-error
        { sdf: 'five', id: '5' },
        { username: 'never' },
      );
  });

  it('UserResource.getList.push should work', async () => {
    mynock.post(`/groups/five/users`).reply(200, (uri, body: any) => ({
      id: 5,
      ...body,
    }));

    const { result } = renderDataClient(() => {
      return [
        useCache(UserResource.get, { group: 'five', id: '5' }),
        useController(),
      ] as const;
    });
    // eslint-disable-next-line prefer-const
    let [_, controller] = result.current;
    await act(async () => {
      await controller.fetch(
        UserResource.getList.push,
        { group: 'five' },
        {
          username: 'createduser',
          email: 'haha@gmail.com',
        },
      );
    });
    const user = result.current[0];
    expect(user).toBeDefined();
    expect(user?.username).toBe('createduser');
    // our custom endpoint ensures this
    expect(user?.email).toBe('always@always.com');

    () =>
      controller.fetch(
        UserResource.getList.push,
        // @ts-expect-error
        { id: 'five' },
        { username: 'never' },
      );
    // @ts-expect-error
    () => controller.fetch(UserResource.getList.push, { username: 'never' });
    // @ts-expect-error
    () => controller.fetch(UserResource.getList.push, 1, 'hi');
    () =>
      controller.fetch(
        UserResource.getList.push,
        { group: 'five' },
        // @ts-expect-error
        { sdf: 'never' },
      );
    () =>
      controller.fetch(
        UserResource.getList.push,
        // @ts-expect-error
        { sdf: 'five' },
        { username: 'never' },
      );
  });

  it.each([
    {
      response: {
        id: userPayload.id,
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      } as ReplyHeaders,
    },
    {
      response: '',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text',
      } as ReplyHeaders,
    },
  ])(
    'UserResource.delete should work with $response',
    async ({ response, headers }) => {
      mynock
        .delete(`/groups/five/users/${userPayload.id}`)
        .reply(200, (uri, body: any) => response, headers);
      const { result, waitForNextUpdate } = renderDataClient(
        () => {
          return [
            useSuspense(UserResource.get, { group: 'five', id: '5' }),
            useController(),
          ] as const;
        },
        {
          initialFixtures: [
            {
              endpoint: UserResource.get,
              args: [{ group: 'five', id: '5' }],
              response: userPayload,
            },
          ],
          resolverFixtures: [
            {
              endpoint: UserResource.get,
              args: [{ group: 'five', id: '5' }],
              response: 'not found',
              error: true,
            },
          ],
        },
      );
      // eslint-disable-next-line prefer-const
      let [user, controller] = result.current;
      expect(user.username).toBe(userPayload.username);
      await act(() => {
        controller.fetch(UserResource.delete, { group: 'five', id: '5' });
      });
      await waitForNextUpdate();
      // this means we suspended; so it hit the resolver fixture
      expect(result.error).toMatchSnapshot();

      () =>
        controller.fetch(
          UserResource.delete,
          { group: 'five', id: '5' },
          // @ts-expect-error
          { username: 'never' },
        );
      // @ts-expect-error
      () => controller.fetch(UserResource.delete);
      // @ts-expect-error
      () => controller.fetch(UserResource.delete, 1);
      () =>
        controller.fetch(
          UserResource.delete,
          // @ts-expect-error
          { sdf: 'never' },
        );
    },
  );

  it('should allow complete overrides', async () => {
    mynock
      .get(`/groups/vi/users/5`)
      .reply(200, { id: 5, title: 'hi', username2: 'bob' });

    class User2 extends Entity {
      readonly id: number | undefined = undefined;
      readonly username2: string = '';
      readonly email: string = '';
      readonly isAdmin: boolean = false;

      pk() {
        return this.id?.toString();
      }
    }
    const UserResourceExtend = {
      ...UserResource,
      get: UserResource.get.extend({
        path: 'http\\://test.com/groups/:magic/users/:id',
        schema: User2,
      }),
    };
    const { result, waitForNextUpdate } = renderDataClient(() => {
      return useSuspense(UserResourceExtend.get, { magic: 'vi', id: 5 });
    });
    await waitForNextUpdate();

    expect(result.current.username2).toBe('bob');
    // @ts-expect-error
    expect(result.current.username).toBeUndefined();
  });

  describe('unions', () => {
    const feedPayload = {
      id: '5',
      title: 'my first feed',
      type: 'link' as const,
      url: 'https://true.io',
    };

    class Feed extends Entity {
      readonly id: string = '';
      readonly title: string = '';
      readonly type: 'link' | 'post' = 'post';
      pk() {
        return this.id;
      }
    }
    class FeedLink extends Feed {
      readonly url: string = '';
      readonly type = 'link' as const;
    }
    class FeedPost extends Feed {
      readonly content: string = '';
      readonly type = 'post' as const;
    }
    const FeedUnion = new schema.Union(
      { post: FeedPost, link: FeedLink },
      'type',
    );
    const FeedResource = resource({
      path: 'http\\://test.com/feed/:id',
      schema: FeedUnion,
      Endpoint: MyEndpoint,
    });

    it('should work with detail', async () => {
      mynock.get(`/feed/${feedPayload.id}`).reply(200, feedPayload);

      const { result, waitForNextUpdate } = renderDataClient(() => {
        return useSuspense(FeedResource.get, { id: '5' });
      });
      await waitForNextUpdate();
      const feed = result.current;
      if (feed.type === 'link') {
        expect(feed.url).toBe(feedPayload.url);
        // @ts-expect-error
        expect(feed.content).toBeUndefined();
      } else {
        // this branch doesn't run - just a type test
        feed.content;
        // @ts-expect-error
        expect(feed.url).toBeUndefined();
      }
      // another type test
      // @ts-expect-error
      () => useSuspense(FeedResource.get, { sdf: '5' });

      // @ts-expect-error
      () => FeedResource.get({ id: '5', sdf: '5' });
      // @ts-expect-error
      () => FeedResource.get({ id: '5' }, 5);
    });

    it('should work with list [no args]', async () => {
      mynock.get(`/feed`).reply(200, [feedPayload]);

      const { result, waitForNextUpdate } = renderDataClient(() => {
        return useSuspense(FeedResource.getList);
      });
      await waitForNextUpdate();
      const feed = result.current[0];
      if (feed.type === 'link') {
        expect(feed.url).toBe(feedPayload.url);
        // @ts-expect-error
        expect(feed.content).toBeUndefined();
      } else {
        // this branch doesn't run - just a type test
        feed.content;
        // @ts-expect-error
        expect(feed.url).toBeUndefined();
      }
      // another type test
      // @ts-expect-error
      () => useSuspense(FeedResource.getList, 5);

      // @ts-expect-error
      () => FeedResource.getList({ id: '5' }, 5);
    });

    it('should work with getList.push [no args]', async () => {
      mynock.post(`/feed`).reply(200, (uri, body: any) => ({
        id: 5,
        ...body,
      }));

      const { result, waitForNextUpdate } = renderDataClient(() => {
        return [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore users should useQuery() for this now.
          // Tho there is an argument for useSuspense() being able to pre-use it
          useCache(FeedResource.get, { id: '5', type: 'link' }),
          useController(),
          useQuery(FeedUnion, { id: '5', type: 'link' }),
        ] as const;
      });
      // eslint-disable-next-line prefer-const
      let [_, controller] = result.current;
      await act(() => {
        controller.fetch(FeedResource.getList.push, feedPayload);
      });
      await waitForNextUpdate();
      const feed = result.current[0];
      expect(feed).toBeDefined();
      if (!feed) throw new Error('never');
      if (feed.type === 'link') {
        expect(feed.url).toBe(feedPayload.url);
        // @ts-expect-error
        expect(feed.content).toBeUndefined();
      }
      expect(feed).toBe(result.current[2]);

      () => {
        // @ts-expect-error
        useQuery(FeedUnion, { id: '5', typed: 'link' });
        // @ts-expect-error
        useQuery(FeedUnion, { id: '5' });
        // @ts-expect-error
        useQuery(FeedUnion, { id: '5', type: 'bob' });
      };

      () =>
        controller.fetch(
          UserResource.create,
          // @ts-expect-error
          { id: 'five' },
          { username: 'never' },
        );
      // @ts-expect-error
      () => controller.fetch(UserResource.getList.push, { username: 'never' });
      // @ts-expect-error
      () => controller.fetch(UserResource.getList.push, 1, 'hi');
      () =>
        controller.fetch(
          UserResource.getList.push,
          { group: 'five' },
          // @ts-expect-error
          { sdf: 'never' },
        );
      () =>
        controller.fetch(
          UserResource.getList.push,
          // @ts-expect-error
          { sdf: 'five' },
          { username: 'never' },
        );
    });
  });

  it('UserResource.getList.push.extends() should work', async () => {
    interface CreateDeviceBody {
      username: string;
    }
    interface UserInterface {
      readonly id: number | undefined;
      readonly username: string;
      readonly email: string;
      readonly isAdmin: boolean;
    }

    const createUser = UserResource.getList.push.extend({
      update: (newId, params) => {
        return {
          [UserResource.getList.key({ group: params.group })]: (
            prevResponse = { items: [] },
          ) => ({
            items: [...prevResponse.items, newId],
          }),
        };
      },
      //searchParams: undefined as any,
      body: {} as CreateDeviceBody,
      schema: User,
      sideEffect: true,
      process(...args: any) {
        return UserResource.getList.push.process.apply(
          this,
          args,
        ) as UserInterface;
      },
    });
    const ctrl = new Controller();
    () => ctrl.fetch(createUser, { group: 'hi' }, { username: 'bob' });
    () => createUser({ group: 'hi' }, { username: 'bob' });
    // @ts-expect-error
    () => createUser({ group: 'hi', id: 'what' }, { username: 'bob' });
    // @ts-expect-error
    () => createUser({ group: 'hi' });
    // @ts-expect-error
    () => createUser.url({ group: 'hi', id: 'what' }, { username: 'bob' });
    expect(createUser.url({ group: 'hi' }, {} as any)).toMatchInlineSnapshot(
      `"http://test.com/groups/hi/users"`,
    );
  });

  it('UserResource.getList.push.extends() should work with zero urlParams', async () => {
    const UserResource = resource({
      path: 'http\\://test.com/users/:id',
      schema: User,
      Endpoint: MyEndpoint,
    });
    interface CreateDeviceBody {
      username: string;
    }
    interface UserInterface {
      readonly id: number | undefined;
      readonly username: string;
      readonly email: string;
      readonly isAdmin: boolean;
    }

    const createUser = UserResource.getList.push.extend({
      update: newId => {
        return {
          [UserResource.getList.key()]: (prevResponse = { items: [] }) => ({
            items: [...prevResponse.items, newId],
          }),
        };
      },
      //searchParams: undefined as any,
      body: {} as CreateDeviceBody,
      schema: User,
      sideEffect: true,
      process(...args: any) {
        return UserResource.getList.push.process.apply(
          this,
          args,
        ) as UserInterface;
      },
    });
    const ctrl = new Controller();
    () => ctrl.fetch(createUser, { username: 'bob' });
    () => createUser({ username: 'bob' });
    // @ts-expect-error
    () => createUser({ id: 'what' }, { username: 'bob' });
    // @ts-expect-error
    () => createUser({ id: 'what' });
    // @ts-expect-error
    () => createUser.url({ id: 'what' }, { username: 'bob' });
    expect(createUser.url({} as any)).toMatchInlineSnapshot(
      `"http://test.com/users"`,
    );
  });

  it('getList.push should use custom lifecycle methods of getList', async () => {
    mynock.post(`/users`).reply(201, (uri, body: any) => ({
      ...body,
      id: 5,
    }));
    const UserResource = resource({
      path: '/users/:id',
      schema: User,
      optimistic: true,
    }).extend(Base => ({
      getList: Base.getList.extend({
        getRequestInit(body) {
          if (body) {
            return Base.getList.getRequestInit.call(this, {
              id: Math.random(),
              isAdmin: true,
              ...body,
            });
          }
          return Base.getList.getRequestInit.call(this, body);
        },
      }),
    }));

    const { controller, result } = renderDataClient(
      () => {
        return useSuspense(UserResource.getList);
      },
      {
        initialFixtures: [
          {
            endpoint: UserResource.getList,
            args: [],
            response: [],
          },
        ],
      },
    );
    await act(async () => {
      await controller.fetch(UserResource.getList.push, { username: 'bob' });
    });
    expect(result.current.length).toBe(1);
    // this is set in our override
    expect(result.current[0].isAdmin).toBe(true);
  });

  it('searchParams are used in Queries based on getList.schema', () => {
    class Todo extends Entity {
      id = '';
      readonly userId: number = 0;
      readonly title: string = '';
      readonly completed: boolean = false;

      static key = 'Todo';

      pk() {
        return this.id;
      }
    }

    const TodoResource = resource({
      path: '/todos/:id',
      schema: Todo,
      optimistic: true,
      searchParams: {} as { userId?: string | number } | undefined,
    });

    const queryRemainingTodos = new schema.Query(
      TodoResource.getList.schema,
      entries => entries.filter(todo => !todo.completed).length,
    );

    () => useQuery(queryRemainingTodos, { userId: 1 });
    () => useQuery(queryRemainingTodos);
    // @ts-expect-error
    () => useQuery(queryRemainingTodos, { user: 1 });
    // @ts-expect-error
    () => useQuery(queryRemainingTodos, 5);
    // @ts-expect-error
    () => useQuery(queryRemainingTodos, { userId: 1 }, 5);
  });

  describe('warnings', () => {
    let warnSpy: jest.Spied<typeof console.warn>;
    afterEach(() => {
      warnSpy.mockRestore();
    });
    beforeEach(() => {
      warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    });

    it('should warn when mis-capitalizing options', () => {
      resource({
        path: 'http\\://test.com/users/:id',
        schema: User,
        endpoint: MyEndpoint,
      });
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls).toMatchSnapshot();
    });
    it('should warn when mis-capitalizing options', () => {
      class MyCollection<
        S extends any[] | PolymorphicInterface = any,
        Args extends any[] = DefaultArgs,
        Parent = any,
      > extends schema.Collection<S, Args, Parent> {
        // getList.push should add to Collections regardless of its 'orderBy' argument
        // in other words: `orderBy` is a non-filtering argument - it does not influence which results are returned
        nonFilterArgumentKeys(key: string) {
          return key === 'orderBy';
        }
      }
      resource({
        path: 'http\\://test.com/users/:id',
        schema: User,
        collection: MyCollection,
      });
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls).toMatchSnapshot();
    });
  });
});
