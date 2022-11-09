import nock from 'nock';
import { useController } from '@rest-hooks/core';
import { act } from '@testing-library/react-hooks';
import { Entity } from '@rest-hooks/endpoint';
import { useSuspense } from '@rest-hooks/core';
import { CoolerArticle, CoolerArticleResource } from '__tests__/new';

import RestEndpoint, {
  Defaults,
  RestEndpointConstructorOptions,
  RestGenerics,
} from '../RestEndpoint';
import { makeRenderRestHook, makeCacheProvider } from '../../../test';
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
  path: 'http\\://test.com/user/:id',
  name: 'User.get',
  schema: User,
  method: 'GET',
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
  path: 'http\\://test.com/article-paginated',
  name: 'get',
  schema: {
    nextPage: '',
    data: { results: [PaginatedArticle] },
  },
  method: 'GET',
});
const getNextPage = getArticleList.paginated(
  (v: { cursor: string | number }) => [],
);

const getArticleList2 = new RestEndpoint({
  urlPrefix: 'http://test.com/article-paginated/',
  path: ':group',
  name: 'get',
  schema: {
    nextPage: '',
    data: { results: [PaginatedArticle] },
  },
  method: 'GET',
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
      path: 'http\\://test.com/user/:id',
      name: 'update',
      schema: User,
      method: 'POST',
    });
    expect(updateUser.sideEffect).toBe(true);
    // @ts-expect-error
    const y: undefined = updateUser.sideEffect;
  });

  /* TODO: it('should allow sideEffect overrides', () => {
    const weirdGetUser = new RestEndpoint({
      path: 'http\\://test.com/user/:id',
      name: 'getter',
      schema: User,
      method: 'POST',
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
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
      method: 'GET',
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
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList);
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
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList2, {
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
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList);
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
      path: '/complex-thing/:id',
      schema: ComplexEntity,
      method: 'GET',
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
      method: 'PUT',
      path: 'http\\://test.com/user/:id',
      name: 'get',
      schema: User,
      getRequestInit(body): RequestInit {
        if (body && isPojo(body)) {
          return RestEndpoint.prototype.getRequestInit.call(this, {
            ...body,
            email: 'always@always.com',
          });
        }
        return RestEndpoint.prototype.getRequestInit.call(this, body);
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
      constructor(options: Readonly<RestEndpointConstructorOptions<O> & O>) {
        super({ schema: DefaultUser, ...options } as any);
      }

      parseResponse(response: Response): Promise<any> {
        return super.parseResponse(response);
      }

      getRequestInit(body: any): RequestInit {
        if (isPojo(body)) {
          return super.getRequestInit({ ...body, email: 'always@always.com' });
        }
        return super.getRequestInit(body);
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
        method: 'PUT',
        path: 'http\\://test.com/user/:id',
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
        method: 'PUT',
        path: 'http\\://test.com/user/:id',
        name: 'update',
        schema: User,
      }).extend({
        body: 5,
        path: 'http\\://test.com/charmer/:charm',
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
        path: 'http\\://test.com/user/:charm',
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
        path: 'http\\://test.com/user/:id',
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
        constructor(options: Readonly<O & { name: string }>) {
          super(options as any);
        }

        readonly path = 'http\\://test.com/user/:id';
      }

      const getUser = new UserEndpoint({
        method: 'GET',
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
        method: 'PUT',
        path: 'http\\://test.com/user/:id',
        name: 'update',
        schema: User,
      }).extend({
        path: 'http\\://test.com/:group/user/:id',
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
        path: 'http\\://test.com/user/:id',
        name: 'getuser',
        schema: User,
      });
      const getUser = getUserBase.extend({
        path: 'http\\://test.com/:group/user/:id',
        schema: User2,
      });
      expect(getUserBase.name).toBe('getuser');
      expect(getUser.name).toBe('getuser');
      expect(getUser.additional).toBe(5);
      expect(getUser.method).toBe('GET');
      const user = await getUser({ group: '6', id: 5 });
      expect(user.username2).toBe('charles');
      () => {
        const a = useSuspense(getUser, { group: '6', id: 5 });
        // @ts-expect-error
        a.username;
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(user.username).toBeUndefined();
      expect(user).toMatchInlineSnapshot(`
        {
          "id": 5,
          "username2": "charles",
        }
      `);

      const newBody = getUser.extend({
        body: {} as { title: string },
      });
      () => newBody({ group: 'hi', id: 'what' }, { title: 'cool' });
      // @ts-expect-error
      () => newBody({ id: 'what' }, { title: 'cool' });
      // @ts-expect-error
      () => newBody({ title: 'cool' });
      // @ts-expect-error
      () => newBody({ group: 'hi', id: 'what' });
      // @ts-expect-error
      () => newBody({ group: 'hi', id: 'what' }, { sdfsd: 'cool' });

      const bodyNoParams = newBody
        .extend({
          path: '/',
        })
        .extend({ body: {} as { happy: string } });
      () => bodyNoParams({ happy: 'cool' });
      // @ts-expect-error
      () => bodyNoParams({ group: 'hi', id: 'what' }, { happy: 'cool' });
      // @ts-expect-error
      () => bodyNoParams({ group: 'hi', id: 'what' }, { title: 'cool' });
      // @ts-expect-error
      () => bodyNoParams({ sdfd: 'cool' });

      const searchParams = getUser.extend({
        path: 'http\\://test.com/:group/user/:id',
        searchParams: {} as { isAdmin?: boolean; sort: 'asc' | 'desc' },
      });
      () => searchParams({ group: 'hi', id: 'what', sort: 'asc' });
      () =>
        searchParams({ group: 'hi', id: 'what', sort: 'asc', isAdmin: true });
      // @ts-expect-error
      () => searchParams({ group: 'hi', id: 'what', sort: 'abc' });
      // @ts-expect-error
      () => searchParams({ group: 'hi', id: 'what' });
      // @ts-expect-error
      () => searchParams.url({ group: 'hi', id: 'what' });
      expect(
        searchParams.url({
          group: 'hi',
          id: 'what',
          sort: 'desc',
          isAdmin: true,
        }),
      ).toMatchInlineSnapshot(
        `"http://test.com/hi/user/what?isAdmin=true&sort=desc"`,
      );
    });
  });
  it('extending with name should work', () => {
    const endpoint = CoolerArticleResource.get.extend({ name: 'mything' });
    expect(endpoint.name).toBe('mything');
  });
  it('should infer default method when sideEffect is set', async () => {
    const endpoint = new RestEndpoint({
      sideEffect: true,
      path: 'http\\://test.com/article-cooler',
      body: 0 as any,
      schema: CoolerArticle,
    }).extend({ name: 'createarticle' });
    expect(endpoint.method).toBe('POST');
    const article = await endpoint(payload);
    expect(article).toMatchInlineSnapshot(`
      {
        "content": "whatever",
        "id": 1,
        "tags": [
          "a",
          "best",
          "react",
        ],
        "title": "hi ho",
      }
    `);
  });

  describe('process() return type setting', () => {
    const getArticle = new RestEndpoint({
      path: 'http\\://test.com/article-cooler/:id',
      process(value): CoolerArticle {
        return value;
      },
    });

    it('should work with constructors', async () => {
      const article = await getArticle({ id: '5' });
      article.author;
      // @ts-expect-error
      article.asdf;
      () => useSuspense(getArticle, { id: '5' }).content;
      // @ts-expect-error
      () => useSuspense(getArticle, { id: '5' }).asdf;
    });

    it('should set on .extend()', async () => {
      const getExtends = new RestEndpoint({
        path: 'http\\://test.com/article-cooler/:id',
      }).extend({
        process(value: any): CoolerArticle {
          return value;
        },
      });
      const ex = await getExtends({ id: '5' });
      ex.author;
      // @ts-expect-error
      ex.asdf;
      () => useSuspense(getExtends, { id: '5' }).content;
      // @ts-expect-error
      () => useSuspense(getExtends, { id: '5' }).asdf;
    });

    it('should override existing type on .extend()', async () => {
      const getOverride = getArticle.extend({
        process(value: any, param: any): { asdf: string } {
          return value;
        },
      });
      const ov = await getOverride({ id: '5' });
      ov.asdf;
      // @ts-expect-error
      ov.author;
      () => useSuspense(getOverride, { id: '5' }).asdf;
      // @ts-expect-error
      () => useSuspense(getOverride, { id: '5' }).content;
    });

    it('should maintain existing type on .extend() when not specified', async () => {
      const getOverride = getArticle.extend({
        dataExpiryLength: 7,
      });
      const ov = await getOverride({ id: '5' });
      ov.author;
      // @ts-expect-error
      ov.asdf;
    });

    it('should maintain existing type on .extend() when process is not supplied but path is', async () => {
      const getOverride = getArticle.extend({
        path: '/:a/:b',
      });
      async () => {
        const ov = await getOverride({ a: '5', b: '7' });
        ov.author;
        // @ts-expect-error
        ov.asdf;
      };
    });

    it('should override existing type on .extend() when path is also supplied', async () => {
      const getOverride = getArticle.extend({
        path: '/:a/:b',
        process(value: any, param: any): { asdf: string } {
          return value;
        },
      });
      async () => {
        const ov = await getOverride({ a: '5', b: '7' });
        ov.asdf;
        // @ts-expect-error
        ov.author;
      };
      () => useSuspense(getOverride, { a: '5', b: '7' }).asdf;
      // @ts-expect-error
      () => useSuspense(getOverride, { a: '5', b: '7' }).content;
    });
  });

  it('extend options should match function of path set', () => {
    const endpoint = new RestEndpoint({
      sideEffect: true,
      path: 'http\\://test.com/article-cooler/:id',
      body: 0 as any,
      schema: CoolerArticle,
      getOptimisticResponse(snap, params, body) {
        params.id;
        // @ts-expect-error
        params.two;

        body.hi;
      },
    }).extend({
      path: '/:group/next/:two',
      body: undefined,
      getOptimisticResponse(snap, params) {
        params.two;
        params.group;
        // @ts-expect-error
        params.id;
      },
    });
  });
});

describe('RestEndpoint.fetch()', () => {
  const id = 5;
  const idHtml = 6;
  const idNoContent = 7;
  const payload = {
    id,
    title: 'happy',
    author: User.fromJS({ id: 5 }),
  };
  const putResponseBody = {
    id,
    title: 'happy',
    completed: true,
  };
  const patchPayload = {
    title: 'happy',
  };
  const patchResponseBody = {
    id,
    title: 'happy',
    completed: false,
  };

  beforeEach(() => {
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-cooler/${idHtml}`)
      .reply(200, '<body>this is html</body>')
      .get(`/article-cooler/${idNoContent}`)
      .reply(204, '')
      .post('/article-cooler')
      .reply((uri, requestBody) => [
        201,
        requestBody,
        { 'content-type': 'application/json' },
      ])
      .put('/article-cooler/5')
      .reply((uri, requestBody) => {
        let body = requestBody as any;
        if (typeof requestBody === 'string') {
          body = JSON.parse(requestBody);
        }
        for (const key of Object.keys(CoolerArticle.fromJS({}))) {
          if (key !== 'id' && !(key in body)) {
            return [400, {}, { 'content-type': 'application/json' }];
          }
        }
        return [200, putResponseBody, { 'content-type': 'application/json' }];
      })
      .patch('/article-cooler/5')
      .reply(() => [
        200,
        patchResponseBody,
        { 'content-type': 'application/json' },
      ])
      .intercept('/article-cooler/5', 'DELETE')
      .reply(200, {});
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should GET', async () => {
    const article = await CoolerArticleResource.get({
      id: payload.id,
    });
    expect(article).toBeDefined();
    if (!article) {
      throw new Error('ahh');
    }
    expect(article.title).toBe(payload.title);
  });

  it('should POST', async () => {
    const payload2 = { id: 20, content: 'better task' };
    const article = await CoolerArticleResource.create(payload2);
    expect(article).toMatchObject(payload2);
  });

  it('should PUT with multipart form data', async () => {
    const payload2 = { id: 500, content: 'another' };
    let lastRequest: any;
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
      })
      .put('/article-cooler/500')
      .reply(function (uri, requestBody) {
        lastRequest = this.req;
        return [201, payload2, { 'Content-Type': 'application/json' }];
      });
    const newPhoto = new Blob();
    const body = new FormData();
    body.append('photo', newPhoto);

    const article = await CoolerArticleResource.update.extend({
      path: CoolerArticleResource.update.path,
      body: new FormData(),
    })({ id: '500' }, body);
    expect(lastRequest.headers['content-type']).toContain(
      'multipart/form-data',
    );
    expect(article).toMatchObject(payload2);
  });

  it('should DELETE', async () => {
    const res = await CoolerArticleResource.delete({
      id: payload.id,
    });
    expect(res).toEqual({ id });
  });

  it('should PUT', async () => {
    const response = await CoolerArticleResource.update(
      { id: payload.id },
      { ...CoolerArticle.fromJS(payload) },
    );
    expect(response).toEqual(putResponseBody);
  });

  it('should PATCH', async () => {
    const response = await CoolerArticleResource.partialUpdate(
      { id },
      patchPayload,
    );
    expect(response).toEqual(patchResponseBody);
  });

  it('should throw if response is not json', async () => {
    let error: any;
    try {
      await CoolerArticleResource.get({ id: idHtml });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    // This is very weird, but we're forced to use node-fetch for react native
    // node-fetch doesn't handle errors consistently with normal fetch implementations, so this won't work
    // react-native itself should match this correctly however.
    if (typeof window !== 'undefined') expect(error.status).toBe(400);
  });

  it('should throw if network is down', async () => {
    const oldError = console.error;
    console.error = () => {};

    const id = 10;
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/${id}`)
      .replyWithError(new TypeError('Network Down'));

    let error: any;
    try {
      await CoolerArticleResource.get({ id });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.status).toBe(400);

    // eslint-disable-next-line require-atomic-updates
    console.error = oldError;
  });

  it('should return raw response if status is 204 No Content', async () => {
    const res = await CoolerArticleResource.get({ id: idNoContent });
    expect(res).toBe('');
  });

  it('should return text if content-type is not json', async () => {
    const id = 8;
    const text = '<body>this is html</body>';
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, text, { 'content-type': 'html/text' });

    const res = await CoolerArticleResource.get({ id });
    expect(res).toBe('<body>this is html</body>');
  });

  it('should return text if content-type does not exist', async () => {
    const id = 10;
    const text = '<body>this is html</body>';
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, text, {});

    const res = await CoolerArticleResource.get({ id });
    expect(res).toBe(text);
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
