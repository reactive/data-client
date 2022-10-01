import nock from 'nock';
import { useController } from '@rest-hooks/core';
import { act } from '@testing-library/react-hooks';
import { Entity, Schema } from '@rest-hooks/endpoint';
import { useSuspense } from '@rest-hooks/core';

import RestEndpoint from '../RestEndpoint';
import createResource from '../createResource';
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
export const UserResource = createResource({
  path: 'http\\://test.com/user/:id',
  schema: User,
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
function createPaginatableResource<U extends string, S extends Schema>({
  path,
  schema,
  Endpoint = RestEndpoint,
}: {
  readonly path: U;
  readonly schema: S;
  readonly Endpoint?: typeof RestEndpoint;
}) {
  const baseResource = createResource({ path, schema, Endpoint });
  const getList = baseResource.getList.extend({
    path: 'http\\://test.com/article-paginated',
    schema: {
      nextPage: '',
      data: { results: [PaginatedArticle] },
    },
  });
  const getNextPage = getList.paginated((v: { cursor: string | number }) => []);
  return {
    ...baseResource,
    getList,
    getNextPage,
  };
}
const PaginatedArticleResource = createPaginatableResource({
  path: 'http\\://test.com/article-paginated/:id',
  schema: PaginatedArticle,
});

export class UrlArticle extends PaginatedArticle {
  readonly url: string = 'happy.com';
}

describe('createResource()', () => {
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

  it('should handle simple urls', () => {
    expect(UserResource.get.url({ id: '5' })).toBe('http://test.com/user/5');
    expect(UserResource.get.url({ id: '100' })).toBe(
      'http://test.com/user/100',
    );
    /*expect(UserResource.getList.url({ bob: '100' })).toBe(
      'http://test.com/user?bob=100',
    );
    expect(UserResource.create.url({ bob: '100' })).toBe(
      'http://test.com/user',
    );*/
    expect(
      UserResource.update.url({ id: '100' }, { id: 100, username: 'bob' }),
    ).toBe('http://test.com/user/100');

    // @ts-expect-error
    () => UserResource.get.url({ sdf: '5' });
  });

  it('should handle multiarg urls', () => {
    const MyUserResource = createResource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
    });

    expect(MyUserResource.get.url({ group: 'big', id: '5' })).toBe(
      'http://test.com/groups/big/users/5',
    );
    expect(MyUserResource.get.url({ group: 'big', id: '100' })).toBe(
      'http://test.com/groups/big/users/100',
    );
    /*expect(MyUserResource.getList.url({ group: 'big', bob: '100' })).toBe(
      'http://test.com/groups/big/users?bob=100',
    );*/
    expect(
      MyUserResource.create.url({ group: 'big' }, { username: '100' }),
    ).toBe('http://test.com/groups/big/users');
    expect(
      MyUserResource.update.url(
        { group: 'big', id: '100' },
        { id: 100, username: 'bob' },
      ),
    ).toBe('http://test.com/groups/big/users/100');

    // missing required
    expect(() =>
      // @ts-expect-error
      MyUserResource.get.url({ id: '5' }),
    ).toThrow();
    // extra fields
    () =>
      MyUserResource.get.url({
        group: 'mygroup',
        id: '5',
        // @ts-expect-error
        notexisting: 'hi',
      });

    // @ts-expect-error
    () => useSuspense(MyUserResource.get, { id: '5' });
    // @ts-expect-error
    () => useSuspense(MyUserResource.get);
    () => useSuspense(MyUserResource.get, { group: 'yay', id: '5' });
  });

  it('should automatically name methods', () => {
    expect(PaginatedArticleResource.get.name).toBe('PaginatedArticle.get');
    expect(PaginatedArticleResource.create.name).toBe(
      'PaginatedArticle.create',
    );
    expect(PaginatedArticleResource.getList.name).toBe(
      'PaginatedArticle.getList',
    );
    expect(PaginatedArticleResource.delete.name).toBe(
      'PaginatedArticle.delete',
    );
  });

  it('should update on get for a paginated resource', async () => {
    mynock.get(`/article-paginated`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const { fetch } = useController();
      const {
        data: { results: articles },
        nextPage,
      } = useSuspense(PaginatedArticleResource.getList);
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    () =>
      // @ts-expect-error
      result.current.fetch(PaginatedArticleResource.getNextPage);
    await act(async () => {
      await result.current.fetch(PaginatedArticleResource.getNextPage, {
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
      } = useSuspense(PaginatedArticleResource.getList);
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    await act(async () => {
      await result.current.fetch(PaginatedArticleResource.getNextPage, {
        cursor: 2,
      });
    });
    expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3, 7, 8]);
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
    const ComplexResource = createResource({
      path: '/complex-thing/:id',
      schema: ComplexEntity,
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
      const article = useSuspense(ComplexResource.get, { id: '5' });
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
      await result.current.fetch(ComplexResource.get, {
        id: '5',
      });
    });
    expect(result.current.article).toEqual({ ...secondResponse, extra: 'hi' });
  });

  it('delete() should fallback to params when response is empty object', async () => {
    mynock.delete(`/article-paginated/500`).reply(200, {});
    const res = await PaginatedArticleResource.delete({ id: 500 });
    expect(res).toEqual({ id: 500 });
  });

  it('delete() should fallback to params when response is undefined', async () => {
    mynock.delete(`/article-paginated/500`).reply(204, undefined);
    const res = await PaginatedArticleResource.delete({ id: 500 });
    expect(res).toEqual({ id: 500 });
  });

  it('should spread `url` member', () => {
    const entity = UrlArticle.fromJS({ url: 'five' });
    const spread = { ...entity };
    expect(spread.url).toBe('five');
    expect(Object.hasOwn(entity, 'url')).toBeTruthy();
  });
});
