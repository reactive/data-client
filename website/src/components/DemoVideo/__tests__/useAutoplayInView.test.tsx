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

function createVideo(playImpl: () => Promise<void> = () => Promise.resolve()) {
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  let generation = 0;
  const video = {
    paused: true,
    play: jest.fn(() => {
      const attempt = ++generation;
      const promise = playImpl();
      void promise.then(
        () => {
          if (attempt === generation) video.paused = false;
        },
        () => undefined,
      );
      return promise;
    }),
    pause: jest.fn(() => {
      generation += 1;
      video.paused = true;
    }),
    addEventListener: jest.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        const set = listeners.get(type) ?? new Set();
        set.add(listener);
        listeners.set(type, set);
      },
    ),
    removeEventListener: jest.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.get(type)?.delete(listener);
      },
    ),
    emit(type: string) {
      listeners.get(type)?.forEach(listener => {
        const event = new Event(type);
        if (typeof listener === 'function') listener(event);
        else listener.handleEvent(event);
      });
    },
  };
  return video as typeof video & HTMLVideoElement;
}

function entry(
  isIntersecting: boolean,
  intersectionRatio: number,
): IntersectionObserverEntry {
  return { isIntersecting, intersectionRatio } as IntersectionObserverEntry;
}

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) restorers.pop()?.();
});

function mockIntersectionObserver() {
  const observe = jest.fn();
  const disconnect = jest.fn();
  let ioCallback: IntersectionObserverCallback | undefined;
  const OriginalIO = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = jest.fn(callback => {
    ioCallback = callback;
    return { observe, disconnect, unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  restorers.push(() => {
    globalThis.IntersectionObserver = OriginalIO;
  });
  return {
    observe,
    disconnect,
    report(isIntersecting: boolean, intersectionRatio: number) {
      ioCallback?.(
        [entry(isIntersecting, intersectionRatio)],
        {} as IntersectionObserver,
      );
    },
  };
}

function mockVisibility(initial: DocumentVisibilityState = 'visible') {
  let visibilityState = initial;
  const descriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'visibilityState',
  );
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibilityState,
  });
  restorers.push(() => {
    if (descriptor) {
      Object.defineProperty(Document.prototype, 'visibilityState', descriptor);
    }
    delete (document as { visibilityState?: DocumentVisibilityState })
      .visibilityState;
  });
  return {
    set(next: DocumentVisibilityState) {
      visibilityState = next;
      document.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

describe('useAutoplayInView', () => {
  test('ignores a stale play() settlement after pause', async () => {
    const playCall = deferred<void>();
    const video = createVideo(() => playCall.promise);

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

  test('qualifying above-fold measurement starts once; a sliver does not', () => {
    const video = createVideo();
    const io = mockIntersectionObserver();
    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    expect(video.play).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('dormant');

    act(() => {
      io.report(true, 0.1);
    });
    expect(video.play).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('dormant');

    act(() => {
      io.report(true, 0.25);
    });
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).toBe('loading');

    act(() => {
      io.report(true, 0.8);
    });
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  test('scroll out pauses and re-entry resumes unless the user paused', () => {
    const video = createVideo();
    const io = mockIntersectionObserver();
    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    act(() => {
      io.report(false, 0);
    });
    expect(video.play).not.toHaveBeenCalled();

    act(() => {
      io.report(true, 0.4);
    });
    expect(video.play).toHaveBeenCalledTimes(1);

    act(() => {
      io.report(false, 0);
    });
    expect(video.pause).toHaveBeenCalled();
    expect(result.current.state).toEqual({
      status: 'paused',
      reason: 'out-of-view',
    });

    act(() => {
      io.report(true, 0.4);
    });
    expect(video.play).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.pause();
    });
    act(() => {
      io.report(false, 0);
    });
    act(() => {
      io.report(true, 0.4);
    });
    expect(video.play).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({ status: 'paused', reason: 'user' });
  });

  test('browser tab hide before or during intersection delays autoplay until foregrounded', () => {
    const video = createVideo();
    const io = mockIntersectionObserver();
    const visibility = mockVisibility('hidden');
    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    act(() => {
      io.report(true, 1);
    });
    expect(video.play).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('dormant');

    act(() => {
      visibility.set('visible');
    });
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).toBe('loading');
  });

  test('backgrounding a playing page pauses and foregrounding resumes unless user-paused', () => {
    const video = createVideo();
    const io = mockIntersectionObserver();
    const visibility = mockVisibility();
    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    act(() => {
      io.report(true, 1);
    });
    expect(video.play).toHaveBeenCalledTimes(1);

    act(() => {
      visibility.set('hidden');
    });
    expect(video.pause).toHaveBeenCalled();
    expect(result.current.state).toEqual({
      status: 'paused',
      reason: 'out-of-view',
    });

    act(() => {
      visibility.set('visible');
    });
    expect(video.play).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.pause();
    });
    act(() => {
      visibility.set('hidden');
    });
    act(() => {
      visibility.set('visible');
    });
    expect(video.play).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({ status: 'paused', reason: 'user' });
  });

  test('disabling stops autoplay but keeps visibility tracking for explicit Play', () => {
    const video = createVideo();
    const io = mockIntersectionObserver();
    const visibility = mockVisibility();

    const { result, rerender } = renderHook(
      ({ enabled }) => {
        const ref = useRef(video);
        return useAutoplayInView(ref, { enabled });
      },
      { initialProps: { enabled: true } },
    );

    act(() => {
      io.report(true, 1);
    });
    expect(video.play).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    expect(video.pause).toHaveBeenCalled();
    expect(io.disconnect).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({
      status: 'paused',
      reason: 'out-of-view',
    });

    act(() => {
      io.report(true, 1);
    });
    expect(video.play).toHaveBeenCalledTimes(1);

    act(() => {
      void result.current.play();
    });
    expect(video.play).toHaveBeenCalledTimes(2);

    act(() => {
      io.report(false, 0);
    });
    expect(result.current.state).toEqual({
      status: 'paused',
      reason: 'out-of-view',
    });

    act(() => {
      visibility.set('hidden');
    });
    act(() => {
      io.report(true, 1);
    });
    expect(video.play).toHaveBeenCalledTimes(2);

    act(() => {
      visibility.set('visible');
    });
    expect(video.play).toHaveBeenCalledTimes(3);
  });

  test('stale playing and waiting events cannot revive a paused controller', async () => {
    const playCall = deferred<void>();
    const video = createVideo(() => playCall.promise);
    const io = mockIntersectionObserver();
    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    act(() => {
      io.report(true, 1);
    });
    act(() => {
      result.current.pause();
    });

    await act(async () => {
      playCall.resolve();
      await playCall.promise;
      video.emit('playing');
      video.emit('waiting');
    });
    expect(result.current.state).toEqual({ status: 'paused', reason: 'user' });
  });

  test('stale playing after leave/re-enter does not mark playback as playing while still paused', async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    let calls = 0;
    const video = createVideo(() => {
      calls += 1;
      return calls === 1 ? first.promise : second.promise;
    });
    const io = mockIntersectionObserver();
    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    act(() => {
      io.report(true, 1);
    });
    act(() => {
      io.report(false, 0);
    });
    act(() => {
      io.report(true, 1);
    });
    expect(result.current.state.status).toBe('loading');
    expect(video.paused).toBe(true);

    await act(async () => {
      first.resolve();
      await first.promise;
      video.emit('playing');
      video.emit('waiting');
    });
    expect(video.paused).toBe(true);
    expect(result.current.state.status).toBe('loading');
  });

  test('without IntersectionObserver, autoplay stays dormant and explicit Play works', () => {
    const video = createVideo();
    const OriginalIO = globalThis.IntersectionObserver;
    // @ts-expect-error -- simulate unsupported browsers / jsdom without IO
    delete globalThis.IntersectionObserver;
    restorers.push(() => {
      globalThis.IntersectionObserver = OriginalIO;
    });
    const visibility = mockVisibility();

    const { result } = renderHook(() => {
      const ref = useRef(video);
      return useAutoplayInView(ref, { enabled: true });
    });

    expect(video.play).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('dormant');

    act(() => {
      void result.current.play();
    });
    expect(video.play).toHaveBeenCalledTimes(1);

    act(() => {
      visibility.set('hidden');
    });
    expect(result.current.state).toEqual({
      status: 'paused',
      reason: 'out-of-view',
    });

    act(() => {
      visibility.set('visible');
    });
    expect(video.play).toHaveBeenCalledTimes(2);
  });
});
