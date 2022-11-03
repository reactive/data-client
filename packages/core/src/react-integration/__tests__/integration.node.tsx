import { CoolerArticleResource, CoolerArticleDetail } from '__tests__/new';
import nock from 'nock';
import { act } from '@testing-library/react-hooks';
// relative imports to avoid circular dependency in tsconfig references

import {
  makeRenderRestHook,
  makeExternalCacheProvider,
} from '../../../../test';
import { useCache, useSuspense } from '../newhooks';
import { useController } from '../hooks';
import {
  payload,
  createPayload,
  users,
  nested,
  paginatedFirstPage,
  paginatedSecondPage,
  valuesFixture,
  editorPayload,
} from '../test-fixtures';

describe('SSR', () => {
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
      .get(`/article-cooler/500`)
      .reply(500, { message: 'server failure' })
      .get(`/article-cooler/666`)
      .reply(200, '')
      .get(`/article-cooler`)
      .reply(200, nested)
      .get(`/article-cooler/values`)
      .reply(200, valuesFixture)
      .post(`/article-cooler`)
      .reply(200, createPayload)
      .get(`/user`)
      .reply(200, users)
      .get(`/article-cooler/withEditor`)
      .reply(200, editorPayload);

    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeExternalCacheProvider);
  });

  it('should update useCache()', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return [
        useCache(CoolerArticleDetail, { id: payload.id }),
        useController(),
      ] as const;
    });
    expect(result.current[0]).toBeUndefined();
    /* TODO: need react-18 compatible test engine
    await act(() => {
      result.current[1].fetch(CoolerArticleDetail, { id: payload.id });
    });
    expect(result.current[0]?.title).toBe(payload.title);
    // @ts-expect-error
    expect(result.current[0]?.lafsjlfd).toBeUndefined();
    */
  });

  it('should resolve useSuspense()', async () => {
    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useSuspense(CoolerArticleDetail, payload);
    });
    expect(result.current).toBeUndefined();
    /* TODO: need react-18 compatible test engine
    await waitForNextUpdate();
    expect(result.current.title).toBe(payload.title);
    // @ts-expect-error
    expect(result.current.lafsjlfd).toBeUndefined();*/
  });
});
