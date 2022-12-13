import { ControllerContext, Controller } from '@rest-hooks/react';
import { CacheProvider } from '@rest-hooks/react';
import { CacheProvider as ExternalCacheProvider } from '@rest-hooks/redux';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { PollingArticleResource } from '__tests__/legacy-3';
import nock from 'nock';

// relative imports to avoid circular dependency in tsconfig references

import { useSubscription, useCache } from '..';
import { makeRenderRestHook } from '../../../../test';

let mynock: nock.Scope;

describe.each([
  ['CacheProvider', CacheProvider],
  ['ExternalCacheProvider', ExternalCacheProvider],
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
    nock(/.*/)
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
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
    const frequency: number = (
      PollingArticleResource.detailShape().options as any
    ).pollFrequency;
    let active = true;

    const { result, rerender } = renderRestHook(() => {
      useSubscription(
        PollingArticleResource.detailShape(),
        active ? articlePayload : null,
      );
      return useCache(PollingArticleResource.detailShape(), articlePayload);
    });

    await validateSubscription(result, frequency, articlePayload);

    // should not update if active is false
    active = false;
    rerender();
    mynock
      .get(`/article/${articlePayload.id}`)
      .reply(200, { ...articlePayload, title: 'sixer' });
    jest.advanceTimersByTime(frequency);
    expect((result.current as any).title).toBe('fiver');
    jest.useRealTimers();
  });

  it('useSubscription() without active arg', async () => {
    jest.useFakeTimers();
    const frequency: number = (
      PollingArticleResource.detailShape().options as any
    ).pollFrequency;

    const { result } = renderRestHook(() => {
      useSubscription(PollingArticleResource.detailShape(), articlePayload);
      return useCache(PollingArticleResource.detailShape(), articlePayload);
    });

    await validateSubscription(result, frequency, articlePayload);
    jest.useRealTimers();
  });

  it('useSubscription() should dispatch rest-hooks/subscribe only once even with rerender', () => {
    const fakeDispatch = jest.fn();
    const controller = new Controller({ dispatch: fakeDispatch });

    const { rerender } = renderHook(
      () => {
        useSubscription(PollingArticleResource.listShape(), { id: 5 });
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
      useSubscription(PollingArticleResource.pusherShape(), {});
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
    readonly current: PollingArticleResource | undefined;
    readonly error?: Error;
  },
  frequency: number,
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

  await waitFor(() => expect(result.current).not.toBeUndefined());
  expect(result.current).toBeInstanceOf(PollingArticleResource);
  expect(result.current).toEqual(PollingArticleResource.fromJS(articlePayload));
  // should update again after frequency
  const fiverNock = mynock
    .get(`/article/${articlePayload.id}`)
    .reply(200, { ...articlePayload, title: 'fiver' });
  jest.advanceTimersByTime(frequency);

  await waitFor(() => expect(fiverNock.isDone()).toBeTruthy());
  await waitFor(() => expect((result.current as any).title).toBe('fiver'));
}
