import { actionTypes, Controller } from '@data-client/core';
import { CacheProvider, useCache } from '@data-client/react';
import { DataProvider as ExternalDataProvider } from '@data-client/react/redux';
import { renderHook } from '@testing-library/react-native';
import {
  PollingArticleResource,
  ArticleResource,
  Article,
} from '__tests__/new';

import { makeRenderDataClient } from '../../../../test';
import { ControllerContext } from '../../context';
import useSubscription from '../useSubscription';

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
    responseMock: jest.Mock,
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
    responseMock.mockReturnValue({ ...articlePayload, title: 'fiver' });

    jest.advanceTimersByTime(frequency);

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
    renderDataClient = makeRenderDataClient(makeProvider);
  });
  afterEach(() => {
    renderDataClient.cleanup();
    jest.useRealTimers();
  });

  it('useSubscription() + useCache()', async () => {
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();

    const responseMock = jest.fn(({ id }) => articlePayload);

    const { result, rerender, waitFor } = renderDataClient(
      ({ active }) => {
        useSubscription(
          PollingArticleResource.get,
          active ? { id: articlePayload.id } : null,
        );
        return useCache(PollingArticleResource.get, { id: articlePayload.id });
      },
      {
        initialProps: { active: true },
        resolverFixtures: [
          {
            endpoint: PollingArticleResource.get,
            response: responseMock,
          },
        ],
      },
    );

    await validateSubscription(
      result,
      frequency,
      articlePayload,
      responseMock,
      waitFor,
    );
    // should not update if active is false
    responseMock.mockReturnValue({ ...articlePayload, title: 'sixer' });

    rerender({ active: false });
    jest.advanceTimersByTime(frequency);
    expect((result.current as any).title).toBe('fiver');

    // errors should not fail when data already exists
    responseMock.mockImplementation(({ id }) => {
      const error: any = new Error('you fail');
      error.status = 403;
      throw error;
    });
    const fetchCount = responseMock.mock.calls.length;
    rerender({ active: true });
    jest.advanceTimersByTime(frequency);
    await waitFor(() =>
      expect(responseMock.mock.calls.length > fetchCount).toBeTruthy(),
    );
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
    jest.useFakeTimers();
    const frequency = PollingArticleResource.get.pollFrequency as number;
    expect(frequency).toBeDefined();
    expect(PollingArticleResource.anotherGet.pollFrequency).toBeDefined();

    const responseMock = jest.fn(({ id }) => articlePayload);

    const { result, waitFor } = renderDataClient(
      () => {
        useSubscription(PollingArticleResource.get, { id: articlePayload.id });
        return useCache(PollingArticleResource.get, { id: articlePayload.id });
      },
      {
        resolverFixtures: [
          {
            endpoint: PollingArticleResource.get,
            response: responseMock,
          },
        ],
      },
    );

    await validateSubscription(
      result,
      frequency,
      articlePayload,
      responseMock,
      waitFor,
    );
    await renderDataClient.allSettled();
    jest.useRealTimers();
  });

  it('useSubscription() should dispatch data-client/subscribe only once even with rerender', async () => {
    const fakeDispatch = jest.fn();
    const controller = new Controller({ dispatch: fakeDispatch });

    const { rerender } = renderHook(
      () => {
        useSubscription(PollingArticleResource.getList, { id: 5 });
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
      rerender({});
    }
    expect(fakeDispatch.mock.calls.length).toBe(1);
    await renderDataClient.allSettled();
  });

  it('useSubscription() should unsubscribe with null arguments', async () => {
    const fakeDispatch = jest.fn();
    const controller = new Controller({ dispatch: fakeDispatch });

    const { rerender } = renderHook(
      ({ id }: { id: number | null }) => {
        useSubscription(PollingArticleResource.getList, id ? { id } : null);
      },
      {
        initialProps: { id: 5 } as { id: number | null },
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
    for (let i = 0; i < 3; ++i) {
      rerender({ id: null });
    }
    expect(fakeDispatch.mock.calls.length).toBe(2);
    expect(fakeDispatch.mock.calls[0][0].type).toBe(actionTypes.SUBSCRIBE);
    expect(fakeDispatch.mock.calls[1][0].type).toBe(actionTypes.UNSUBSCRIBE);
    expect(fakeDispatch.mock.calls[1][0].key).toBe(
      fakeDispatch.mock.calls[0][0].key,
    );
    await renderDataClient.allSettled();
  });
});
