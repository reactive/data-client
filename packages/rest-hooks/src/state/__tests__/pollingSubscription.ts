import { PollingArticleResource } from '__tests__/common';

import PollingSubscription from '../PollingSubscription';
import { ConnectionListener } from '../ConnectionListener';

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

function onError(e: any) {
  e.preventDefault();
}
beforeAll(() => {
  window.addEventListener('error', onError);
});
afterAll(() => {
  window.removeEventListener('error', onError);
});

describe('PollingSubscription', () => {
  const dispatch = jest.fn();
  const a = () => Promise.resolve({ id: 5, title: 'hi' });
  const fetch = jest.fn(a);
  jest.useFakeTimers();

  const sub = new PollingSubscription(
    {
      url: 'test.com',
      schema: PollingArticleResource.getEntitySchema(),
      fetch,
      frequency: 5000,
    },
    dispatch,
  );

  afterAll(() => {
    sub.cleanup();
  });

  it('should throw on undefined frequency in construction', () => {
    expect(
      () =>
        new PollingSubscription(
          {
            url: 'test.com',
            schema: PollingArticleResource.getEntitySchema(),
            fetch,
          },
          dispatch,
        ),
    ).toThrow();
  });

  it('should call immediately', () => {
    expect(dispatch.mock.calls.length).toBe(1);
  });

  it('should call after period', () => {
    dispatch.mockReset();
    jest.advanceTimersByTime(5000);
    expect(dispatch.mock.calls.length).toBe(1);
    expect(dispatch.mock.calls[0]).toMatchSnapshot();
    jest.advanceTimersByTime(5000);
    expect(dispatch.mock.calls.length).toBe(2);
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
        Array [
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
      const sub = new PollingSubscription(
        {
          url: 'test.com',
          schema: PollingArticleResource.getEntitySchema(),
          fetch,
          frequency: 5000,
        },
        dispatch,
      );
      sub.add(5000);
      sub.add(7000);
      expect(sub.remove(5000)).toBe(false);
      expect(sub.remove(5000)).toBe(false);
      expect(sub.remove(7000)).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('should stop all timers', () => {
      dispatch.mockClear();
      sub.cleanup();
      jest.advanceTimersByTime(5000 * 13);
      expect(dispatch.mock.calls.length).toBe(0);
    });
    it('should be idempotent', () => {
      sub.cleanup();
    });
  });

  describe('offline support', () => {
    jest.useFakeTimers();

    function createMocks(listener: ConnectionListener) {
      const dispatch = jest.fn();
      const a = () => Promise.resolve({ id: 5, title: 'hi' });
      const fetch = jest.fn(a);

      const pollingSubscription = new PollingSubscription(
        {
          url: 'test.com',
          schema: PollingArticleResource.getEntitySchema(),
          fetch,
          frequency: 5000,
        },
        dispatch,
        listener,
      );
      return { dispatch, fetch, pollingSubscription };
    }

    it('should not dispatch when offline', () => {
      const listener = new MockConnectionListener(false);
      const { dispatch } = createMocks(listener);
      jest.advanceTimersByTime(50000);
      expect(dispatch.mock.calls.length).toBe(0);
      expect(listener.offlineHandlers.length).toBe(0);
      expect(listener.onlineHandlers.length).toBe(1);
    });

    it('should immediately start fetching when online', () => {
      const listener = new MockConnectionListener(false);
      const { dispatch } = createMocks(listener);
      expect(dispatch.mock.calls.length).toBe(0);

      listener.trigger('online');
      expect(dispatch.mock.calls.length).toBe(1);
      jest.advanceTimersByTime(5000);
      expect(dispatch.mock.calls.length).toBe(2);
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
