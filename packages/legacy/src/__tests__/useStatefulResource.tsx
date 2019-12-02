import nock from 'nock';

import { CoolerArticleResource } from '__tests__/common';
import { useStatefulResource } from '..';
import { makeRenderRestHook, makeCacheProvider } from '@rest-hooks/test';
import { payload, users, nested } from './fixtures';

function onError(e: any) {
  e.preventDefault();
}
beforeAll(() => {
  globalThis.addEventListener('error', onError);
});
afterAll(() => {
  globalThis.removeEventListener('error', onError);
});

describe('useStatefulResource()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
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
      .reply(200, nested);
    nock('http://test.com')
      .get(`/user/`)
      .reply(200, users);
  });
  afterEach(() => {
    nock.cleanAll();
    renderRestHook.cleanup();
  });

  it('should work on good network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detailShape(), {
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

  /* TODO: figure out why this fails test suite even tho the expects all pass. maybe has to do with console.error?
  it('should return errors on bad network', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detailShape(), {
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
  });*/

  it('should not be loading with no params to useResource()', () => {
    const { result } = renderRestHook(() => {
      return useStatefulResource(CoolerArticleResource.detailShape(), null);
    });
    expect(result.current.loading).toBe(false);
  });
});
