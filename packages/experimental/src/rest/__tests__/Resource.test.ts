import nock from 'nock';
import { useResource } from '@rest-hooks/core';
import { act } from '@testing-library/react-hooks';

import Resource from '../Resource';
import useFetcher from '../../useFetcher';
import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
} from '../test-fixtures';

export class UserResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/user/';
}
export class PaginatedArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: UserResource,
  };

  static urlRoot = 'http://test.com/article-paginated/';

  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: {
        nextPage: '',
        results: [this],
      },
    });
  }

  static listPage<T extends typeof PaginatedArticleResource>(this: T) {
    return this.list().paginated(({ cursor, ...rest }) => [rest]);
  }
}

describe('Resource', () => {
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
      .get(`/article-cooler/`)
      .reply(200, nested)
      .post(`/article-cooler/`)
      .reply(200, createPayload)
      .get(`/user/`)
      .reply(200, users);
    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should automatically name methods', () => {
    expect(PaginatedArticleResource.detail().name).toBe(
      'PaginatedArticleResource.detail',
    );
    expect(PaginatedArticleResource.list().name).toBe(
      'PaginatedArticleResource.list',
    );
    expect(PaginatedArticleResource.create().name).toBe(
      'PaginatedArticleResource.create',
    );
    expect(PaginatedArticleResource.delete().name).toBe(
      'PaginatedArticleResource.delete',
    );
  });

  it('should update on get for a paginated resource', async () => {
    mynock.get(`/article-paginated/`).reply(200, paginatedFirstPage);
    mynock.get(`/article-paginated/?cursor=2`).reply(200, paginatedSecondPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      const fetch = useFetcher();
      const { results: articles, nextPage } = useResource(
        PaginatedArticleResource.list(),
        {},
      );
      return { articles, nextPage, fetch };
    });
    await waitForNextUpdate();
    await act(async () => {
      await result.current.fetch(PaginatedArticleResource.listPage(), {
        cursor: 2,
      });
    });
    expect(
      result.current.articles.map(
        ({ id }: Partial<PaginatedArticleResource>) => id,
      ),
    ).toEqual([5, 3, 7, 8]);
  });

  it('should not deep-merge deeply defined entities', async () => {
    interface Complex {
      firstvalue: number;
      secondthing: {
        arg?: number;
        other?: string;
      };
    }
    class ComplexResource extends Resource {
      readonly id: string = '';
      readonly complexThing?: Complex = undefined;
      readonly extra: string = '';

      pk() {
        return this.id;
      }

      static urlRoot = '/complex-thing/';
    }
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
      const fetch = useFetcher();
      const article = useResource(ComplexResource.detail(), { id: '5' });
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
      await result.current.fetch(ComplexResource.detail(), {
        id: '5',
      });
    });
    expect(result.current.article).toEqual({ ...secondResponse, extra: 'hi' });
  });
});
