import React, { Suspense } from 'react';
import { cleanup, render, act, testHook } from 'react-testing-library';
import nock from 'nock';

import {
  ArticleResource,
  PollingArticleResource,
} from '../../__tests__/common';
import { useResource, useSubscription, useCache } from '../hooks';
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
  function testProvider(callback: () => void, fbmock: jest.Mock<any, any>) {
    function Fallback() {
      fbmock();
      return null;
    }
    return testHook(callback, {
      wrapper: ({ children }) => (
        <RestProvider manager={manager} subscriptionManager={subManager}>
          <Suspense fallback={<Fallback />}>{children}</Suspense>
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
    const url = PollingArticleResource.url(articlePayload);
    const fbmock = jest.fn();
    const frequency: number = (PollingArticleResource.singleRequest()
      .options as any).pollFrequency;
    let article: PollingArticleResource | null | void = undefined;

    testProvider(() => {
      useSubscription(PollingArticleResource.singleRequest(), articlePayload);
      article = useCache(
        PollingArticleResource.singleRequest(),
        articlePayload,
      );
    }, fbmock);

    // should be null to start
    expect(article).toBeDefined();
    expect(article).toBeNull();
    // should be defined after frequency milliseconds
    jest.advanceTimersByTime(frequency);
    await (manager as any).fetched[url];
    expect(article).toBeInstanceOf(PollingArticleResource);
    expect(article).toEqual(PollingArticleResource.fromJS(articlePayload));
    // should update again after frequency
    nock('http://test.com')
      .get(`/article/${articlePayload.id}`)
      .reply(200, { ...articlePayload, title: 'fiver' });
    jest.advanceTimersByTime(frequency);
    await (manager as any).fetched[url];
    expect((article as any).title).toBe('fiver');
  });
});
