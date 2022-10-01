import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import nock from 'nock';
import {
  PollingArticleResource,
  ArticleResource,
  Article,
  UserResource,
} from '__tests__/new';
import { DenormalizeNullable } from 'packages/rest/src';

import {
  makeCacheProvider,
  makeExternalCacheProvider,
  makeRenderRestHook,
} from '../../../../test';
import { useSubscription, useCache } from '../hooks';
import { DispatchContext, ControllerContext } from '../context';
import Controller from '../../controller/Controller';

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

  it('useSubscription() + useCache()', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();

    const { result, waitForNextUpdate, rerender } = renderRestHook(
      ({ active }) => {
        useSubscription(
          PollingArticleResource.get,
          active ? { id: articlePayload.id } : null,
        );
        return useCache(PollingArticleResource.get, { id: articlePayload.id });
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

  it('should console.error() with no frequency specified', async () => {
    const oldError = console.error;
    const spy = (console.error = jest.fn());

    const { result, waitForNextUpdate } = renderRestHook(() => {
      useSubscription(ArticleResource.get, { id: articlePayload.id });
    });
    expect(result.error).toBeUndefined();
    expect(spy.mock.calls[0]).toMatchSnapshot();

    console.error = oldError;
  });

  it('useSubscription() without active arg', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();
    expect(PollingArticleResource.get.pollFrequency).toBeDefined();
    expect(PollingArticleResource.anotherGet?.pollFrequency).toBeDefined();

    const { result, waitForNextUpdate } = renderRestHook(() => {
      useSubscription(PollingArticleResource.get, { id: articlePayload.id });
      return useCache(PollingArticleResource.get, { id: articlePayload.id });
    });

    await validateSubscription(
      result,
      frequency,
      waitForNextUpdate,
      articlePayload,
    );
    jest.useRealTimers();
  });

  it('useSubscription() should dispatch rest-hooks/subscribe only once even with rerender', () => {
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
  });
});

it('useSubscription() should include extra options in dispatched meta', () => {
  const fakeDispatch = jest.fn();
  const controller = new Controller({ dispatch: fakeDispatch });

  renderHook(
    () => {
      useSubscription(PollingArticleResource.pusher, { id: 5 });
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

  const spy = fakeDispatch.mock.calls[0][0];
  expect(spy.meta.options.extra.eventType).toEqual(
    'PollingArticleResource:fetch',
  );
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
