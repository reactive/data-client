import { Article, PollingArticleResource } from '__tests__/new';

import { actionTypes, Controller, initialState } from '../..';
import { SubscribeAction, UnsubscribeAction } from '../../types';
import SubscriptionManager, { Subscription } from '../SubscriptionManager.js';

const { UNSUBSCRIBE, SUBSCRIBE, SET_RESPONSE } = actionTypes;

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

describe('SubscriptionManager', () => {
  class TestSubscription implements Subscription {
    add = jest.fn();
    remove = jest.fn(() => true);
    cleanup = jest.fn();
  }
  const manager = new SubscriptionManager(TestSubscription);
  const getState = () => initialState;

  describe('middleware', () => {
    it('should return the same value every call', () => {
      const a = manager.middleware;
      expect(a).toBe(manager.middleware);
    });
  });

  describe('cleanup()', () => {
    it('should cleanup all Subcription members', () => {
      const sub = new TestSubscription();
      (manager as any).subscriptions[
        PollingArticleResource.get.key({ id: 5 })
      ] = sub;
      manager.cleanup();
      expect(sub.cleanup.mock.calls.length).toBe(1);
    });
  });

  describe('middleware', () => {
    function createSubscribeAction(
      response: Record<string, any>,
      reject = false,
    ): SubscribeAction {
      const fetch =
        reject ?
          () => Promise.reject(new Error('Failed'))
        : () => Promise.resolve(response);
      return {
        type: SUBSCRIBE,
        endpoint: PollingArticleResource.get.extend({ fetch }),
        args: [{ id: response.id }],
        key: PollingArticleResource.get.key({ id: response.id }),
      };
    }
    function createUnsubscribeAction(
      response: Record<string, any>,
    ): UnsubscribeAction {
      return {
        type: UNSUBSCRIBE,
        endpoint: PollingArticleResource.get,
        key: PollingArticleResource.get.key({ id: response.id }),
        args: [{ id: response.id }],
      };
    }

    const manager = new SubscriptionManager(TestSubscription);
    const next = jest.fn();
    const dispatch = () => Promise.resolve();
    const controller = new Controller({ dispatch, getState });
    const API: Controller & { controller: Controller } = Object.create(
      controller,
      {
        controller: { value: controller },
      },
    );
    it('subscribe should add a subscription', () => {
      const action = createSubscribeAction({ id: 5 });
      manager.middleware(API)(next)(action);

      expect(next).not.toHaveBeenCalled();
      expect((manager as any).subscriptions[action.key]).toBeDefined();
    });
    it('subscribe should add a subscription (no frequency)', () => {
      const action = createSubscribeAction({ id: 597 });
      manager.middleware(API)(next)(action);

      expect(next).not.toHaveBeenCalled();
      expect((manager as any).subscriptions[action.key]).toBeDefined();
    });

    it('subscribe with same should call subscription.add', () => {
      const action = createSubscribeAction({ id: 5, title: 'four' });
      manager.middleware(API)(next)(action);

      expect(
        (manager as any).subscriptions[action.key].add.mock.calls.length,
      ).toBe(1);
      manager.middleware(API)(next)(action);
      expect(
        (manager as any).subscriptions[action.key].add.mock.calls.length,
      ).toBe(2);
    });
    it('subscribe with another should create another', () => {
      const action = createSubscribeAction({ id: 7, title: 'four cakes' });
      manager.middleware(API)(next)(action);

      expect((manager as any).subscriptions[action.key]).toBeDefined();
      expect(
        (manager as any).subscriptions[action.key].add.mock.calls.length,
      ).toBe(0);
    });
    it('subscribe with another should not call previous', () => {
      expect(
        (manager as any).subscriptions[
          PollingArticleResource.get.key({ id: 5 })
        ].add.mock.calls.length,
      ).toBe(2);
    });

    it('unsubscribe should delete when remove returns true', () => {
      const action = createUnsubscribeAction({ id: 7, title: 'four cakes' });
      (manager as any).subscriptions[action.key].remove.mockImplementation(
        () => true,
      );

      manager.middleware(API)(next)(action);

      expect((manager as any).subscriptions[action.key]).not.toBeDefined();
    });

    it('unsubscribe should delete when remove returns true (no frequency)', () => {
      manager.middleware(API)(next)(
        createSubscribeAction({ id: 50, title: 'four cakes' }),
      );

      const action = createUnsubscribeAction({ id: 50, title: 'four cakes' });
      (manager as any).subscriptions[action.key].remove.mockImplementation(
        () => true,
      );

      manager.middleware(API)(next)(action);

      expect((manager as any).subscriptions[action.key]).not.toBeDefined();
    });

    it('unsubscribe should not delete when remove returns false', () => {
      const action = createUnsubscribeAction({ id: 5, title: 'four cakes' });
      (manager as any).subscriptions[action.key].remove.mockImplementation(
        () => false,
      );

      manager.middleware(API)(next)(action);

      expect((manager as any).subscriptions[action.key]).toBeDefined();
      expect(
        (manager as any).subscriptions[action.key].remove.mock.calls.length,
      ).toBe(1);
    });

    it('unsubscribe should do nothing when there was no subscription already', () => {
      const oldError = console.error;
      const spy = (console.error = jest.fn());

      const action = createUnsubscribeAction({ id: 25 });

      manager.middleware(API)(next)(action);

      expect((manager as any).subscriptions[action.key]).not.toBeDefined();

      expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
        [
          "Mismatched unsubscribe: GET http://test.com/article/25 is not subscribed",
        ]
      `);
      console.error = oldError;
    });

    it('should let other actions pass through', () => {
      const action = { type: SET_RESPONSE };
      next.mockReset();

      manager.middleware(API)(next)(action as any);

      expect(next.mock.calls.length).toBe(1);
    });
  });
});
