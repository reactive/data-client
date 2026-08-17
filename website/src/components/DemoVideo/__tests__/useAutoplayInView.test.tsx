/// <reference types="jest" />

import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';

import { useAutoplayInView } from '../useAutoplayInView';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAutoplayInView', () => {
  test('ignores a stale play() settlement after pause', async () => {
    const playCall = deferred<void>();
    const video = {
      play: jest.fn(() => playCall.promise),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as HTMLVideoElement;

    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: false });
    });

    await act(async () => {
      void result.current.play();
    });
    expect(result.current.state.status).toBe('loading');

    act(() => {
      result.current.pause();
    });
    expect(result.current.state).toEqual({ status: 'paused', reason: 'user' });

    await act(async () => {
      playCall.resolve();
      await playCall.promise;
    });
    expect(result.current.state).toEqual({ status: 'paused', reason: 'user' });
  });

  test('disabling pauses in-view playback and updates state', () => {
    const video = {
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as HTMLVideoElement;
    const observe = jest.fn();
    const disconnect = jest.fn();
    let ioCallback: IntersectionObserverCallback | undefined;
    const OriginalIO = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = jest.fn(callback => {
      ioCallback = callback;
      return { observe, disconnect, unobserve: jest.fn() };
    }) as unknown as typeof IntersectionObserver;

    const { result, rerender } = renderHook(
      ({ enabled }) => {
        const ref = useRef(video);
        return useAutoplayInView(ref, { enabled });
      },
      { initialProps: { enabled: true } },
    );

    act(() => {
      ioCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(video.play).toHaveBeenCalled();

    rerender({ enabled: false });
    expect(video.pause).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
    expect(result.current.state).toEqual({
      status: 'paused',
      reason: 'out-of-view',
    });

    globalThis.IntersectionObserver = OriginalIO;
  });
});
