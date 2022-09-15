import { ContextAuthdArticle, UserResource } from '__tests__/new';
import nock from 'nock';
import { schema } from '@rest-hooks/endpoint';
import { useController, useSuspense } from '@rest-hooks/core';

import HookableResource from '../HookableResource';
import { makeRenderRestHook, makeCacheProvider } from '../../../test';

export class HookableArticle extends HookableResource {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: UserResource | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: UserResource,
  };

  static urlRoot = 'http://test.com/article/';
  static url(urlParams?: any): string {
    if (urlParams && !urlParams.id) {
      return `${this.urlRoot}${urlParams.title}`;
    }
    return super.url(urlParams);
  }

  static useListWithUser<T extends typeof HookableArticle>(this: T) {
    return this.useList().extend({
      url: (
        params: Readonly<Record<string, string | number | boolean>> | undefined,
      ) => this.listUrl({ ...params, includeUser: true }),
    });
  }
}

export class UrlArticleResource extends HookableArticle {
  readonly url: string = 'happy.com';
}
export class CoolerArticleResource extends HookableArticle {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }
}

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

describe('HookableResource', () => {
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

  it('should implement schema.EntityInterface', () => {
    class A extends HookableResource {
      readonly id: string = '';
      pk() {
        return this.id;
      }
    }
    const a: schema.EntityInterface = A;
  });

  it('should init', () => {
    const author = UserResource.fromJS({ id: 5 });
    const resource = CoolerArticleResource.fromJS({
      id: 5,
      title: 'happy',
      author,
    });
    expect(resource.pk()).toBe('5');
    expect(CoolerArticleResource.pk(resource)).toBe('5');
    expect(resource.title).toBe('happy');
    expect(resource.things).toBe('happy five');
    expect(resource.url).toBe('http://test.com/article-cooler/5');
    expect(resource.author).toBe(author);
    expect(resource.author?.pk()).toBe('5');
  });

  describe('HookableResource endpoints', () => {
    const id = 5;
    const idHtml = 6;
    const idNoContent = 7;
    const payload = {
      id,
      title: 'happy',
      author: UserResource.fromJS({ id: 5 }),
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
        .get(`/article-cooler/`)
        .reply(200, [payload])
        .get(`/article-cooler/${idHtml}`)
        .reply(200, '<body>this is html</body>')
        .get(`/article-cooler/${idNoContent}`)
        .reply(204, '')
        .post('/article-cooler/')
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
          for (const key of Object.keys(CoolerArticleResource.fromJS({}))) {
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
        useSuspense(CoolerArticleResource.useDetail(), payload),
      );
      await waitForNextUpdate();
      expect(result.current).toBeDefined();
      expect(result.current.title).toBe(payload.title);
    });

    it('useList', async () => {
      const { result, waitForNextUpdate } = renderRestHook(() =>
        useSuspense(CoolerArticleResource.useList()),
      );
      await waitForNextUpdate();
      expect(result.current).toBeDefined();
    });

    it('useCreate', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleResource.useCreate(),
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
        endpoint: CoolerArticleResource.useDelete(),
        fetch: useController().fetch,
      }));

      const res = await result.current.fetch(result.current.endpoint, {
        id: payload.id,
      });
      expect(res).toEqual({ id: 5 });
    });

    it('useUpdate', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleResource.useUpdate(),
        fetch: useController().fetch,
      }));

      const res = await result.current.fetch(result.current.endpoint, payload, {
        ...CoolerArticleResource.fromJS(payload),
      });
      expect(res).toEqual(putResponseBody);
    });

    it('usePartialUpdate', async () => {
      const { result } = renderRestHook(() => ({
        endpoint: CoolerArticleResource.usePartialUpdate(),
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
      class FetchResource extends CoolerArticleResource {
        static useFetchInit = jest.fn(a => a);
      }
      const articleDetail = FetchResource.useDetail();
      expect(articleDetail).toBeDefined();
      expect(FetchResource.useFetchInit.mock.calls.length).toBeGreaterThan(0);
    });

    it('should use getFetchInit if defined (upon fetch)', async () => {
      class FetchResource extends CoolerArticleResource {
        static useFetchInit = jest.fn(a => a);
        static getFetchInit = jest.fn(a => a);
      }
      const articleDetail = FetchResource.useDetail();
      expect(articleDetail).toBeDefined();
      expect(FetchResource.getFetchInit.mock.calls.length).toBe(0);

      const article = await articleDetail(payload);
      expect(article).toBeDefined();
      expect(FetchResource.getFetchInit.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
