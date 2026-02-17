import {
  Entity,
  PolymorphicInterface,
  schema,
  Union,
  Query,
} from '@data-client/endpoint';
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
    readonly group: string = '';

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

  it('UserResource.getList.remove should work', async () => {
    mynock
      .patch(`/groups/five/users`)
      .reply(200, (uri, body: any) => ({ ...body }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          user2: useQuery(User, { id: 2 }),
          groupFive: useCache(UserResource.getList, { group: 'five' }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: UserResource.getList,
            args: [{ group: 'five' }],
            response: [
              {
                id: 1,
                username: 'user1',
                email: 'user1@example.com',
                group: 'five',
              },
              {
                id: 2,
                username: 'user2',
                email: 'user2@example.com',
                group: 'five',
              },
            ],
          },
        ],
      },
    );

    expect(result.current.groupFive).toEqual([
      User.fromJS({
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        group: 'five',
      }),
      User.fromJS({
        id: 2,
        username: 'user2',
        email: 'user2@example.com',
        group: 'five',
      }),
    ]);

    // Verify the remove endpoint can be called and completes successfully
    await act(async () => {
      const response = await controller.fetch(
        UserResource.getList.remove,
        { group: 'five' },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          group: 'newgroup',
        },
      );
      expect(response.id).toEqual(2);
    });

    // should remove the user from the list
    expect(result.current.groupFive).toEqual([
      User.fromJS({
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        group: 'five',
      }),
    ]);

    // should also update the removed entity with the body data
    expect(result.current.user2?.group).toEqual('newgroup');

    () =>
      controller.fetch(
        UserResource.getList.remove,
        // @ts-expect-error
        { id: 'five' },
        { id: 1 },
      );
    // @ts-expect-error
    () => controller.fetch(UserResource.getList.remove, { username: 'never' });
    // @ts-expect-error
    () => controller.fetch(UserResource.getList.remove, 1, 'hi');
    () =>
      controller.fetch(
        UserResource.getList.remove,
        { group: 'five' },
        // @ts-expect-error
        { sdf: 'never' },
      );
    () =>
      controller.fetch(
        UserResource.getList.remove,
        // @ts-expect-error
        { sdf: 'five' },
        { id: 1 },
      );
  });

  it('UserResource.getList.move should work', async () => {
    mynock.patch(`/groups/five/users/2`).reply(200, (uri, body: any) => ({
      id: 2,
      username: 'user2',
      email: 'user2@example.com',
      group: 'ten',
      ...body,
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          user2: useQuery(User, { id: 2 }),
          groupFive: useCache(UserResource.getList, { group: 'five' }),
          groupTen: useCache(UserResource.getList, { group: 'ten' }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: UserResource.getList,
            args: [{ group: 'five' }],
            response: [
              {
                id: 1,
                username: 'user1',
                email: 'user1@example.com',
                group: 'five',
              },
              {
                id: 2,
                username: 'user2',
                email: 'user2@example.com',
                group: 'five',
              },
            ],
          },
          {
            endpoint: UserResource.getList,
            args: [{ group: 'ten' }],
            response: [
              {
                id: 3,
                username: 'user3',
                email: 'user3@example.com',
                group: 'ten',
              },
            ],
          },
        ],
      },
    );

    expect(result.current.groupFive).toHaveLength(2);
    expect(result.current.groupTen).toHaveLength(1);

    // PATCH /groups/five/users/2 - moves user 2 from 'five' to 'ten'
    await act(async () => {
      const response = await controller.fetch(
        UserResource.getList.move,
        { group: 'five', id: '2' },
        {
          id: 2,
          group: 'ten',
        },
      );
      expect(response.id).toEqual(2);
    });

    // user should be removed from group 'five'
    expect(result.current.groupFive).toHaveLength(1);
    expect(result.current.groupFive?.[0]?.username).toBe('user1');

    // user should be added to group 'ten'
    expect(result.current.groupTen).toHaveLength(2);
    expect(result.current.groupTen?.map((u: any) => u.username)).toEqual(
      expect.arrayContaining(['user3', 'user2']),
    );

    // entity should be updated
    expect(result.current.user2?.group).toEqual('ten');

    // move uses full path params (group + id), no searchParams
    () =>
      controller.fetch(
        UserResource.getList.move,
        { group: 'five', id: 2 },
        { id: 1, group: 'ten' },
      );
    () =>
      controller.fetch(
        UserResource.getList.move,
        // @ts-expect-error - missing required group
        { id: 2 },
        { id: 1 },
      );
    // @ts-expect-error
    () => controller.fetch(UserResource.getList.move, { username: 'never' });
    // @ts-expect-error
    () => controller.fetch(UserResource.getList.move, 1, 'hi');
    () =>
      controller.fetch(
        UserResource.getList.move,
        { group: 'five', id: 2 },
        // @ts-expect-error
        { sdf: 'never' },
      );
    () =>
      controller.fetch(
        UserResource.getList.move,
        // @ts-expect-error
        { sdf: 'five', id: 2 },
        { id: 1 },
      );
  });

  it('getList.move should work when entity lacks path param field', async () => {
    // Entity has 'status' but NOT 'team' - team is only a URL path param
    // Collection keys include both team (from path) and status (from searchParams)
    class Task extends Entity {
      readonly id: number | undefined = undefined;
      readonly title: string = '';
      readonly status: string = 'backlog';

      pk() {
        return this.id?.toString();
      }
    }

    const TeamTaskResource = resource({
      path: 'http\\://test.com/teams/:team/tasks/:id',
      searchParams: {} as { status: string },
      schema: Task,
    });

    mynock.patch(`/teams/alpha/tasks/3`).reply(200, (uri, body: any) => ({
      id: 3,
      title: 'My Task',
      status: 'in-progress',
      ...body,
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          task3: useQuery(Task, { id: 3 }),
          backlog: useCache(TeamTaskResource.getList, {
            team: 'alpha',
            status: 'backlog',
          }),
          inProgress: useCache(TeamTaskResource.getList, {
            team: 'alpha',
            status: 'in-progress',
          }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: TeamTaskResource.getList,
            args: [{ team: 'alpha', status: 'backlog' }],
            response: [
              { id: 1, title: 'Task 1', status: 'backlog' },
              { id: 3, title: 'My Task', status: 'backlog' },
            ],
          },
          {
            endpoint: TeamTaskResource.getList,
            args: [{ team: 'alpha', status: 'in-progress' }],
            response: [{ id: 2, title: 'Task 2', status: 'in-progress' }],
          },
        ],
      },
    );

    expect(result.current.backlog).toHaveLength(2);
    expect(result.current.inProgress).toHaveLength(1);

    // PATCH /teams/alpha/tasks/3 - move task 3 from backlog to in-progress
    // 'team' is only in URL params (not on entity); 'status' is in body and on entity
    await act(async () => {
      const response = await controller.fetch(
        TeamTaskResource.getList.move,
        { team: 'alpha', id: '3' },
        { id: 3, status: 'in-progress' },
      );
      expect(response.id).toEqual(3);
    });

    // task should be removed from backlog
    expect(result.current.backlog).toHaveLength(1);
    expect(result.current.backlog?.[0]?.title).toBe('Task 1');

    // task should be added to in-progress
    expect(result.current.inProgress).toHaveLength(2);
    expect(result.current.inProgress?.map((t: any) => t.title)).toEqual(
      expect.arrayContaining(['Task 2', 'My Task']),
    );

    // entity should be updated
    expect(result.current.task3?.status).toEqual('in-progress');
  });

  it('getList.move should work with searchParams-based collections', async () => {
    class Task extends Entity {
      readonly id: number | undefined = undefined;
      readonly title: string = '';
      readonly status: string = 'backlog';

      pk() {
        return this.id?.toString();
      }
    }

    const TaskResource = resource({
      path: 'http\\://test.com/tasks/:id',
      searchParams: {} as { status: string },
      schema: Task,
    });

    mynock.patch(`/tasks/3`).reply(200, (uri, body: any) => ({
      id: 3,
      title: 'My Task',
      status: 'in-progress',
      ...body,
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          task3: useQuery(Task, { id: 3 }),
          backlog: useCache(TaskResource.getList, { status: 'backlog' }),
          inProgress: useCache(TaskResource.getList, {
            status: 'in-progress',
          }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: TaskResource.getList,
            args: [{ status: 'backlog' }],
            response: [
              { id: 1, title: 'Task 1', status: 'backlog' },
              { id: 3, title: 'My Task', status: 'backlog' },
            ],
          },
          {
            endpoint: TaskResource.getList,
            args: [{ status: 'in-progress' }],
            response: [{ id: 2, title: 'Task 2', status: 'in-progress' }],
          },
        ],
      },
    );

    expect(result.current.backlog).toHaveLength(2);
    expect(result.current.inProgress).toHaveLength(1);

    // PATCH /tasks/3 - moves task 3 from 'backlog' to 'in-progress'
    await act(async () => {
      const response = await controller.fetch(
        TaskResource.getList.move,
        { id: '3' },
        { id: 3, status: 'in-progress' },
      );
      expect(response.id).toEqual(3);
    });

    // task should be removed from backlog
    expect(result.current.backlog).toHaveLength(1);
    expect(result.current.backlog?.[0]?.title).toBe('Task 1');

    // task should be added to in-progress
    expect(result.current.inProgress).toHaveLength(2);
    expect(result.current.inProgress?.map((t: any) => t.title)).toEqual(
      expect.arrayContaining(['Task 2', 'My Task']),
    );

    // entity should be updated
    expect(result.current.task3?.status).toEqual('in-progress');
  });

  it('getList.move should work with FormData body', async () => {
    class Task extends Entity {
      readonly id: number | undefined = undefined;
      readonly title: string = '';
      readonly status: string = 'backlog';

      pk() {
        return this.id?.toString();
      }
    }

    const TaskResource = resource({
      path: 'http\\://test.com/tasks/:id',
      searchParams: {} as { status: string },
      schema: Task,
    });

    mynock.patch(`/tasks/3`).reply(200, (uri, body: any) => ({
      id: 3,
      title: 'My Task',
      status: 'in-progress',
      ...(body instanceof FormData ? Object.fromEntries(body.entries()) : body),
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          task3: useQuery(Task, { id: 3 }),
          backlog: useCache(TaskResource.getList, { status: 'backlog' }),
          inProgress: useCache(TaskResource.getList, {
            status: 'in-progress',
          }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: TaskResource.getList,
            args: [{ status: 'backlog' }],
            response: [
              { id: 1, title: 'Task 1', status: 'backlog' },
              { id: 3, title: 'My Task', status: 'backlog' },
            ],
          },
          {
            endpoint: TaskResource.getList,
            args: [{ status: 'in-progress' }],
            response: [{ id: 2, title: 'Task 2', status: 'in-progress' }],
          },
        ],
      },
    );

    expect(result.current.backlog).toHaveLength(2);
    expect(result.current.inProgress).toHaveLength(1);

    // Use FormData as the body (simulates multipart form submission)
    const formData = new FormData();
    formData.append('id', '3');
    formData.append('status', 'in-progress');

    await act(async () => {
      const response = await controller.fetch(
        TaskResource.getList.move,
        { id: '3' },
        formData,
      );
      expect(response.id).toEqual(3);
    });

    // task should be removed from backlog
    expect(result.current.backlog).toHaveLength(1);
    expect(result.current.backlog?.[0]?.title).toBe('Task 1');

    // task should be added to in-progress
    expect(result.current.inProgress).toHaveLength(2);
    expect(result.current.inProgress?.map((t: any) => t.title)).toEqual(
      expect.arrayContaining(['Task 2', 'My Task']),
    );

    // entity should be updated
    expect(result.current.task3?.status).toEqual('in-progress');
  });

  it('getList.move should work optimistically with path-based collections', async () => {
    const OptUserResource = resource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
      optimistic: true,
    });

    mynock.patch(`/groups/five/users/2`).reply(200, () => ({
      id: 2,
      username: 'user2',
      email: 'user2@example.com',
      group: 'ten',
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          user2: useQuery(User, { id: 2 }),
          groupFive: useCache(OptUserResource.getList, { group: 'five' }),
          groupTen: useCache(OptUserResource.getList, { group: 'ten' }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: OptUserResource.getList,
            args: [{ group: 'five' }],
            response: [
              {
                id: 1,
                username: 'user1',
                email: 'user1@example.com',
                group: 'five',
              },
              {
                id: 2,
                username: 'user2',
                email: 'user2@example.com',
                group: 'five',
              },
            ],
          },
          {
            endpoint: OptUserResource.getList,
            args: [{ group: 'ten' }],
            response: [
              {
                id: 3,
                username: 'user3',
                email: 'user3@example.com',
                group: 'ten',
              },
            ],
          },
        ],
      },
    );

    expect(OptUserResource.getList.move.getOptimisticResponse).toBeDefined();
    expect(result.current.groupFive).toHaveLength(2);
    expect(result.current.groupTen).toHaveLength(1);

    let promise: any;
    act(() => {
      promise = controller.fetch(
        OptUserResource.getList.move,
        { group: 'five', id: '2' },
        { id: 2, group: 'ten' },
      );
    });

    // optimistic: should update immediately before network responds
    expect(result.current.groupFive).toHaveLength(1);
    expect(result.current.groupFive?.[0]?.username).toBe('user1');
    expect(result.current.groupTen).toHaveLength(2);
    expect(result.current.groupTen?.map((u: any) => u.username)).toEqual(
      expect.arrayContaining(['user3', 'user2']),
    );
    expect(result.current.user2?.group).toEqual('ten');

    // after server response, should still be correct
    await act(() => promise);
    expect(result.current.groupFive).toHaveLength(1);
    expect(result.current.groupTen).toHaveLength(2);
    expect(result.current.user2?.group).toEqual('ten');
  });

  it('getList.move should work optimistically with searchParams-based collections', async () => {
    class Task extends Entity {
      readonly id: number | undefined = undefined;
      readonly title: string = '';
      readonly status: string = 'backlog';

      pk() {
        return this.id?.toString();
      }
    }

    const TaskResource = resource({
      path: 'http\\://test.com/tasks/:id',
      searchParams: {} as { status: string },
      schema: Task,
      optimistic: true,
    });

    mynock.patch(`/tasks/3`).reply(200, () => ({
      id: 3,
      title: 'My Task',
      status: 'in-progress',
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          task3: useQuery(Task, { id: 3 }),
          backlog: useCache(TaskResource.getList, { status: 'backlog' }),
          inProgress: useCache(TaskResource.getList, {
            status: 'in-progress',
          }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: TaskResource.getList,
            args: [{ status: 'backlog' }],
            response: [
              { id: 1, title: 'Task 1', status: 'backlog' },
              { id: 3, title: 'My Task', status: 'backlog' },
            ],
          },
          {
            endpoint: TaskResource.getList,
            args: [{ status: 'in-progress' }],
            response: [{ id: 2, title: 'Task 2', status: 'in-progress' }],
          },
        ],
      },
    );

    expect(TaskResource.getList.move.getOptimisticResponse).toBeDefined();
    expect(result.current.backlog).toHaveLength(2);
    expect(result.current.inProgress).toHaveLength(1);

    let promise: any;
    act(() => {
      promise = controller.fetch(
        TaskResource.getList.move,
        { id: '3' },
        { id: 3, status: 'in-progress' },
      );
    });

    // optimistic: should update immediately before network responds
    expect(result.current.backlog).toHaveLength(1);
    expect(result.current.backlog?.[0]?.title).toBe('Task 1');
    expect(result.current.inProgress).toHaveLength(2);
    expect(result.current.inProgress?.map((t: any) => t.title)).toEqual(
      expect.arrayContaining(['Task 2', 'My Task']),
    );
    expect(result.current.task3?.status).toEqual('in-progress');

    // after server response, should still be correct
    await act(() => promise);
    expect(result.current.backlog).toHaveLength(1);
    expect(result.current.inProgress).toHaveLength(2);
    expect(result.current.task3?.status).toEqual('in-progress');
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
    const FeedUnion = new Union({ post: FeedPost, link: FeedLink }, 'type');
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
        useQuery(FeedUnion, { id: '5', type: 'bob' });
        // these are the 'fallback case' where it cannot determine type discriminator, so just enumerates
        useQuery(FeedUnion, { id: '5' });
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

    it('delete endpoint should wrap Union schema with Invalidate', () => {
      // Verify the delete schema is an Invalidate instance that hoisted the Union
      const deleteSchema = FeedResource.delete.schema;
      expect(deleteSchema).toBeInstanceOf(schema.Invalidate);

      // Verify it properly hoisted the Union's inner schemas (not single schema anymore)
      expect((deleteSchema as any).isSingleSchema).toBe(false);

      // Verify it has the Union's entities
      expect((deleteSchema as any).schema).toEqual({
        post: FeedPost,
        link: FeedLink,
      });
    });

    it('delete should invalidate Union entity from cache', async () => {
      mynock
        .get(`/feed/${feedPayload.id}`)
        .reply(200, feedPayload)
        .delete(`/feed/${feedPayload.id}`)
        .reply(200, feedPayload);

      const throws: Promise<any>[] = [];
      const { result, waitForNextUpdate, waitFor, controller } =
        renderDataClient(() => {
          try {
            return useSuspense(FeedResource.get, { id: feedPayload.id });
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
      let data = result.current;
      expect(data).toBeInstanceOf(FeedLink);
      expect(data.title).toBe(feedPayload.title);
      // react 19 suspends twice
      expect(throws.length).toBeGreaterThanOrEqual(1);

      mynock
        .persist()
        .get(`/feed/${feedPayload.id}`)
        .reply(200, { ...feedPayload, title: 'refetched' });

      await act(async () => {
        await controller.fetch(FeedResource.delete, { id: feedPayload.id });
      });
      // Should have suspended after delete (entity invalidated)
      expect(throws.length).toBeGreaterThanOrEqual(2);
      await Promise.race([
        waitFor(() => expect(data.title).toBe('refetched')),
        throws[throws.length - 1],
      ]);
      data = result.current;
      expect(data).toBeInstanceOf(FeedLink);
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

    const queryRemainingTodos = new Query(
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
