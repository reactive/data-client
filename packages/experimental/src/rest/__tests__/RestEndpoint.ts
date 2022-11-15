import { Entity } from '@rest-hooks/endpoint';
import { useController, useSuspense } from '@rest-hooks/react';
import makeCacheProvider from '@rest-hooks/react/makeCacheProvider';
import { act } from '@testing-library/react-hooks';
import nock from 'nock';

import { makeRenderRestHook } from '../../../../test';
import RestEndpoint, {
  Defaults,
  RestEndpointConstructorOptions,
  RestGenerics,
} from '../RestEndpoint';
import {
  payload,
  createPayload,
  users,
  nested,
  moreNested,
  paginatedFirstPage,
  paginatedSecondPage,
} from '../test-fixtures';

export class User extends Entity {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id?.toString();
  }
}
const getUser = new RestEndpoint({
  path: 'http\\://test.com/user/:id' as const,
  name: 'User.get',
  schema: User,
  method: 'GET' as const,
});
export class PaginatedArticle extends Entity {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: User,
  };
}
const getArticleList = new RestEndpoint({
  path: 'http\\://test.com/article-paginated' as const,
  name: 'get',
  schema: {
    nextPage: '',
    results: [PaginatedArticle],
  },
  method: 'GET' as const,
});
const getNextPage = getArticleList.paginated(
  (v: { cursor: string | number }) => [],
);

const getArticleList2 = new RestEndpoint({
  path: 'http\\://test.com/article-paginated/:group' as const,
  name: 'get',
  schema: {
    nextPage: '',
    results: [PaginatedArticle],
  },
  method: 'GET' as const,
});
const getNextPage2 = getArticleList2.paginated(
  ({
    cursor,
    ...rest
  }: {
    cursor: string | number;
    group: string | number;
  }) => [rest],
);

describe('RestEndpoint', () => {
  const renderRestHook: ReturnType<typeof makeRenderRestHook> =
    makeRenderRestHook(makeCacheProvider);
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
      .get(`/article-cooler/0`)
      .reply(403, {})
      .get(`/article-cooler/666`)
      .reply(200, '')
      .get(`/article-cooler`)
      .reply(200, nested)
      .post(`/article-cooler`)
      .reply(200, createPayload)
      .get(`/user`)
      .reply(200, users);
    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should assign members', () => {
    expect(getUser.path).toBe('http\\://test.com/user/:id');
    expect(getUser.sideEffect).toBe(undefined);
    expect(getUser.method).toBe('GET');

    // @ts-expect-error
    () => getUser.notassigned;
    // @ts-expect-error
    const a: true = getUser.sideEffect;
    // @ts-expect-error
    const b: 'POST' = getUser.method;
    // @ts-expect-error
    ((m: 'POST') => {})(getUser.method);

    const updateUser = new RestEndpoint({
      path: 'http\\://test.com/user/:id' as const,
      name: 'update',
      schema: User,
      method: 'POST' as const,
    });
    expect(updateUser.sideEffect).toBe(true);
    // @ts-expect-error
    const y: undefined = updateUser.sideEffect;
  });

  /* TODO: it('should allow sideEffect overrides', () => {
    const weirdGetUser = new RestEndpoint({
      path: 'http\\://test.com/user/:id' as const,
      name: 'getter',
      schema: User,
      method: 'POST' as const,
      sideEffect: undefined,
    });

    expect(weirdGetUser.sideEffect).toBe(undefined);
    //s @ts-expect-error
    //const y: true = weirdGetUser.sideEffect;
  });*/

  it('should handle simple urls', () => {
    expect(getUser.url({ id: '5' })).toBe('http://test.com/user/5');
    expect(getUser.url({ id: '100' })).toBe('http://test.com/user/100');

    // @ts-expect-error
    () => getUser.url({ sdf: '5' });
  });

  it('should handle multiarg urls', () => {
    const getMyUser = new RestEndpoint({
      path: 'http\\://test.com/groups/:group/users/:id' as const,
      schema: User,
      method: 'GET' as const,
      extra: 5,
    });

    expect(getMyUser.url({ group: 'big', id: '5' })).toBe(
      'http://test.com/groups/big/users/5',
    );
    expect(getMyUser.url({ group: 'big', id: '100' })).toBe(
      'http://test.com/groups/big/users/100',
    );

    // missing required
    expect(() =>
      // @ts-expect-error
      getMyUser.url({ id: '5' }),
    ).toThrow();
    // extra fields
    () =>
      getMyUser.url({
        group: 'mygroup',
        id: '5',
        // @ts-expect-error
        notexisting: 'hi',
      });

    // @ts-expect-error
    () => useSuspense(getMyUser, { id: '5' });
    // @ts-expect-error
    () => useSuspense(getMyUser);
    () => useSuspense(getMyUser, { group: 'yay', id: '5' });
  });

  it('should automatically name methods', () => {
    expect(getUser.name).toBe('User.get');
  });

  it('should update on get for a paginated resource', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { fetch } = useController();
      const { results: articles, nextPage } = useSuspense(getArticleList);
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    // @ts-expect-error
    () => result.current.fetch(getNextPage);
    // @ts-expect-error
    () => result.current.fetch(getNextPage, { fake: 5 });
    await act(async () => {
      await result.current.fetch(getNextPage, {
        cursor: 2,
      });
    });
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
  });

  it('should update on get for a paginated resource with parameter in path', async () => {
    mynock.get(`/article-paginated/happy`).reply(200, paginatedFirstPage);
    mynock
      .get(`/article-paginated/happy?cursor=2`)
      .reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { fetch } = useController();
      const { results: articles, nextPage } = useSuspense(getArticleList2, {
        group: 'happy',
      });
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    // @ts-expect-error
    () => result.current.fetch(getNextPage2);
    // @ts-expect-error
    () => result.current.fetch(getNextPage2, { fake: 5 });
    // @ts-expect-error
    () => result.current.fetch(getNextPage2, { group: 'happy' });
    // @ts-expect-error
    () => result.current.fetch(getNextPage2, { cursor: 2 });
    await act(async () => {
      await result.current.fetch(getNextPage2, {
        group: 'happy',
        cursor: 2,
      });
    });
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
  });

  it('should deduplicate results', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, {
      ...paginatedSecondPage,
      results: [nested[nested.length - 1], ...moreNested],
    });

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { fetch } = useController();
      const { results: articles, nextPage } = useSuspense(getArticleList);
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    await act(async () => {
      await result.current.fetch(getNextPage, {
        cursor: 2,
      });
    });
    //TODO: Why is this broken? expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
  });

  it('should not deep-merge deeply defined entities', async () => {
    interface Complex {
      firstvalue: number;
      secondthing: {
        arg?: number;
        other?: string;
      };
    }
    class ComplexEntity extends Entity {
      readonly id: string = '';
      readonly complexThing?: Complex = undefined;
      readonly extra: string = '';

      pk() {
        return this.id;
      }
    }
    const getComplex = new RestEndpoint({
      path: '/complex-thing/:id' as const,
      schema: ComplexEntity,
      method: 'GET' as const,
    });

    const firstResponse = {
      id: '5',
      complexThing: {
        firstvalue: 233,
        secondthing: { arg: 88 },
      },
      extra: 'hi',
    };
    mynock.get(`/complex-thing/5`).reply(200, firstResponse);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { fetch } = useController();
      const article = useSuspense(getComplex, { id: '5' });
      return { article, fetch };
    });
    await waitForNextUpdate();
    expect(result.current.article).toEqual(firstResponse);

    const secondResponse = {
      id: '5',
      complexThing: {
        firstvalue: 5,
        secondthing: { other: 'hi' },
      },
    };

    mynock.get(`/complex-thing/5`).reply(200, secondResponse);
    await act(async () => {
      await result.current.fetch(getComplex, {
        id: '5',
      });
    });
    expect(result.current.article).toEqual({ ...secondResponse, extra: 'hi' });
  });

  it('overriding methods should work', async () => {
    mynock.put(`/user/5`).reply(200, (uri, body: any) => ({
      id: 5,
      username: 'bob',
      ...body,
    }));
    const updateUser = new RestEndpoint({
      method: 'PUT' as const,
      path: 'http\\://test.com/user/:id' as const,
      name: 'get',
      schema: User,
      getFetchInit(body: any): RequestInit {
        if (body && isPojo(body)) {
          return RestEndpoint.prototype.getFetchInit.call(this, {
            ...body,
            email: 'always@always.com',
          });
        }
        return RestEndpoint.prototype.getFetchInit.call(this, body);
      },
    });
    const response = await updateUser(
      { id: 5 },
      { username: 'micky', email: 'micky@gmail.com' },
    );
    expect(response).toMatchInlineSnapshot(`
      {
        "email": "always@always.com",
        "id": 5,
        "username": "micky",
      }
    `);
  });

  describe('class extensions', () => {
    class DefaultUser extends User {
      defaultUserExtra = 'yay';
    }

    class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<
      Defaults<O, { schema: DefaultUser }>
    > {
      constructor(options: O & RestEndpointConstructorOptions<O>) {
        super({ schema: DefaultUser, ...options } as any);
      }

      parseResponse(response: Response): Promise<any> {
        return super.parseResponse(response);
      }

      getFetchInit(body: any): RequestInit {
        if (isPojo(body)) {
          return super.getFetchInit({ ...body, email: 'always@always.com' });
        }
        return super.getFetchInit(body);
      }

      additional = 5;
    }

    it('should work with constructor', async () => {
      mynock.put('/user/5').reply(200, (uri, body: any) => ({
        id: 5,
        username: 'bob',
        ...body,
      }));

      const updateUser = new MyEndpoint({
        method: 'PUT' as const,
        path: 'http\\://test.com/user/:id' as const,
        name: 'update',
        schema: User,
      });
      const response = await updateUser(
        { id: 5 },
        { username: 'micky', email: 'micky@gmail.com' },
      );
      expect(response).toMatchInlineSnapshot(`
        {
          "email": "always@always.com",
          "id": 5,
          "username": "micky",
        }
      `);
      expect(updateUser.additional).toBe(5);
    });

    it('setting body in extend should work', async () => {
      mynock.put('/charmer/5').reply(200, (uri, body: any) => ({
        id: 5,
        username: 'bob',
        ...body,
      }));

      const updateUser = new MyEndpoint({
        method: 'PUT' as const,
        path: 'http\\://test.com/user/:id' as const,
        name: 'update',
        schema: User,
      }).extend({
        body: 5,
        path: 'http\\://test.com/charmer/:charm' as const,
      });
      const response = await updateUser(
        { charm: 5 },
        // @ts-expect-error
        { username: 'micky', email: 'micky@gmail.com' },
      );
      () => updateUser({ charm: 5 }, 5);
      expect(response).toMatchInlineSnapshot(`
        {
          "email": "always@always.com",
          "id": 5,
          "username": "micky",
        }
      `);
      expect(updateUser.additional).toBe(5);
      const nobody = updateUser.extend({
        path: 'http\\://test.com/user/:charm' as const,
      });
      () => nobody({ charm: 5 });
      // @ts-expect-error
      () => nobody({ id: 5 });
    });

    it('should work with default schema in class definition', async () => {
      mynock.get('/user/5').reply(200, (uri, body: any) => ({
        id: 5,
        username: 'bob',
        email: 'bob@gmail.com',
      }));

      const getUser = new MyEndpoint({
        path: 'http\\://test.com/user/:id' as const,
        name: 'update',
      });
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useSuspense(getUser, { id: 5 });
      });
      await waitForNextUpdate();

      expect(result.current.username).toBe('bob');
      // @ts-expect-error
      expect(result.current.sdfsd).toBeUndefined();
      expect(result.current.defaultUserExtra).toBe('yay');
      expect(result.current.email).toBe('bob@gmail.com');
    });

    it('should work with default path in class definition', async () => {
      mynock.get('/user/5').reply(200, (uri, body: any) => ({
        id: 5,
        username: 'bob',
        email: 'bob@gmail.com',
      }));
      // this seems like a less common use case; so we're fine with it being annoying
      class UserEndpoint<
        O extends Partial<RestGenerics> = {
          schema: DefaultUser;
          path: 'http\\://test.com/user/:id';
        },
      > extends MyEndpoint<
        Defaults<O, { schema: DefaultUser; path: 'http\\://test.com/user/:id' }>
      > {
        constructor(options: O & { name: string }) {
          super(options as any);
        }

        path = 'http\\://test.com/user/:id' as const;
      }

      const getUser = new UserEndpoint({
        method: 'GET' as const,
        name: 'update',
      });
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useSuspense(getUser, { id: 5 });
      });
      await waitForNextUpdate();

      expect(result.current.username).toBe('bob');
      // @ts-expect-error
      expect(result.current.sdfsd).toBeUndefined();
      expect(result.current.defaultUserExtra).toBe('yay');
      expect(result.current.email).toBe('bob@gmail.com');

      // @ts-expect-error
      () => getUser({ group: 5 });
      // @ts-expect-error
      () => useSuspense(getUser, { group: 5 });
      // @ts-expect-error
      () => useSuspense(getUser);
    });

    it('should work with extends', async () => {
      mynock.put('/6/user/5').reply(200, (uri, body: any) => ({
        id: 5,
        username: 'charles',
        ...body,
      }));

      const updateUser = new MyEndpoint({
        method: 'PUT' as const,
        path: 'http\\://test.com/user/:id' as const,
        name: 'update',
        schema: User,
      }).extend({
        path: 'http\\://test.com/:group/user/:id' as const,
        body: 0 as Partial<User>,
      });
      expect(updateUser.additional).toBe(5);
      expect(updateUser.method).toBe('PUT');
      const response = await updateUser(
        { group: '6', id: 5 },
        { email: 'micky@gmail.com' },
      );
      expect(response).toMatchInlineSnapshot(`
        {
          "email": "always@always.com",
          "id": 5,
          "username": "charles",
        }
      `);
    });

    it('should work with extends', async () => {
      mynock.get('/6/user/5').reply(200, (uri, body: any) => ({
        id: 5,
        username2: 'charles',
        ...body,
      }));
      class User2 extends Entity {
        readonly id: number | undefined = undefined;
        readonly username2: string = '';
        readonly email: string = '';
        readonly isAdmin: boolean = false;

        pk() {
          return this.id?.toString();
        }
      }

      const getUserBase = new MyEndpoint({
        method: 'GET',
        path: 'http\\://test.com/user/:id' as const,
        name: 'getuser',
        schema: User,
      });
      const getUser = getUserBase.extend({
        path: 'http\\://test.com/:group/user/:id' as const,
        schema: User2,
      });
      expect(getUserBase.name).toBe('getuser');
      expect(getUser.name).toBe('getuser');
      expect(getUser.additional).toBe(5);
      expect(getUser.method).toBe('GET');
      const user = await getUser({ group: '6', id: 5 });
      expect(user.username2).toBe('charles');
      // @ts-expect-error
      expect(user.username).toBeUndefined();
      expect(user).toMatchInlineSnapshot(`
        {
          "id": 5,
          "username2": "charles",
        }
      `);
    });
  });
});
const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

function isPojo(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}
