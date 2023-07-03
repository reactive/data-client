import { Endpoint } from '@data-client/endpoint';
import { Article, PollingArticleResource } from '__tests__/new';

import Controller from '../../controller/Controller';
import { createSubscription } from '../../controller/createSubscription';
import { initialState } from '../../state/reducer/createReducer';
import ConnectionListener from '../ConnectionListener';
import DefaultConnectionListener from '../DefaultConnectionListener';
import PollingSubscription from '../PollingSubscription';

class MockConnectionListener implements ConnectionListener {
  declare online: boolean;
  declare onlineHandlers: (() => void)[];
  declare offlineHandlers: (() => void)[];

  constructor(online: boolean) {
    this.online = online;
    this.onlineHandlers = [];
    this.offlineHandlers = [];
  }

  isOnline() {
    return this.online;
  }

  addOnlineListener(handler: () => void) {
    this.onlineHandlers.push(handler);
  }

  removeOnlineListener(handler: () => void) {
    this.onlineHandlers = this.onlineHandlers.filter(h => h !== handler);
  }

  addOfflineListener(handler: () => void) {
    this.offlineHandlers.push(handler);
  }

  removeOfflineListener(handler: () => void) {
    this.offlineHandlers = this.offlineHandlers.filter(h => h !== handler);
  }

  trigger(event: 'offline' | 'online') {
    switch (event) {
      case 'offline':
        this.online = false;
        this.offlineHandlers.forEach(t => t());
        break;
      case 'online':
        this.online = true;
        this.onlineHandlers.forEach(t => t());
        break;
    }
  }

  reset() {
    this.offlineHandlers = [];
    this.onlineHandlers = [];
  }
}

const makeState = (key: string, time: number) => () => ({
  ...initialState,
  meta: { [key]: { date: time, expiresAt: Infinity } },
});

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

describe('PollingSubscription', () => {
  const a = () => Promise.resolve({ id: 5, title: 'hi' });
  const fetch = jest.fn(a);
  const endpoint = new Endpoint(fetch, {
    schema: Article,
    key: () => 'test.com',
    pollFrequency: 5000,
  });

  describe('existing data', () => {
    it('should wait to call for fresh data', () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });
      (controller as any).getState = makeState('test.com', Date.now());

      jest.useFakeTimers();
      const sub2 = new PollingSubscription(
        createSubscription(endpoint, { args: [] }),
        controller,
      );
      expect(dispatch.mock.calls.length).toBe(0);
      jest.advanceTimersByTime(4990);
      expect(dispatch.mock.calls.length).toBe(0);
      jest.advanceTimersByTime(20);
      expect(dispatch.mock.calls.length).toBe(1);
      jest.advanceTimersByTime(5000);
      expect(dispatch.mock.calls.length).toBe(2);
      jest.advanceTimersByTime(2000);
      expect(dispatch.mock.calls.length).toBe(2);
      sub2.cleanup();
      jest.useRealTimers();
    });

    it('should only run once with multiple simultaneous starts', () => {
      const dispatch = jest.fn();
      const controller = new Controller({ dispatch });
      (controller as any).getState = () => initialState;

      jest.useFakeTimers();
      const sub2 = new PollingSubscription(
        createSubscription(endpoint, { args: [] }),
        controller,
      );
      sub2.add(1000);
      sub2.add(1000);
      sub2.add(1000);
      jest.advanceTimersByTime(1);
      expect(dispatch.mock.calls.length).toBe(1);
      jest.advanceTimersByTime(999);
      expect(dispatch.mock.calls.length).toBe(2);
      jest.advanceTimersByTime(10);
      sub2.remove(1000);
      sub2.remove(1000);
      sub2.remove(1000);
      sub2.cleanup();
      jest.useRealTimers();
    });
  });

  describe('fresh data', () => {
    const dispatch = jest.fn();
    const controller = new Controller({ dispatch });
    (controller as any).getState = makeState('test.com', 0);
    let sub: PollingSubscription;

    beforeAll(() => {
      jest.useFakeTimers();
      sub = new PollingSubscription(
        createSubscription(endpoint, { args: [] }),
        controller,
      );
    });
    afterAll(() => {
      sub.cleanup();
      jest.useRealTimers();
    });

    it('should throw on undefined frequency in construction', () => {
      expect(
        () =>
          new PollingSubscription(
            createSubscription(
              new Endpoint(fetch, {
                schema: Article,
                key: () => 'test.com',
              }),
              { args: [] },
            ),
            controller,
          ),
      ).toThrow();
    });

    it('should call immediately', () => {
      jest.advanceTimersByTime(1);
      expect(dispatch.mock.calls.length).toBe(1);
    });

    it('should call after period', () => {
      dispatch.mockReset();
      jest.advanceTimersByTime(5000);
      expect(dispatch.mock.calls.length).toBe(1);
      dispatch.mock.calls[0].forEach((element: any) => {
        delete element?.meta?.createdAt;
      });
      expect(dispatch.mock.calls[0]).toMatchSnapshot();
      jest.advanceTimersByTime(5000);
      expect(dispatch.mock.calls.length).toBe(2);
      dispatch.mock.calls[1].forEach((element: any) => {
        delete element?.meta?.createdAt;
      });

      expect(dispatch.mock.calls[1]).toMatchSnapshot();
    });

    describe('add()', () => {
      it('should take smaller frequency when another is added', () => {
        sub.add(1000);
        jest.advanceTimersByTime(1000 * 4);
        expect(dispatch.mock.calls.length).toBe(2 + 4);
      });

      it('should not change frequency if same is added', () => {
        dispatch.mockClear();
        sub.add(1000);
        jest.advanceTimersByTime(1000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });

      it('should not change frequency if larger is added', () => {
        dispatch.mockClear();
        sub.add(7000);
        sub.add(8000);
        jest.advanceTimersByTime(1000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });

      it('should do nothing if frequency is undefined', () => {
        dispatch.mockClear();
        sub.add(undefined);
        jest.advanceTimersByTime(1000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });
    });

    describe('remove()', () => {
      it('should not change frequency if only partially removed', () => {
        dispatch.mockClear();
        sub.remove(1000);
        jest.advanceTimersByTime(1000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });

      it('should not change frequency if only larger removed', () => {
        dispatch.mockClear();
        sub.remove(7000);
        jest.advanceTimersByTime(1000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });

      it('should go back to fastest if smallest frequency is removed completely', () => {
        sub.remove(1000);
        jest.advanceTimersByTime(1000);
        dispatch.mockClear();
        jest.advanceTimersByTime(5000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });

      it('should do nothing if frequency is not registered', () => {
        const oldError = console.error;
        const spy = (console.error = jest.fn());

        sub.remove(1000);
        dispatch.mockClear();
        jest.advanceTimersByTime(5000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);

        expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
          [
            "Mismatched remove: 1000 is not subscribed for test.com",
          ]
        `);
        console.error = oldError;
      });

      it('should do nothing if frequency is undefined', () => {
        sub.remove(undefined);
        dispatch.mockClear();
        jest.advanceTimersByTime(5000 * 13);
        expect(dispatch.mock.calls.length).toBe(13);
      });

      it('should return false until completely empty, then return true', () => {
        const controller = new Controller({ dispatch });
        (controller as any).getState = makeState('test.com', 0);

        const sub = new PollingSubscription(
          createSubscription(endpoint, { args: [] }),
          controller,
        );
        sub.add(5000);
        sub.add(7000);
        expect(sub.remove(5000)).toBe(false);
        expect(sub.remove(5000)).toBe(false);
        expect(sub.remove(7000)).toBe(true);
      });
    });

    describe('cleanup()', () => {
      let warnSpy: jest.SpyInstance;
      afterEach(() => {
        warnSpy.mockRestore();
      });
      beforeEach(() => (warnSpy = jest.spyOn(console, 'warn')));

      it('should stop all timers', () => {
        dispatch.mockClear();
        sub.cleanup();
        jest.advanceTimersByTime(5000 * 13);
        expect(dispatch.mock.calls.length).toBe(0);
      });
      it('should be idempotent', () => {
        sub.cleanup();
      });
      it('should not run even if interval not cancelled', () => {
        const controller = new Controller({ dispatch });
        (controller as any).getState = makeState('test.com', 0);

        sub.cleanup();
        sub = new PollingSubscription(
          createSubscription(endpoint.extend({ key: () => 'test.com2' }), {
            args: [],
          }),
          controller,
        );
        sub.add(5000);
        jest.runOnlyPendingTimers();
        delete (sub as any).intervalId;
        jest.advanceTimersByTime(5000 * 13);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(warnSpy.mock.calls.length).toBe(13);
        expect(warnSpy.mock.calls[0]).toMatchSnapshot();
      });
    });
  });

  describe('offline support', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    function createMocks(listener: ConnectionListener) {
      const dispatch = jest.fn();
      const a = () => Promise.resolve({ id: 5, title: 'hi' });
      const fetch = jest.fn(a);
      const endpoint = new Endpoint(fetch, {
        schema: Article,
        key: () => 'test.com',
        pollFrequency: 5000,
      });
      const controller = new Controller({ dispatch });
      (controller as any).getState = makeState('test.com', 0);

      const pollingSubscription = new PollingSubscription(
        createSubscription(endpoint, {
          args: [],
        }),
        controller,
        listener,
      );
      jest.advanceTimersByTime(1);
      return { dispatch, fetch, pollingSubscription };
    }

    it('should not dispatch when offline', () => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      const listener = new DefaultConnectionListener();
      const offlineSpy = jest.spyOn(listener, 'addOfflineListener');
      const onlineSpy = jest.spyOn(listener, 'addOnlineListener');
      const { dispatch } = createMocks(listener);
      jest.advanceTimersByTime(50000);
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      expect(dispatch.mock.calls.length).toBe(0);
      expect(offlineSpy.mock.calls.length).toBe(0);
      expect(onlineSpy.mock.calls.length).toBe(1);
    });

    it('should not dispatch when onLine is undefined (default to true)', () => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(undefined as any);
      const listener = new DefaultConnectionListener();
      const offlineSpy = jest.spyOn(listener, 'addOfflineListener');
      const onlineSpy = jest.spyOn(listener, 'addOnlineListener');
      const { dispatch } = createMocks(listener);
      expect(dispatch.mock.calls.length).toBe(1);
      expect(offlineSpy.mock.calls.length).toBe(1);
      expect(onlineSpy.mock.calls.length).toBe(0);
    });

    it('should immediately start fetching when online', () => {
      const listener = new MockConnectionListener(false);
      const { dispatch } = createMocks(listener);
      expect(dispatch.mock.calls.length).toBe(0);

      listener.trigger('online');
      jest.advanceTimersByTime(1);
      expect(dispatch.mock.calls.length).toBe(1);
      jest.advanceTimersByTime(5000);
      expect(dispatch.mock.calls.length).toBe(2);
      expect(listener.offlineHandlers.length).toBe(1);
      expect(listener.onlineHandlers.length).toBe(0);
    });

    it('should not run when timeoutId is deleted after coming online', () => {
      const listener = new MockConnectionListener(false);
      const { dispatch, pollingSubscription } = createMocks(listener);
      expect(dispatch.mock.calls.length).toBe(0);

      listener.trigger('online');
      delete (pollingSubscription as any).startId;
      jest.advanceTimersByTime(1);
      expect(dispatch.mock.calls.length).toBe(0);
      jest.advanceTimersByTime(5000);
      expect(dispatch.mock.calls.length).toBe(0);
      expect(listener.offlineHandlers.length).toBe(1);
      expect(listener.onlineHandlers.length).toBe(0);
    });

    it('should stop dispatching when offline again', () => {
      const listener = new MockConnectionListener(true);
      const { dispatch } = createMocks(listener);
      expect(dispatch.mock.calls.length).toBe(1);

      listener.trigger('offline');
      jest.advanceTimersByTime(50000);
      expect(dispatch.mock.calls.length).toBe(1);
      expect(listener.offlineHandlers.length).toBe(0);
      expect(listener.onlineHandlers.length).toBe(1);
    });
  });
});
