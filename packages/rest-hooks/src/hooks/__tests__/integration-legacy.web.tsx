import { jest } from '@jest/globals';
// relative imports to avoid circular dependency in tsconfig references
import { SimpleRecord } from '@rest-hooks/legacy';
import { shapeToEndpoint } from '@rest-hooks/legacy';
import { CacheProvider } from '@rest-hooks/react';
import { CacheProvider as ExternalCacheProvider } from '@rest-hooks/redux';
import { makeRenderRestHook } from '@rest-hooks/test';
import { act } from '@testing-library/react-hooks';
import {
  CoolerArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  UserResource,
  ArticleResourceWithOtherListUrl,
  ListPaginatedArticle,
  CoolerArticleDetail,
  IndexedUserResource,
} from '__tests__/legacy-3';
import nock from 'nock';

import { useResource, useCache } from '..';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
} from '../test-fixtures';

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

describe.each([
  ['CacheProvider', CacheProvider],
  ['ExternalCacheProvider', ExternalCacheProvider],
] as const)(`%s`, (_, makeProvider) => {
  // TODO: add nested resource test case that has multiple partials to test merge functionality

  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
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

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeProvider);
  });

  describe('Endpoint', () => {
    it('should resolve await', async () => {
      const result = await CoolerArticleDetail(payload);
      expect(result.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.lafsjlfd).toBeUndefined();
    });

    it('should resolve useResource()', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(CoolerArticleDetail, payload);
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current.title).toBe(payload.title);
      // @ts-expect-error
      expect(result.current.lafsjlfd).toBeUndefined();
    });

    it('should resolve useResource() with SimpleRecords', async () => {
      mynock.get(`/article-paginated/`).reply(200, paginatedFirstPage);

      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(ListPaginatedArticle, {});
      });
      expect(result.current).toBeUndefined();
      await waitForNextUpdate();
      expect(result.current).toBeInstanceOf(SimpleRecord);
      expect(result.current.nextPage).toBe('');
      expect(result.current.prevPage).toBe('');
      expect(result.current.results).toMatchSnapshot();
      // @ts-expect-error
      expect(result.current.lafsjlfd).toBeUndefined();
    });
  });

  it('should resolve useResource()', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(CoolerArticleResource.detailShape(), payload);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current instanceof CoolerArticleResource).toBe(true);
    expect(result.current.title).toBe(payload.title);
  });

  it('should resolve useResource() with SimpleRecords', async () => {
    mynock.get(`/article-paginated/`).reply(200, paginatedFirstPage);

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(PaginatedArticleResource.listDefaultsShape(), {});
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.current).toBeInstanceOf(SimpleRecord);
    expect(result.current.nextPage).toBe('');
    expect(result.current.prevPage).toBe('');
    expect(result.current.results).toMatchSnapshot();
  });

  it('useResource() should throw errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(CoolerArticleResource.detailShape(), {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });

  it('useResource() should throw errors on bad network (multiarg)', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource([
        CoolerArticleResource.detailShape(),
        {
          title: '0',
        },
      ]);
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });

  it('useResource() should throw errors on malformed response', async () => {
    const response = [1];
    mynock.get(`/article-cooler/${878}`).reply(200, response);
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(CoolerArticleResource.detailShape(), {
        id: 878,
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(400);
    expect(result.error).toMatchSnapshot();
  });

  it('should resolve parallel useResource() request', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(
        [
          CoolerArticleResource.detailShape(),
          {
            id: payload.id,
          },
        ],
        [UserResource.listShape(), {}],
      );
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    const [article, users] = result.current;
    expect(article instanceof CoolerArticleResource).toBe(true);
    expect(article.title).toBe(payload.title);
    expect(users).toBeDefined();
    expect(users.length).toBeTruthy();
    expect(users[0] instanceof UserResource).toBe(true);
  });

  it('should not suspend with no params to useResource()', () => {
    let article: any;
    const { result } = renderRestHook(() => {
      article = useResource(CoolerArticleResource.detailShape(), null);
      return 'done';
    });
    expect(result.current).toBe('done');
    expect(article).toBeUndefined();
  });
});
