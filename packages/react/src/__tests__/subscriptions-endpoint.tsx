import { Controller } from '@data-client/core';
import { CacheProvider } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import {
  PollingArticleResource,
  ArticleResource,
  Article,
} from '__tests__/new';
import nock from 'nock';

import { act, makeRenderDataClient, renderHook } from '../../../test';
import { ControllerContext } from '../context';
import { useSubscription, useCache } from '../hooks';

function jsonNock() {
  return nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
}

describe.each([
  ['CacheProvider', CacheProvider],
  ['ExternalDataProvider', ExternalDataProvider],
] as const)(`%s with subscriptions`, (_, makeProvider) => {
  const articlePayload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;

  async function validateSubscription(
    result: {
      readonly current: Article | undefined;
      readonly error?: Error;
    },
    frequency: number,
    articlePayload: {
      id: number;
      title: string;
      content: string;
      tags: string[];
    },
    waitFor: <T>(callback: () => Promise<T> | T, options?: any) => Promise<T>,
  ) {
    // should be null to start
    expect(result.current).toBeUndefined();
    // should be defined after frequency milliseconds
    jest.advanceTimersByTime(frequency);
    await renderDataClient.allSettled();

    await waitFor(() => expect(result.current).not.toBeUndefined());
    expect(result.current).toBeInstanceOf(Article);
    expect(result.current).toEqual(Article.fromJS(articlePayload));
    // should update again after frequency
    const fiverNock = jsonNock()
      .get(`/article/${articlePayload.id}`)
      .reply(200, { ...articlePayload, title: 'fiver' });

    jest.advanceTimersByTime(frequency);

    await waitFor(() => expect(fiverNock.isDone()).toBeTruthy());
    await renderDataClient.allSettled();
    await waitFor(() => expect((result.current as any).title).toBe('fiver'));
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

    jsonNock()
      .get(`/article-cooler/${articlePayload.id}`)
      .reply(200, articlePayload)
      .get(`/article/${articlePayload.id}`)
      .reply(200, articlePayload);
    renderDataClient = makeRenderDataClient(makeProvider);
  });
  afterEach(() => {
    renderDataClient.cleanup();
    nock.cleanAll();
    jest.useRealTimers();
  });

  it('useSubscription() + useCache()', async () => {
    jest.useFakeTimers({
      // nock doesn't like modern timers for some reason
      legacyFakeTimers: true,
    });
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();

    const { result, rerender, waitFor } = renderDataClient(
      ({ active }) => {
        useSubscription(
          PollingArticleResource.get,
          active ? { id: articlePayload.id } : null,
        );
        return useCache(PollingArticleResource.get, { id: articlePayload.id });
      },
      { initialProps: { active: true } },
    );
    await validateSubscription(result, frequency, articlePayload, waitFor);

    // should not update if active is false
    rerender({ active: false });
    jsonNock()
      .get(`/article/${articlePayload.id}`)
      .reply(200, { ...articlePayload, title: 'sixer' });
    jest.advanceTimersByTime(frequency);
    expect((result.current as any).title).toBe('fiver');

    // errors should not fail when data already exists
    nock.cleanAll();
    const lastCall = jsonNock()
      .get(`/article/${articlePayload.id}`)
      .reply(403, () => {
        return { message: 'you fail' };
      });
    rerender({ active: true });
    jest.advanceTimersByTime(frequency);
    await waitFor(() => expect(lastCall.isDone()).toBeTruthy());
    act(() => {
      jest.runOnlyPendingTimers();
    });
    // must be called before real timers or clearInterval won't work properly
    renderDataClient.cleanup();
    jest.useRealTimers();
    await renderDataClient.allSettled();

    expect((result.current as any).title).toBe('fiver');
  });

  it('should console.error() with no frequency specified', async () => {
    const oldError = console.error;
    const spy = (console.error = jest.fn());

    const { result } = renderDataClient(() => {
      useSubscription(ArticleResource.get, { id: articlePayload.id });
    });
    expect(result.error).toBeUndefined();
    expect(spy.mock.calls[0]).toMatchSnapshot();

    console.error = oldError;
    await renderDataClient.allSettled();
  });

  it('useSubscription() without active arg', async () => {
    jest.useFakeTimers({
      // nock doesn't like modern timers for some reason
      legacyFakeTimers: true,
    });
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();
    expect(PollingArticleResource.get.pollFrequency).toBeDefined();
    expect(PollingArticleResource.anotherGet?.pollFrequency).toBeDefined();

    const { result, waitFor } = renderDataClient(() => {
      useSubscription(PollingArticleResource.get, { id: articlePayload.id });
      return useCache(PollingArticleResource.get, { id: articlePayload.id });
    });

    await validateSubscription(result, frequency, articlePayload, waitFor);
    // must be called before real timers or clearInterval won't work properly
    renderDataClient.cleanup();
    jest.useRealTimers();
    await renderDataClient.allSettled();
  });

  it('useSubscription() should dispatch data-client/subscribe only once even with rerender', async () => {
    const fakeDispatch = jest.fn();
    const controller = new Controller({ dispatch: fakeDispatch });

    const { rerender } = renderHook(
      () => {
        useSubscription(PollingArticleResource.get, { id: 5 });
      },
      {
        wrapper: function Wrapper({ children }: any) {
          return (
            <ControllerContext.Provider value={controller}>
              {children}
            </ControllerContext.Provider>
          );
        },
      },
    );
    expect(fakeDispatch.mock.calls.length).toBe(1);
    for (let i = 0; i < 2; ++i) {
      rerender();
    }
    expect(fakeDispatch.mock.calls.length).toBe(1);
    await renderDataClient.allSettled();
  });
});
