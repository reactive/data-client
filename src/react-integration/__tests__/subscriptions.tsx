import React from 'react';
import { cleanup } from 'react-hooks-testing-library';
import { renderHook } from 'react-hooks-testing-library';

import nock from 'nock';

import { PollingArticleResource } from '../../__tests__/common';
import { useSubscription, useCache } from '../hooks';
import makeRenderRestHook from '../../test/makeRenderRestHook';
import {
  makeCacheProvider,
  makeExternalCacheProvider,
} from '../../test/providers';
import { DispatchContext } from '../context';

afterEach(cleanup);

for (const makeProvider of [makeCacheProvider, makeExternalCacheProvider]) {
  describe(`${makeProvider.name} with subscriptions`, () => {
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
      window.addEventListener('error', onError);
    });
    afterEach(() => {
      window.removeEventListener('error', onError);
    });

    beforeEach(() => {
      nock('http://test.com')
        .get(`/article/${articlePayload.id}`)
        .reply(200, articlePayload);
      renderRestHook = makeRenderRestHook(makeProvider);
    });
    afterEach(() => {
      nock.cleanAll();
      renderRestHook.cleanup();
    });

    it('useSubscription() + useCache()', async () => {
      jest.useFakeTimers();
      const frequency: number = (PollingArticleResource.singleRequest()
        .options as any).pollFrequency;
      let active = true;

      const { result, waitForNextUpdate, rerender } = renderRestHook(() => {
        useSubscription(
          PollingArticleResource.singleRequest(),
          articlePayload,
          undefined,
          active,
        );
        return useCache(PollingArticleResource.singleRequest(), articlePayload);
      });

      await validateSubscription(
        result,
        frequency,
        waitForNextUpdate,
        articlePayload,
      );

      // should not update if active is false
      active = false;
      rerender();
      nock('http://test.com')
        .get(`/article/${articlePayload.id}`)
        .reply(200, { ...articlePayload, title: 'sixer' });
      jest.advanceTimersByTime(frequency);
      expect((result.current as any).title).toBe('fiver');
    });

    it('useSubscription() without active arg', async () => {
      jest.useFakeTimers();
      const frequency: number = (PollingArticleResource.singleRequest()
        .options as any).pollFrequency;

      const { result, waitForNextUpdate } = renderRestHook(() => {
        useSubscription(PollingArticleResource.singleRequest(), articlePayload);
        return useCache(PollingArticleResource.singleRequest(), articlePayload);
      });

      await validateSubscription(
        result,
        frequency,
        waitForNextUpdate,
        articlePayload,
      );
    });

    it('useSubscription() should dispatch rest-hooks/subscribe only once even with rerender', async () => {
      const fakeDispatch = jest.fn();

      const { rerender } = renderHook(
        () => {
          useSubscription(PollingArticleResource.listRequest(), { id: 5 });
        },
        {
          wrapper: function Wrapper({ children }: any) {
            return (
              <DispatchContext.Provider value={fakeDispatch}>
                {children}
              </DispatchContext.Provider>
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
}

async function validateSubscription(
  result: {
    readonly current: PollingArticleResource | null;
    readonly error: Error;
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
  expect(result.current).toBeNull();
  // should be defined after frequency milliseconds
  jest.advanceTimersByTime(frequency);
  await waitForNextUpdate();
  expect(result.current).toBeInstanceOf(PollingArticleResource);
  expect(result.current).toEqual(PollingArticleResource.fromJS(articlePayload));
  // should update again after frequency
  nock('http://test.com')
    .get(`/article/${articlePayload.id}`)
    .reply(200, { ...articlePayload, title: 'fiver' });
  jest.advanceTimersByTime(frequency);
  await waitForNextUpdate();
  expect((result.current as any).title).toBe('fiver');
}
