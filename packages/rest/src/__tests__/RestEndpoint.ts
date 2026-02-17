import { Entity, schema, Collection } from '@data-client/endpoint';
import { useController, useCache } from '@data-client/react';
import { useSuspense } from '@data-client/react';
import { CacheProvider } from '@data-client/react';
import { CoolerArticle, CoolerArticleResource } from '__tests__/new';
import nock from 'nock';

import { makeRenderDataClient, act } from '../../../test';
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
}
const getUser = new RestEndpoint({
  path: 'http\\://test.com/user/:id',
  name: 'User.get',
  schema: User,
  method: 'GET',
  searchParams: {} as { extra?: string },
});
export class PaginatedArticle extends Entity {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  static schema = {
    author: User,
  };
}
const getArticleList = new RestEndpoint({
  urlPrefix: 'http://test.com',
  path: '/article-paginated',
  schema: {
    nextPage: '',
    data: { results: new Collection([PaginatedArticle]) },
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
    data: { results: new Collection([PaginatedArticle]) },
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

const getArticleList3 = new RestEndpoint({
  urlPrefix: 'http://test.com',
  path: '/article-paginated',
  schema: {
    nextPage: '',
    data: { results: new Collection([PaginatedArticle]) },
  },
  method: 'GET',
  searchParams: {} as { group: string | number },
  paginationField: 'cursor',
}).extend({
  dataExpiryLength: 10000,
});
const getNextPage3 = getArticleList3.getPage;

// type tests
() => {
  const base = new RestEndpoint({
    urlPrefix: 'http://test.com',
    path: '/article-paginated',
    schema: {
      nextPage: '',
      data: { results: new Collection([PaginatedArticle]) },
    },
    method: 'GET',
  });
  // @ts-expect-error
  () => base.getPage();
  () =>
    // @ts-expect-error
    base
      .extend({
        path: '',
        dataExpiryLength: 10000,
      })
      .getPage();
  const a = new RestEndpoint({
    urlPrefix: 'http://test.com',
    path: '/article-paginated',
    schema: {
      nextPage: '',
      data: { results: new Collection([PaginatedArticle]) },
    },
    method: 'GET',
    searchParams: {} as { group: string | number },
  }).extend({
    path: ':blob',
    searchParams: {} as { isAdmin?: boolean },
    method: 'GET',
    paginationField: 'cursor',
  });
  a.getPage({ cursor: 'hi', blob: 'ho' });
  // @ts-expect-error
  a.getPage({ blob: 'ho' });

  // Compare flat vs nested Collection schema type inference
  const flat = new RestEndpoint({
    urlPrefix: 'http://test.com',
    path: '/articles/:id',
    schema: new Collection([PaginatedArticle]),
    method: 'GET',
  });
  // flat Collection schema should be typed
  // @ts-expect-error - schema should not be any
  flat.move.schema satisfies number;
  // @ts-expect-error - push schema should not be any
  flat.push.schema satisfies number;

  // nested Collection schema should also be typed
  const nested = new RestEndpoint({
    urlPrefix: 'http://test.com',
    path: '/articles/:id',
    schema: {
      nextPage: '',
      data: { results: new Collection([PaginatedArticle]) },
    },
    method: 'GET',
    searchParams: {} as { group: string },
  });
  // @ts-expect-error - nested move schema should not be any
  nested.move.schema satisfies number;
  // @ts-expect-error - nested push schema should not be any
  nested.push.schema satisfies number;
};

describe('RestEndpoint', () => {
  const renderDataClient: ReturnType<typeof makeRenderDataClient> =
    makeRenderDataClient(CacheProvider);
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

  it('testKey should match keys', () => {
    expect(getArticleList.testKey(getArticleList.key())).toBeTruthy();
    expect(
      getUser.testKey(getUser.key({ id: '100', extra: '345' })),
    ).toBeTruthy();
    expect(getUser.testKey(getUser.key({ id: 'xxx?*' }))).toBeTruthy();
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

  it('only optional path means the arg is not required', () => {
    const ep = new RestEndpoint({ path: '/users/:id?/:group?' });
    const epbody = new RestEndpoint({
      path: '/users/:id?/:group?',
      body: { title: '' },
      method: 'POST',
    });
    () => ep();
    () => ep({ id: 5 });
    () => ep({ group: 5 });
    () => ep({ id: 5, group: 5 });
    () => epbody({ title: 'hi' });
    () => epbody({ id: 5 }, { title: 'hi' });
    () => epbody({ group: 5 }, { title: 'hi' });
    () => epbody({ id: 5, group: 5 }, { title: 'hi' });
    // @ts-expect-error
    () => epbody({ title: 'hi' }, { title: 'hi' });
  });

  it('should allow sideEffect overrides', () => {
    const weirdGetUser = new RestEndpoint({
      path: 'http\\://test.com/user/:id',
      name: 'getter',
      schema: User,
      method: 'POST',
      sideEffect: undefined,
    });

    expect(weirdGetUser.sideEffect).toBe(undefined);
    const a: undefined = weirdGetUser.sideEffect;
    // @ts-expect-error
    const y: true = weirdGetUser.sideEffect;
  });

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
    expect(getArticleList.name).toMatchInlineSnapshot(
      `"http://test.com/article-paginated"`,
    );
    expect(
      getArticleList.extend({ path: '/:something' }).name,
    ).toMatchInlineSnapshot(`"http://test.com/:something"`);
  });

  it('should update on get for a paginated resource', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      const { fetch } = useController();
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList);
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    // @ts-expect-error
    () => controller.fetch(getNextPage);
    // @ts-expect-error
    () => controller.fetch(getNextPage, { fake: 5 });
    expect(result.current.nextPage).toEqual(paginatedFirstPage.nextPage);
    await controller.fetch(getNextPage, {
      cursor: result.current.nextPage,
    });
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
    expect(result.current.nextPage).toBeUndefined();
  });

  it('should update on get for a paginated resource with parameter in path', async () => {
    mynock.get(`/article-paginated/happy`).reply(200, paginatedFirstPage);
    mynock
      .get(`/article-paginated/happy?cursor=2`)
      .reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList2, {
        group: 'happy',
      });
      return { articles, nextPage };
    });
    await waitForNextUpdate();
    // @ts-expect-error
    () => controller.fetch(getNextPage2);
    // @ts-expect-error
    () => controller.fetch(getNextPage2, { fake: 5 });
    // @ts-expect-error
    () => controller.fetch(getNextPage2, { group: 'happy' });
    // @ts-expect-error
    () => controller.fetch(getNextPage2, { cursor: 2 });
    await controller.fetch(getNextPage2, {
      group: 'happy',
      cursor: 2,
    });
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
  });

  it('push: should extend name of parent endpoint', () => {
    expect(getArticleList3.push.name).toMatchSnapshot();
    expect(getArticleList3.push.name).toBe(getArticleList3.unshift.name);
  });

  it('unshift: should extend name of parent endpoint', () => {
    expect(getArticleList3.unshift.name).toMatchSnapshot();
  });

  it('remove: should extend name of parent endpoint', () => {
    expect(getArticleList3.remove.name).toMatchSnapshot();
  });

  it('move: should extend name of parent endpoint', () => {
    expect(getArticleList3.move.name).toMatchSnapshot();
  });

  it('move should work with deeply nested Collection', async () => {
    class GroupedArticle extends Entity {
      readonly id: number | undefined = undefined;
      readonly title: string = '';
      readonly group: string = '';
    }

    const getGroupedArticles = new RestEndpoint({
      urlPrefix: 'http://test.com',
      path: '/grouped-articles',
      movePath: '/grouped-articles/:id',
      schema: {
        nextPage: '',
        data: { results: new Collection([GroupedArticle]) },
      },
      method: 'GET',
      searchParams: {} as { group: string },
    });

    // Verify schema is correctly extracted from nested structure
    expect(getGroupedArticles.move.schema).toBeTruthy();
    expect(getGroupedArticles.move.method).toBe('PATCH');

    // Diagnose schema type - should not be any
    // @ts-expect-error - schema should not be any
    getGroupedArticles.move.schema satisfies number;

    mynock.patch(/grouped-articles/).reply(200, (uri, body: any) => ({
      id: 2,
      title: 'Article 2',
      group: 'beta',
      ...(typeof body === 'string' ? JSON.parse(body) : body),
    }));

    const { result, controller } = renderDataClient(
      () => {
        return {
          alpha: useCache(getGroupedArticles, { group: 'alpha' }),
          beta: useCache(getGroupedArticles, { group: 'beta' }),
        };
      },
      {
        initialFixtures: [
          {
            endpoint: getGroupedArticles,
            args: [{ group: 'alpha' }],
            response: {
              nextPage: '2',
              data: {
                results: [
                  { id: 1, title: 'Article 1', group: 'alpha' },
                  { id: 2, title: 'Article 2', group: 'alpha' },
                ],
              },
            },
          },
          {
            endpoint: getGroupedArticles,
            args: [{ group: 'beta' }],
            response: {
              nextPage: '2',
              data: {
                results: [{ id: 3, title: 'Article 3', group: 'beta' }],
              },
            },
          },
        ],
      },
    );

    expect(result.current.alpha?.data.results).toHaveLength(2);
    expect(result.current.beta?.data.results).toHaveLength(1);

    // Move article 2 from alpha to beta
    await act(async () => {
      const response = await controller.fetch(
        getGroupedArticles.move,
        { id: 2 },
        {
          id: 2,
          title: 'Article 2',
          group: 'beta',
        },
      );
      // Type test: response should be a single GroupedArticle, not an array
      response.title satisfies string;
      expect(response.title).toBe('Article 2');
      expect(response.group).toBe('beta');
    });

    // article should be removed from alpha
    expect(result.current.alpha?.data.results).toHaveLength(1);
    const alphaResults = result.current.alpha!.data.results!;
    expect(alphaResults[0]?.title).toBe('Article 1');

    // article should be added to beta
    const betaResults = result.current.beta!.data.results!;
    expect(betaResults).toHaveLength(2);
    expect(betaResults.map((a: any) => a.title)).toEqual(
      expect.arrayContaining(['Article 3', 'Article 2']),
    );
  });

  // TODO: but we need a Values collection
  // it('assign: should extend name of parent endpoint', () => {
  //   expect(getArticleList3.assign.name).toMatchSnapshot();
  // });

  it('getPage: should extend name of parent endpoint', () => {
    expect(getNextPage3.name).toMatchSnapshot();
  });

  it('getPage: should update on get for a paginated resource with parameter in path', async () => {
    mynock.get(`/article-paginated?group=happy`).reply(200, paginatedFirstPage);
    mynock
      .get(`/article-paginated?cursor=2&group=happy`)
      .reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate, controller } = renderDataClient(() => {
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList3, {
        group: 'happy',
      });
      return { articles, nextPage };
    });
    await waitForNextUpdate();
    // @ts-expect-error
    () => controller.fetch(getNextPage3);
    // @ts-expect-error
    () => controller.fetch(getNextPage3, { fake: 5 });
    // @ts-expect-error
    () => controller.fetch(getNextPage3, { group: 'happy' });
    // @ts-expect-error
    () => controller.fetch(getNextPage3, { cursor: 2 });
    await controller.fetch(getNextPage3, {
      group: 'happy',
      cursor: 2,
    });
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
  });

  it('should deduplicate results', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, {
      ...paginatedSecondPage,
      results: [nested[nested.length - 1], ...moreNested],
    });

    const { result, waitForNextUpdate } = renderDataClient(() => {
      const { fetch } = useController();
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(getArticleList);
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    await result.current.fetch(getNextPage, {
      cursor: 2,
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

    const { result, waitForNextUpdate } = renderDataClient(() => {
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
    await result.current.fetch(getComplex, {
      id: '5',
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
      getRequestInit(body) {
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

      getRequestInit(body: any) {
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
      () => {
        // test type widening
        const second = updateUser.extend({ body: { body: '' } });
        second({ charm: 5 }, { body: 'hi' });
      };
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
        body: undefined,
      });
      () => nobody({ charm: 5 });
      // @ts-expect-error
      () => nobody({ id: 5 });
    });

    it('setting body in extend should work without path', async () => {
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
      }).extend({
        body: 5,
      });
      const response = await updateUser(
        { id: 5 },
        // @ts-expect-error
        { username: 'micky', email: 'micky@gmail.com' },
      );
      () => updateUser({ id: 5 }, 5);
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
        body: undefined,
      });
      () => nobody({ charm: 5 });
      // @ts-expect-error
      () => nobody({ id: 5 });

      const updateUser2 = new MyEndpoint({
        method: 'PUT',
        path: 'http\\://test.com/user/:id',
        name: 'update',
        schema: User,
      }).extend({
        searchParams: {} as { isAdmin: boolean },
      });
      () =>
        updateUser2(
          { id: 5, isAdmin: true },
          { username: 'micky', email: 'micky@gmail.com' },
        );
      () =>
        // @ts-expect-error
        updateUser2({ id: 5 }, { username: 'micky', email: 'micky@gmail.com' });
      () =>
        updateUser2(
          // @ts-expect-error
          { isAdmin: true },
          { username: 'micky', email: 'micky@gmail.com' },
        );

      const updateBasic = new MyEndpoint({
        method: 'PUT',
        path: 'http\\://test.com/user/:id',
        name: 'update',
        schema: User,
      });
      () =>
        updateBasic({ id: 5 }, { username: 'micky', email: 'micky@gmail.com' });
      () =>
        updateBasic(
          // @ts-expect-error
          { id: 5, isAdmin: true },
          { username: 'micky', email: 'micky@gmail.com' },
        );
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
      const { result, waitForNextUpdate } = renderDataClient(() => {
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
        constructor({
          path = 'http\\://test.com/user/:id',
          ...options
        }: Readonly<O & { name: string }>) {
          super({ path, ...options } as any);
        }
      }

      const getUser = new UserEndpoint({
        method: 'GET',
        name: 'update',
      });
      const { result, waitForNextUpdate } = renderDataClient(() => {
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

    it('update should work with extends', async () => {
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

    it('get should work with extends', async () => {
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
      getUserBase.body;
      expect(getUserBase.name).toBe('getuser');
      expect(getUserBase.extend({ method: 'GET' }).name).toBe('getuser');
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

      const newBody = getUser
        .extend({
          body: {} as { title: string },
          dataExpiryLength: 0,
          method: 'POST',
        })
        .extend({ dataExpiryLength: 5 });
      () => newBody({ group: 'hi', id: 'what' }, { title: 'cool' });
      // @ts-expect-error
      () => newBody({ id: 'what' }, { title: 'cool' });
      // @ts-expect-error
      () => newBody({ title: 'cool' });
      // @ts-expect-error
      () => newBody({ group: 'hi', id: 'what' });
      // @ts-expect-error
      () => newBody({ group: 'hi', id: 'what' }, { sdfsd: 'cool' });

      const bodyNoPath = newBody.extend({
        path: '/',
      });
      const bodyNoParams = bodyNoPath.extend({
        body: {} as { happy: string },
      });
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

      const searchParams2 = searchParams.extend({
        searchParams: {} as { bigger: boolean },
      });
      () => searchParams2({ group: 'hi', id: 'what', bigger: true });
      () => searchParams2({ group: 'hi', id: 'what', bigger: false });
      // @ts-expect-error
      () => searchParams2({ group: 'hi', id: 'what', bigger: 5 });
      // @ts-expect-error
      () => searchParams2({ group: 'hi', id: 'what', sort: 'asc' });
      // @ts-expect-error
      () => searchParams2({ group: 'hi', id: 'what' });
      // @ts-expect-error
      () => searchParams2.url({ group: 'hi', id: 'what' });
      expect(
        searchParams2.url({
          group: 'hi',
          id: 'what',
          bigger: true,
        }),
      ).toMatchInlineSnapshot(`"http://test.com/hi/user/what?bigger=true"`);

      const searchParams3 = getUserBase.extend({
        searchParams: {} as { bigger: boolean },
      });
      () => searchParams3({ id: 'what', bigger: true });
      () => searchParams3({ id: 'what', bigger: false });
      // @ts-expect-error
      () => searchParams3({ id: 'what', bigger: 5 });
      // @ts-expect-error
      () => searchParams3({ id: 'what', sort: 'asc' });
      // @ts-expect-error
      () => searchParams3({ id: 'what' });
      // @ts-expect-error
      () => searchParams3.url({ id: 'what' });
      expect(
        searchParams3.url({
          id: 'what',
          bigger: true,
        }),
      ).toMatchInlineSnapshot(`"http://test.com/user/what?bigger=true"`);

      const searchParams4 = getUserBase
        .extend({
          path: '/users',
        })
        .extend({ searchParams: {} as { bigger?: boolean } | undefined });
      () => searchParams4({ bigger: true });
      () => searchParams4();
      () => searchParams4({});
      // @ts-expect-error
      () => searchParams4({ id: 'what', bigger: false });
      // @ts-expect-error
      () => searchParams4({ bigger: 5 });
      // @ts-expect-error
      () => searchParams4({ id: 'what' });
      // @ts-expect-error
      () => searchParams4.url({ id: 'what' });
      expect(
        searchParams4.url({
          bigger: true,
        }),
      ).toMatchInlineSnapshot(`"/users?bigger=true"`);
      expect(searchParams4.url()).toMatchInlineSnapshot(`"/users"`);
    });

    it('should work with custom searchToString', async () => {
      class SearchEndpoint<O extends RestGenerics = any> extends MyEndpoint<O> {
        searchToString(searchParams: Record<string, any>) {
          return super.searchToString({ ...searchParams, bob: 5 });
        }
      }

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

      const getUserBase = new SearchEndpoint({
        method: 'GET',
        path: 'http\\://test.com/user/:id',
        name: 'getuser',
        schema: User,
      });
      const getUser = getUserBase.extend({
        path: 'http\\://test.com/:group/user/:id',
        schema: User2,
      });

      const searchParams = getUser.extend({
        path: 'http\\://test.com/:group/user/:id',
        searchParams: {} as { isAdmin?: boolean; sort: 'asc' | 'desc' },
      });

      expect(
        searchParams.url({
          group: 'hi',
          id: 'what',
          sort: 'desc',
          isAdmin: true,
        }),
      ).toMatchInlineSnapshot(
        `"http://test.com/hi/user/what?bob=5&isAdmin=true&sort=desc"`,
      );
    });
  });

  it('extending with name should work', () => {
    const endpoint = CoolerArticleResource.get.extend({ name: 'mything' });
    const endpoint2 = CoolerArticleResource.get.extend({ path: '/:bob' });
    expect(CoolerArticleResource.get.name).toMatchInlineSnapshot(
      `"CoolerArticle.get"`,
    );
    expect(endpoint.name).toBe('mything');
    expect(endpoint2.name).toMatchInlineSnapshot(`"CoolerArticle.get"`);
  });
  it('should infer default method when sideEffect is set', async () => {
    const endpoint = new RestEndpoint({
      sideEffect: true,
      path: 'http\\://test.com/article-cooler',
      schema: CoolerArticle,
    }).extend({ name: 'createarticle' });
    const a: true = endpoint.sideEffect;
    const b: 'POST' = endpoint.method;
    expect(endpoint.method).toBe('POST');
    expect(endpoint.sideEffect).toBe(true);
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

  describe('body type setting', () => {
    it('should work in constructors', () => {
      interface TodoInterface {
        title: string;
        completed: boolean;
      }
      const update = new RestEndpoint({
        path: '/:id',
        method: 'POST',
        body: {} as TodoInterface,
      });
      () => update({ id: 5 }, { title: 'updated', completed: true });
      // @ts-expect-error
      () => update({ id: 5 });
      // @ts-expect-error
      () => update({ id: 5 }, { title: 5, completed: true });
      // @ts-expect-error
      () => update({ id: 5 }, { completed: true });
    });
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

    const endpoint2 = new RestEndpoint({
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
      getOptimisticResponse(snap, params, body) {
        params.id;
        // @ts-expect-error
        params.two;

        body.hi;
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
    expect(error.status).toBe(400);
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
    expect(error.status).toBe(500);

    console.error = oldError;
  });

  it('should return raw response if status is 204 No Content', async () => {
    const res = await CoolerArticleResource.get({ id: idNoContent });
    expect(res).toBe(null);
  });

  it('should reject if content-type is not json with schema', async () => {
    const id = 8;
    const text = '<body>this is html</body>';
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, text, { 'content-type': 'html/text' });

    await expect(
      async () => await CoolerArticleResource.get({ id }),
    ).rejects.toMatchSnapshot();
  });

  it('should reject if content-type does not exist with schema', async () => {
    const id = 10;
    const text = '<body>this is html</body>';
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, text, {});

    await expect(
      async () => await CoolerArticleResource.get({ id }),
    ).rejects.toMatchSnapshot();
  });

  it('should return text if content-type is not json with no schema', async () => {
    const id = 8;
    const text = '<body>this is html</body>';
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, text, { 'content-type': 'html/text' });

    const res = await CoolerArticleResource.get.extend({ schema: undefined })({
      id,
    });
    expect(res).toBe('<body>this is html</body>');
  });

  it('should return text if content-type does not exist with no schema', async () => {
    const id = 10;
    const text = '<body>this is html</body>';
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, text, {});

    const res = await CoolerArticleResource.get.extend({ schema: undefined })({
      id,
    });
    expect(res).toBe(text);
  });

  it('should reject with custom message if content type is set but json parsable', async () => {
    const id = 8;
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, { id, title: 'hi' }, {});

    await expect(
      async () => await CoolerArticleResource.get({ id }),
    ).rejects.toMatchSnapshot();
  });

  it('should still work with empty content-type', async () => {
    const id = 8;
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
      })
      .get(`/article-cooler/${id}`)
      .reply(200, { id, title: 'hi' });

    const res = await CoolerArticleResource.get({
      id,
    });
    expect(res).toEqual({ id, title: 'hi' });
  });

  it('without Collection in schema - endpoint.push schema should be null', () => {
    const noColletionEndpoint = new RestEndpoint({
      urlPrefix: 'http://test.com/article-paginated/',
      path: ':group',
      name: 'get',
      schema: {
        nextPage: '',
        data: { results: [PaginatedArticle] },
      },
      method: 'GET',
    });
    expect(noColletionEndpoint.push.schema).toBeFalsy();
  });

  it('without Collection in schema - endpoint.remove schema should be null', () => {
    const noColletionEndpoint = new RestEndpoint({
      urlPrefix: 'http://test.com/article-paginated/',
      path: ':group',
      name: 'get',
      schema: {
        nextPage: '',
        data: { results: [PaginatedArticle] },
      },
      method: 'GET',
    });
    expect(noColletionEndpoint.remove.schema).toBeFalsy();
  });

  it('without Collection in schema - endpoint.move schema should be null', () => {
    const noColletionEndpoint = new RestEndpoint({
      urlPrefix: 'http://test.com/article-paginated/',
      path: ':group',
      name: 'get',
      schema: {
        nextPage: '',
        data: { results: [PaginatedArticle] },
      },
      method: 'GET',
    });
    expect(noColletionEndpoint.move.schema).toBeFalsy();
  });

  it('without Collection in schema - endpoint.getPage should throw', () => {
    const noColletionEndpoint = new RestEndpoint({
      urlPrefix: 'http://test.com/article-paginated/',
      path: ':group',
      name: 'get',
      schema: {
        nextPage: '',
        data: { results: [PaginatedArticle] },
      },
      method: 'GET',
    });
    expect(() => noColletionEndpoint.getPage).toThrowErrorMatchingSnapshot();
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
