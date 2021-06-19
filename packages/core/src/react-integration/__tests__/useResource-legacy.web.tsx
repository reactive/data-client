import { CoolerArticleResource } from '__tests__/legacy';
import { ReadShape } from '@rest-hooks/core';
import nock from 'nock';

// relative imports to avoid circular dependency in tsconfig references
import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import { useResource } from '../hooks';
import { payload, users, nested } from '../test-fixtures';

describe('useResource()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

  async function testMalformedResponse(
    payload: any,
    fetchShape: ReadShape<any> = CoolerArticleResource.detailShape(),
  ) {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
      })
      .get(`/article-cooler/400`)
      .reply(200, payload);
    const warnspy = jest.spyOn(global.console, 'warn');

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useResource(fetchShape, {
        id: 400,
      });
    });
    expect(result.current).toBeUndefined();
    await waitForNextUpdate();
    expect(warnspy).toHaveBeenCalled();
    expect(warnspy.mock.calls).toMatchSnapshot();

    warnspy.mockRestore();
  }

  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Access-Token',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article-cooler/${payload.id}`)
      .reply(200, payload)
      .get(`/article-time/${payload.id}`)
      .reply(200, { ...payload, createdAt: '2020-06-07T02:00:15+0000' })
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

  it('should throw error when response is array when expecting entity', async () => {
    await testMalformedResponse([]);
  });

  it('should throw error when response is {} when expecting entity', async () => {
    await testMalformedResponse({});
  });

  it('should throw error when response is number when expecting entity', async () => {
    await testMalformedResponse(5);
  });

  it('should throw error when response is string when expecting entity', async () => {
    await testMalformedResponse('hi');
  });
});
