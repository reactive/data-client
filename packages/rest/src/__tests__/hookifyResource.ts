import { CoolerArticleResource, CoolerArticle, User } from '__tests__/new';
import nock from 'nock';
import { useController, useSuspense } from '@rest-hooks/core';

import hookifyResource from '../hookifyResource';
import { makeRenderRestHook, makeCacheProvider } from '../../../test';

const CoolerArticleHookResource = hookifyResource(
  CoolerArticleResource,
  () => ({}),
);

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

describe('hookifyResource()', () => {
  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  describe('HookableResource endpoints', () => {
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

    let renderRestHook: ReturnType<typeof makeRenderRestHook>;

    beforeEach(() => {
      renderRestHook = makeRenderRestHook(makeCacheProvider);

      nock(/.*/)
        .defaultReplyHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        })
        .get(`/article-cooler/${payload.id}`)
        .reply(200, payload)
        .get(`/article-cooler`)
        .reply(200, [payload])
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

    it('useDetail', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() =>
        useSuspense(CoolerArticleHookResource.useGet(), { id: payload.id }),
      );
      await waitForNextUpdate();
      expect(result.current).toBeDefined();
      expect(result.current.title).toBe(payload.title);
    });

    it('useList', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() =>
        useSuspense(CoolerArticleHookResource.useGetList()),
      );
      await waitForNextUpdate();
      expect(result.current).toBeDefined();
    });

    it('useCreate', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleHookResource.useCreate(),
        fetch: useController().fetch,
      }));
      const payload2 = { id: 20, content: 'better task' };
      const article = await result.current.fetch(
        result.current.endpoint,
        payload2,
      );
      // @ts-expect-error
      () => result.current.fetch(result.current.endpoint, {}, payload2);
      expect(article).toMatchObject(payload2);
    });

    it('useDelete', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleHookResource.useDelete(),
        fetch: useController().fetch,
      }));

      const res = await result.current.fetch(result.current.endpoint, {
        id: payload.id,
      });
      expect(res).toEqual({ id: 5 });
    });

    it('useUpdate', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleHookResource.useUpdate(),
        fetch: useController().fetch,
      }));

      const res = await result.current.fetch(
        result.current.endpoint,
        { id: payload.id },
        {
          ...CoolerArticle.fromJS(payload),
        },
      );
      expect(res).toEqual(putResponseBody);
    });

    it('usePartialUpdate', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleHookResource.usePartialUpdate(),
        fetch: useController().fetch,
      }));

      const res = await result.current.fetch(
        result.current.endpoint,
        { id },
        patchPayload,
      );
      expect(res).toEqual(patchResponseBody);
    });

    it('should use useFetchInit if defined (in endpoint method)', async () => {
      const useFetchInit = jest.fn(() => ({}));
      const FetchResource = hookifyResource(
        CoolerArticleResource,
        useFetchInit,
      );
      const articleDetail = FetchResource.useGet();
      expect(articleDetail).toBeDefined();
      expect(useFetchInit.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
