import SubscriptionManager, { Subscription } from '../SubscriptionManager';
import { SubscribeAction, UnsubscribeAction } from '../../types';
import { PollingArticleResource } from '../../__tests__/common';

function onError(e: any) {
  e.preventDefault();
}
beforeAll(() => {
  window.addEventListener('error', onError);
});
afterAll(() => {
  window.removeEventListener('error', onError);
});

describe('SubscriptionManager', () => {
  class TestSubscription implements Subscription {
    add = jest.fn();
    remove = jest.fn(() => true);
    cleanup = jest.fn();
  }
  const manager = new SubscriptionManager(TestSubscription);
  const getState = () => {};

  describe('getMiddleware()', () => {
    it('should return the same value every call', () => {
      const a = manager.getMiddleware();
      expect(a).toBe(manager.getMiddleware());
      expect(a).toBe(manager.getMiddleware());
    });
  });

  describe('cleanup()', () => {
    it('should cleanup all Subcription members', () => {
      const sub = new TestSubscription();
      (manager as any).subscriptions[
        PollingArticleResource.url({ id: 5 })
      ] = sub;
      manager.cleanup();
      expect(sub.cleanup.mock.calls.length).toBe(1);
    });
  });

  describe('middleware', () => {
    function createSubscribeAction(
      payload: {},
      reject = false,
    ): SubscribeAction {
      const fetch = reject
        ? () => Promise.reject(new Error('Failed'))
        : () => Promise.resolve(payload);
      return {
        type: 'rest-hooks/subscribe',
        meta: {
          schema: PollingArticleResource.getEntitySchema(),
          url: PollingArticleResource.url(payload),
          fetch,
          frequency: 1000,
        },
      };
    }
    function createUnsubscribeAction(payload: {}): UnsubscribeAction {
      return {
        type: 'rest-hooks/unsubscribe',
        meta: {
          url: PollingArticleResource.url(payload),
          frequency: 1000,
        },
      };
    }

    const manager = new SubscriptionManager(TestSubscription);
    const middleware = manager.getMiddleware();
    const next = jest.fn();
    const dispatch = () => Promise.resolve();

    it('subscribe should add a subscription', () => {
      const action = createSubscribeAction({ id: 5 });
      middleware({ dispatch, getState })(next)(action);

      expect(next).not.toHaveBeenCalled();
      expect((manager as any).subscriptions[action.meta.url]).toBeDefined();
    });
    it('subscribe with same should call subscription.add', () => {
      const action = createSubscribeAction({ id: 5, title: 'four' });
      middleware({ dispatch, getState })(next)(action);

      expect(
        (manager as any).subscriptions[action.meta.url].add.mock.calls.length,
      ).toBe(1);
      middleware({ dispatch, getState })(next)(action);
      expect(
        (manager as any).subscriptions[action.meta.url].add.mock.calls.length,
      ).toBe(2);
    });
    it('subscribe with another should create another', () => {
      const action = createSubscribeAction({ id: 7, title: 'four cakes' });
      middleware({ dispatch, getState })(next)(action);

      expect((manager as any).subscriptions[action.meta.url]).toBeDefined();
      expect(
        (manager as any).subscriptions[action.meta.url].add.mock.calls.length,
      ).toBe(0);
    });
    it('subscribe with another should not call previous', () => {
      expect(
        (manager as any).subscriptions[PollingArticleResource.url({ id: 5 })]
          .add.mock.calls.length,
      ).toBe(2);
    });

    it('unsubscribe should delete when remove returns true', () => {
      const action = createUnsubscribeAction({ id: 7, title: 'four cakes' });
      (manager as any).subscriptions[action.meta.url].remove.mockImplementation(
        () => true,
      );

      middleware({ dispatch, getState })(next)(action);

      expect((manager as any).subscriptions[action.meta.url]).not.toBeDefined();
    });

    it('unsubscribe should not delete when remove returns false', () => {
      const action = createUnsubscribeAction({ id: 5, title: 'four cakes' });
      (manager as any).subscriptions[action.meta.url].remove.mockImplementation(
        () => false,
      );

      middleware({ dispatch, getState })(next)(action);

      expect((manager as any).subscriptions[action.meta.url]).toBeDefined();
      expect(
        (manager as any).subscriptions[action.meta.url].remove.mock.calls
          .length,
      ).toBe(1);
    });

    it('unsubscribe should do nothing when there was no subscription already', () => {
      const oldError = console.error;
      const spy = (console.error = jest.fn());

      const action = createUnsubscribeAction({ id: 25 });

      middleware({ dispatch, getState })(next)(action);

      expect((manager as any).subscriptions[action.meta.url]).not.toBeDefined();

      expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          "Mismatched unsubscribe: http://test.com/article/25 is not subscribed",
        ]
      `);
      console.error = oldError;
    });

    it('should let other actions pass through', () => {
      const action = { type: 'rest-hooks/receive' };
      next.mockReset();

      middleware({ dispatch, getState })(next)(action as any);

      expect(next.mock.calls.length).toBe(1);
    });
  });
});
