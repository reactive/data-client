import {
  CoolerArticleResource,
  InvalidIfStaleArticleResource,
} from '__tests__/common';
import { makeRenderRestHook, makeCacheProvider } from '@rest-hooks/test';
import nock from 'nock';

import { payload, users, nested } from './fixtures';
import { useStatefulResource } from '..';

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
      .get(`/user/`)
      .reply(200, users);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  afterEach(() => {
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

  it('should not select when results are stale and invalidIfStale is true', async () => {
    const realDate = global.Date.now;
    Date.now = jest.fn(() => 999999999);
    const { result, rerender, waitForNextUpdate } = renderRestHook(
      props => {
        return useStatefulResource(
          InvalidIfStaleArticleResource.detailShape(),
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
