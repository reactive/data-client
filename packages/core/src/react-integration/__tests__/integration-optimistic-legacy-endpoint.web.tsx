import {
  CoolerArticleResource,
  ArticleResourceWithOtherListUrl,
  FutureArticleResource,
} from '__tests__/legacy-optimistic';
import nock from 'nock';
import { jest } from '@jest/globals';

import {
  makeRenderRestHook,
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../../../test';
import { useResource, useFetcher, useCache } from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  valuesFixture,
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

/*
  These tests cover legacy 'optimisticUpdate' property
*/

describe.each([
  ['CacheProvider', makeCacheProvider],
  ['ExternalCacheProvider', makeExternalCacheProvider],
] as const)(`%s`, (_, makeProvider) => {
  describe('Optimistic Updates', () => {
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
        .delete(`/user/23`)
        .reply(204, '')
        .get(`/article-cooler/0`)
        .reply(403, {})
        .get(`/article-cooler/666`)
        .reply(200, '')
        .get(`/article-cooler/`)
        .reply(200, nested)
        .get(`/article-cooler/values`)
        .reply(200, valuesFixture)
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

    it('works with partial update', async () => {
      const params = { id: payload.id };
      mynock.patch('/article-cooler/5').reply(200, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const put = useFetcher(CoolerArticleResource.partialUpdate());
          const article = useCache(CoolerArticleResource.detail(), params);
          // @ts-expect-error
          article.doesnotexist;
          return { put, article };
        },
        {
          results: [
            {
              request: CoolerArticleResource.detail(),
              params,
              result: payload,
            },
          ],
        },
      );
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS(payload),
      );
      const promise = result.current.put(params, { content: 'changed' });
      expect(result.current.article).toBeInstanceOf(CoolerArticleResource);
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS({
          ...payload,
          content: 'changed',
        }),
      );
      await promise;
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      );
    });

    it('works with deletes', async () => {
      const params = { id: payload.id };
      mynock.delete('/article-cooler/5').reply(200, '');

      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const del = useFetcher(CoolerArticleResource.delete());
          const articles = useCache(CoolerArticleResource.list(), {});
          return { del, articles };
        },
        {
          results: [
            {
              request: CoolerArticleResource.list(),
              params: {},
              result: [payload],
            },
          ],
        },
      );
      expect(result.current.articles).toEqual([
        CoolerArticleResource.fromJS(payload),
      ]);
      const promise = result.current.del(params);
      expect(result.current.articles).toEqual([]);
      await promise;
      expect(result.current.articles).toEqual([]);
    });

    it('works with eager creates', async () => {
      const body = { id: -1111111111, content: 'hi' };
      const existingItem = ArticleResourceWithOtherListUrl.fromJS({
        id: 100,
        content: 'something',
      });

      mynock.post(`/article/`).reply(201, {
        ...payload,
        title: 'some other title',
        content: 'real response',
      });

      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const create = useFetcher(ArticleResourceWithOtherListUrl.create());
          const listA = useCache(ArticleResourceWithOtherListUrl.list(), {});
          const listB = useCache(
            ArticleResourceWithOtherListUrl.otherList(),
            {},
          );
          return { create, listA, listB };
        },
        {
          results: [
            {
              request: ArticleResourceWithOtherListUrl.otherList(),
              params: {},
              result: [{ id: 100, content: 'something' }],
            },
          ],
        },
      );

      expect(result.current.listA).toEqual(undefined);
      expect(result.current.listB).toEqual([existingItem]);

      const promise = result.current.create({}, body, [
        [
          ArticleResourceWithOtherListUrl.list(),
          {},
          (newArticleID: string, articleIDs: string[] | undefined) => [
            ...(articleIDs || []),
            newArticleID,
          ],
        ],
        [
          ArticleResourceWithOtherListUrl.otherList(),
          {},
          (newArticleID: string, articleIDs: string[] | undefined) => [
            ...(articleIDs || []),
            newArticleID,
          ],
        ],
      ]);

      expect(result.current.listA).toEqual([
        CoolerArticleResource.fromJS(body),
      ]);
      expect(result.current.listB).toEqual([
        existingItem,
        CoolerArticleResource.fromJS(body),
      ]);
      await promise;
      expect(result.current.listA).toEqual([
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      ]);
      expect(result.current.listB).toEqual([
        existingItem,
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'some other title',
          content: 'real response',
        }),
      ]);
    });

    it('should update on create', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() => {
        const articles = useResource(FutureArticleResource.list(), {});
        const create = useFetcher(FutureArticleResource.create());
        return { articles, create };
      });

      await waitForNextUpdate();
      expect(result.current.articles.map(({ id }) => id)).toEqual([5, 3]);

      await result.current.create({
        id: 1,
      });
      expect(result.current.articles.map(({ id }) => id)).toEqual([1, 5, 3]);
    });

    it('should clear only earlier optimistic updates when a promise resolves', async () => {
      jest.useFakeTimers({ legacyFakeTimers: true });

      const params = { id: payload.id };
      const { result, waitForNextUpdate } = renderRestHook(
        () => {
          const put = useFetcher(CoolerArticleResource.partialUpdate());
          const article = useCache(CoolerArticleResource.detail(), params);
          return { put, article };
        },
        {
          initialFixtures: [
            {
              endpoint: CoolerArticleResource.detail(),
              args: [params],
              response: payload,
            },
          ],
        },
      );

      // first optimistic
      mynock
        .patch('/article-cooler/5')
        .delay(200)
        .reply(200, {
          ...payload,
          title: 'first',
          content: 'first',
        });
      result.current.put(params, {
        title: 'firstoptimistic',
        content: 'firstoptimistic',
      });
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'firstoptimistic',
          content: 'firstoptimistic',
        }),
      );

      // second optimistic
      mynock
        .patch('/article-cooler/5')
        .delay(50)
        .reply(200, {
          ...payload,
          title: 'second',
        });
      result.current.put(params, {
        title: 'secondoptimistic',
      });
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
        }),
      );

      // third optimistic
      mynock
        .patch('/article-cooler/5')
        .delay(500)
        .reply(200, {
          ...payload,
          tags: ['third'],
        });
      result.current.put(params, {
        tags: ['thirdoptimistic'],
      });
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'secondoptimistic',
          content: 'firstoptimistic',
          tags: ['thirdoptimistic'],
        }),
      );

      // resolve second request while first is in flight
      jest.advanceTimersByTime(51);
      await waitForNextUpdate();

      // first and second optimistic should be cleared with only third optimistic left to be layerd
      // on top of second's network response
      expect(result.current.article).toEqual(
        CoolerArticleResource.fromJS({
          ...payload,
          title: 'second',
        }),
      );
    });
  });
});
