import {
  CoolerArticleResource,
  InvalidIfStaleArticleResource,
  PaginatedArticleResource,
} from '__tests__/legacy-3';
import { CoolerArticleResource as LegacyArticle } from '__tests__/legacy';
import { makeRenderRestHook, makeCacheProvider } from '@rest-hooks/test';
import nock from 'nock';

import { payload, payload2, users, nested } from './fixtures';
import useStatefulResource from '../useStatefulResource';

function onError(e: any) {
  e.preventDefault();
}
beforeAll(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterAll(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

describe('useStatefulResource()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

  beforeAll(() => {
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
      .get(`/article-cooler/${payload2.id}`)
      .reply(200, payload2)
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
      .get(/article-cooler\/.*/)
      .reply(404, 'not found')
      .put(/article-cooler\/[^5].*/)
      .reply(404, 'not found')
      .get(`/user/`)
      .reply(200, users);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should work on good network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detail(), {
        id: payload.id,
      });
    });
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(undefined);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(CoolerArticleResource.fromJS(payload));
  });

  it('should work on good network (legacy fetchshape)', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useStatefulResource(LegacyArticle.detailShape(), {
        id: payload.id,
      });
    });
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(undefined);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(LegacyArticle.fromJS(payload));
  });

  it('should return errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detail(), {
        title: '0',
      });
    });
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(undefined);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect((result.current.error as any).status).toBe(403);
  });

  it('should pass with exact params', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detail(), {
        id: payload.id,
      });
    });
    expect(result.current.data).toBeUndefined();
    await waitForNextUpdate();
    // type discrimination forces it to be resolved
    if (!result.current.loading && result.current.error === undefined) {
      expect(result.current.data.title).toBe(payload.title);
      // @ts-expect-error ensure this isn't "any"
      result.current.data.doesnotexist;
    }
  });

  it('should fetch anew with param changes', async () => {
    const { result, waitForNextUpdate, rerender } = renderRestHook(
      ({ id }: { id: number }) => {
        return useStatefulResource(CoolerArticleResource.detail(), {
          id,
        });
      },
      { initialProps: { id: payload.id } },
    );
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(undefined);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(CoolerArticleResource.fromJS(payload));
    await rerender({ id: payload2.id });
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(undefined);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(CoolerArticleResource.fromJS(payload2));
  });

  it('should not be loading with null params to useStatefulResource()', () => {
    const { result } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detail(), null);
    });
    expect(result.current.loading).toBe(false);
  });

  it('should maintain schema structure even with null params', () => {
    const { result } = renderRestHook(() => {
      return useStatefulResource(PaginatedArticleResource.listShape(), null);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data.results).toBeUndefined();
    expect(result.current.data.nextPage).toBe('');
    // ensure this isn't 'any'
    // @ts-expect-error
    const a: PaginatedArticleResource[] = result.current.data.results;
  });

  it('should not select when results are stale and invalidIfStale is true', async () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 999999999);
    const { result, rerender, waitForNextUpdate } = renderRestHook(
      props => {
        return useStatefulResource(
          InvalidIfStaleArticleResource.detail(),
          props,
        );
      },
      { initialProps: { id: payload.id } as any },
    );

    await waitForNextUpdate();
    expect(result.current.data).toBeDefined();
    Date.now = jest.fn(() => 999999999 * 3);

    rerender(null);
    expect(result.current.data).toBeUndefined();
    rerender({ id: payload.id });
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.data).toBeDefined();
    expect(result.current.loading).toBe(false);

    global.Date.now = realDate;
  });
});
