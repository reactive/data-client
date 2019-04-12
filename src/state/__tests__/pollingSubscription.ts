import PollingSubscription from '../PollingSubscription';
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

  it('should not call immediately', () => {
    expect(dispatch.mock.calls.length).toBe(0);
  });

  it('should call after period', () => {
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
      sub.remove(1000);
      dispatch.mockClear();
      jest.advanceTimersByTime(5000 * 13);
      expect(dispatch.mock.calls.length).toBe(13);
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
});
