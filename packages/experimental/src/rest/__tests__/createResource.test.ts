import { Entity, Schema, schema } from '@rest-hooks/endpoint';
import { useCache, useController, useSuspense } from '@rest-hooks/core';
import nock from 'nock';
import { act } from '@testing-library/react-hooks';
import { makeRenderRestHook, makeCacheProvider } from '@rest-hooks/test';

import RestEndpoint, { RestGenerics } from '../RestEndpoint';
import createResource from '../createResource';

describe('resource', () => {
  const renderRestHook: ReturnType<typeof makeRenderRestHook> =
    makeRenderRestHook(makeCacheProvider);
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

    getFetchInit(body: any): RequestInit {
      if (typeof body === 'object') {
        return super.getFetchInit({ ...body, email: 'always@always.com' });
      }
      return super.getFetchInit(body);
    }

    additional = 5;
  }

  const UserResource = createResource(
    'http\\://test.com/groups/:group/users/:id' as const,
    User,
    MyEndpoint,
  );

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

  it('UserResource.get should work', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
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
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(UserResource.getList, { group: 'five' });
    });
    await waitForNextUpdate();
    expect(result.current[0]).toEqual(User.fromJS(userPayload));
    result.current[0].isAdmin;
    //@ts-expect-error
    expect(result.current[0].notaMember).toBeUndefined();

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

    const { result, waitForNextUpdate } = renderRestHook(
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

  it('UserResource.create should work', async () => {
    mynock.post(`/groups/five/users`).reply(200, (uri, body: any) => ({
      id: 5,
      ...body,
    }));

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return [
        useCache(UserResource.get, { group: 'five', id: '5' }),
        useController(),
      ] as const;
    });
    // eslint-disable-next-line prefer-const
    let [_, controller] = result.current;
    await act(() => {
      controller.fetch(
        UserResource.create,
        { group: 'five' },
        {
          username: 'createduser',
          email: 'haha@gmail.com',
        },
      );
    });
    await waitForNextUpdate();
    const user = result.current[0];
    expect(user).toBeDefined();
    expect(user?.username).toBe('createduser');
    // our custom endpoint ensures this
    expect(user?.email).toBe('always@always.com');

    () =>
      controller.fetch(
        UserResource.create,
        // @ts-expect-error
        { id: 'five' },
        { username: 'never' },
      );
    // @ts-expect-error
    () => controller.fetch(UserResource.create, { username: 'never' });
    // @ts-expect-error
    () => controller.fetch(UserResource.create, 1, 'hi');
    () =>
      controller.fetch(
        UserResource.create,
        { group: 'five' },
        // @ts-expect-error
        { sdf: 'never' },
      );
    () =>
      controller.fetch(
        UserResource.create,
        // @ts-expect-error
        { sdf: 'five' },
        { username: 'never' },
      );
  });

  it('UserResource.delete should work', async () => {
    mynock
      .delete(`/groups/five/users/${userPayload.id}`)
      .reply(200, (uri, body: any) => ({
        id: userPayload.id,
      }));

    const { result, waitForNextUpdate } = renderRestHook(
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
    expect(result.error).toMatchInlineSnapshot(`"not found"`);

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
  });

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
        path: 'http\\://test.com/groups/:magic/users/:id' as const,
        schema: User2,
      }),
    };
    const { result, waitForNextUpdate } = renderRestHook(() => {
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
      'type' as const,
    );
    const FeedResource = createResource(
      'http\\://test.com/feed/:id' as const,
      FeedUnion,
      MyEndpoint,
    );

    it('should work with detail', async () => {
      mynock.get(`/feed/${feedPayload.id}`).reply(200, feedPayload);

      const { result, waitForNextUpdate } = renderRestHook(() => {
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

      const { result, waitForNextUpdate } = renderRestHook(() => {
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

    it('should work with create [no args]', async () => {
      mynock.post(`/feed`).reply(200, (uri, body: any) => ({
        id: 5,
        ...body,
      }));

      const { result, waitForNextUpdate } = renderRestHook(() => {
        return [
          useCache(FeedResource.get, { id: '5', type: 'link' }),
          useController(),
        ] as const;
      });
      // eslint-disable-next-line prefer-const
      let [_, controller] = result.current;
      await act(() => {
        controller.fetch(FeedResource.create, feedPayload);
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

      () =>
        controller.fetch(
          UserResource.create,
          // @ts-expect-error
          { id: 'five' },
          { username: 'never' },
        );
      // @ts-expect-error
      () => controller.fetch(UserResource.create, { username: 'never' });
      // @ts-expect-error
      () => controller.fetch(UserResource.create, 1, 'hi');
      () =>
        controller.fetch(
          UserResource.create,
          { group: 'five' },
          // @ts-expect-error
          { sdf: 'never' },
        );
      () =>
        controller.fetch(
          UserResource.create,
          // @ts-expect-error
          { sdf: 'five' },
          { username: 'never' },
        );
    });
  });
});
