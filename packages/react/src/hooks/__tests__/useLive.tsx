import makeCacheProvider from '@rest-hooks/react/makeCacheProvider';
import makeExternalCacheProvider from '@rest-hooks/redux/makeCacheProvider';
import {
  PollingArticleResource,
  ArticleResource,
  Article,
} from '__tests__/new';
import nock from 'nock';

import { makeRenderRestHook } from '../../../../test';
import useLive from '../useLive';

let mynock: nock.Scope;

describe.each([
  ['CacheProvider', makeCacheProvider],
  ['ExternalCacheProvider', makeExternalCacheProvider],
] as const)(`%s with subscriptions`, (_, makeProvider) => {
  const articlePayload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

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

  beforeAll(() => {
    ArticleResource.get.pollFrequency;
    PollingArticleResource.get.pollFrequency;
  });

  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200);
    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
    mynock
      .get(`/article-cooler/${articlePayload.id}`)
      .reply(200, articlePayload)
      .get(`/article/${articlePayload.id}`)
      .reply(200, articlePayload);
    renderRestHook = makeRenderRestHook(makeProvider);
  });
  afterEach(() => {
    nock.cleanAll();
  });

  it('useLive()', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();

    const { result, waitForNextUpdate, rerender } = renderRestHook(
      ({ active }) => {
        return useLive(PollingArticleResource.get, { id: articlePayload.id });
      },
      { initialProps: { active: true } },
    );

    await validateSubscription(
      result,
      frequency,
      waitForNextUpdate,
      articlePayload,
    );

    // should not update if active is false
    rerender({ active: false });
    mynock
      .get(`/article/${articlePayload.id}`)
      .reply(200, { ...articlePayload, title: 'sixer' });
    jest.advanceTimersByTime(frequency);
    expect((result.current as any).title).toBe('fiver');

    // errors should not fail when data already exists
    nock.cleanAll();
    mynock.get(`/article/${articlePayload.id}`).reply(403, () => {
      return { message: 'you fail' };
    });
    rerender({ active: true });
    jest.advanceTimersByTime(frequency);
    expect((result.current as any).title).toBe('fiver');
    jest.useRealTimers();
  });

  it('useSubscription() without active arg', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();
    expect(PollingArticleResource.anotherGet.pollFrequency).toBeDefined();

    const { result, waitForNextUpdate } = renderRestHook(() => {
      return useLive(PollingArticleResource.get, { id: articlePayload.id });
    });

    await validateSubscription(
      result,
      frequency,
      waitForNextUpdate,
      articlePayload,
    );
    jest.useRealTimers();
  });
});

async function validateSubscription(
  result: {
    readonly current: Article | undefined;
    readonly error?: Error;
  },
  frequency: number,
  waitForNextUpdate: () => Promise<void>,
  articlePayload: {
    id: number;
    title: string;
    content: string;
    tags: string[];
  },
) {
  // should be null to start
  expect(result.current).toBeUndefined();
  // should be defined after frequency milliseconds
  jest.advanceTimersByTime(frequency);
  await waitForNextUpdate();
  expect(result.current).toBeInstanceOf(Article);
  expect(result.current).toEqual(Article.fromJS(articlePayload));
  // should update again after frequency
  mynock
    .get(`/article/${articlePayload.id}`)
    .reply(200, { ...articlePayload, title: 'fiver' });
  jest.advanceTimersByTime(frequency);
  await waitForNextUpdate();
  expect((result.current as any).title).toBe('fiver');
}
