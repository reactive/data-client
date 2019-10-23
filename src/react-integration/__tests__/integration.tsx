import React from 'react';
import nock from 'nock';

import {
  CoolerArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  UserResource,
} from '../../__tests__/common';
import { useResource, useFetcher } from '../hooks';
import makeRenderRestHook from '../../test/makeRenderRestHook';
import {
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../test/providers';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
} from './fixtures';

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  window.addEventListener('error', onError);
});
afterEach(() => {
  window.removeEventListener('error', onError);
});

for (const makeProvider of [makeCacheProvider, makeExternalCacheProvider]) {
  describe(`${makeProvider.name} => <Provider />`, () => {
    // TODO: add nested resource test case that has multiple partials to test merge functionality

    let renderRestHook: ReturnType<typeof makeRenderRestHook>;

    beforeEach(() => {
      nock('http://test.com')
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload);
      nock('http://test.com')
        .delete(`/article-cooler/${payload.id}`)
        .reply(204, '');
      nock('http://test.com')
        .delete(`/article/${payload.id}`)
        .reply(200, {});
      nock('http://test.com')
        .get(`/article-cooler/0`)
        .reply(403, {});
      nock('http://test.com')
        .get(`/article-cooler/666`)
        .reply(200, '');
      nock('http://test.com')
        .get(`/article-cooler/`)
        .reply(200, nested)
        .persist();
      nock('http://test.com')
        .post(`/article-cooler/`)
        .reply(200, createPayload);
      nock('http://test.com')
        .get(`/user/`)
        .reply(200, users);
      renderRestHook = makeRenderRestHook(makeProvider);
    });
    afterEach(() => {
      renderRestHook.cleanup();
    });

    it('should resolve useResource()', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(CoolerArticleResource.detailShape(), payload);
      });
      expect(result.current).toBe(null);
      await waitForNextUpdate();
      expect(result.current instanceof CoolerArticleResource).toBe(true);
      expect(result.current.title).toBe(payload.title);
    });

    it('should throw 404 once deleted', async () => {
      let del: any;
      const { result, waitForNextUpdate } = renderRestHook(() => {
        del = useFetcher(CoolerArticleResource.deleteShape());
        return useResource(CoolerArticleResource.detailShape(), payload);
      });
      expect(result.current).toBe(null);
      await waitForNextUpdate();
      expect(result.current instanceof CoolerArticleResource).toBe(true);
      expect(result.current.title).toBe(payload.title);

      await del(payload);
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(404);
    });

    it('should throw when retrieving an empty string', async () => {
      const { result } = renderRestHook(() => {
        return useFetcher(CoolerArticleResource.detailShape());
      });

      await expect(result.current({ id: 666 })).rejects.toThrowError(
        'JSON expected but not returned from API',
      );
    });

    it('should not throw on delete', async () => {
      const { result } = renderRestHook(() => {
        return [
          useFetcher(CoolerArticleResource.deleteShape()),
          useFetcher(ArticleResource.deleteShape()),
        ];
      });

      for (const del of result.current) {
        await expect(del(payload, undefined)).resolves.toBeDefined();
      }
    });

    it('useResource() should throw errors on bad network', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        return useResource(CoolerArticleResource.detailShape(), {
          title: '0',
        });
      });
      expect(result.current).toBe(null);
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
      expect(result.current).toBe(null);
      await waitForNextUpdate();
      expect(result.error).toBeDefined();
      expect((result.error as any).status).toBe(403);
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
      expect(result.current).toBe(null);
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
      expect(article).toBeNull();
    });

    it('should update on create', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        const articles = useResource(CoolerArticleResource.listShape(), {});
        const createNewArticle = useFetcher(
          CoolerArticleResource.createShape(),
        );
        return { articles, createNewArticle };
      });
      await waitForNextUpdate();
      await result.current.createNewArticle({}, { id: 1 }, [
        [
          CoolerArticleResource.listShape(),
          {},
          (newArticle: string, articles: string[]): string[] => [
            ...articles,
            newArticle,
          ],
        ],
      ]);
      expect(
        result.current.articles.map(
          ({ id }: Partial<CoolerArticleResource>) => id,
        ),
      ).toEqual([5, 3, 1]);
    });

    it('should update on get for a paginated resource', async () => {
      nock('http://test.com')
        .get(`/article-paginated/`)
        .reply(200, paginatedFirstPage);
      nock('http://test.com')
        .get(`/article-paginated/?cursor=2`)
        .reply(200, paginatedSecondPage);

      const { result, waitForNextUpdate } = renderRestHook(() => {
        const articles = useResource(PaginatedArticleResource.listShape(), {});
        const getNextPage = useFetcher(PaginatedArticleResource.listShape());
        return { articles, getNextPage };
      });
      await waitForNextUpdate();
      await result.current.getNextPage({ cursor: 2 }, {}, [
        [
          PaginatedArticleResource.listShape(),
          {},
          (
            newArticles: { results: string[] },
            articles: { results?: string[] },
          ) => ({
            results: [...(articles.results || []), ...newArticles.results],
          }),
        ],
      ]);
      expect(
        result.current.articles.map(
          ({ id }: Partial<PaginatedArticleResource>) => id,
        ),
      ).toEqual([5, 3, 7, 8]);
    });
  });
}
