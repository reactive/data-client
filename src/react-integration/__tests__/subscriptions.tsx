import React, { Suspense } from 'react';
import { cleanup, renderHook, act } from 'react-hooks-testing-library';

import nock from 'nock';

import {
  PollingArticleResource,
} from '../../__tests__/common';
import { useSubscription, useCache } from '../hooks';
import RestProvider from '../provider';
import NetworkManager from '../../state/NetworkManager';
import SubscriptionManager from '../../state/SubscriptionManager';
import PollingSubscription from '../../state/PollingSubscription';
import { FetchAction, ReceiveAction } from '../../types';

class MockNetworkManager extends NetworkManager {
  handleFetch(action: FetchAction, dispatch: React.Dispatch<any>) {
    const mockDispatch: typeof dispatch = (v: any) => {
      act(() => {
        dispatch(v);
      });
    };
    return super.handleFetch(action, mockDispatch);
  }
  handleReceive(action: ReceiveAction) {
    act(() => {
      super.handleReceive(action);
    });
  }
}
class MockPollingSubscription extends PollingSubscription {
  update() {
    act(() => {
      super.update();
    });
  }
}

afterEach(cleanup);

describe('<RestProvider /> with subscriptions', () => {
  const articlePayload = {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
  };

  // TODO: add nested resource test case that has multiple partials to test merge functionality
  let manager: NetworkManager;
  let subManager: SubscriptionManager<typeof MockPollingSubscription>;
  function testProvider<T>(callback: () => T) {
    return renderHook(callback, {
      wrapper: ({ children }) => (
        <RestProvider manager={manager} subscriptionManager={subManager}>
          <Suspense fallback={() => null}>{children}</Suspense>
        </RestProvider>
      ),
    });
  }

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
    manager = new MockNetworkManager();
    subManager = new SubscriptionManager(MockPollingSubscription);
  });
  afterEach(() => {
    manager.cleanup();
    subManager.cleanup();
  });

  it('useSubscription() + useCache()', async () => {
    jest.useFakeTimers();
    const frequency: number = (PollingArticleResource.singleRequest()
      .options as any).pollFrequency;

    const { result, waitForNextUpdate } = testProvider(() => {
      useSubscription(PollingArticleResource.singleRequest(), articlePayload);
      return useCache(
        PollingArticleResource.singleRequest(),
        articlePayload,
      );
    });

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
  });
});
