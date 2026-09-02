import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import {
  shouldPlay,
  viewportFromEntry,
  type PlaybackPolicy,
} from './playbackPolicy';
import { reducePlayback } from './reducePlayback';
import type {
  AutoplayInViewController,
  AutoplayInViewOptions,
  DemoPlaybackState,
  PlaybackEvent,
} from './types';

function isDocumentVisible(): boolean {
  return (
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
}

export function useAutoplayInView(
  ref: RefObject<HTMLVideoElement | null>,
  { enabled, threshold = 0.25 }: AutoplayInViewOptions,
): AutoplayInViewController {
  const [state, setState] = useState<DemoPlaybackState>({ status: 'dormant' });
  const policyRef = useRef<PlaybackPolicy>({
    enabled,
    documentVisible: isDocumentVisible(),
    viewport: 'unknown',
    userIntent: 'automatic',
  });
  policyRef.current.enabled = enabled;
  const attemptRef = useRef(0);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const skipEnabledReconcile = useRef(true);
  const reconcileRef = useRef<() => void>(() => undefined);

  const dispatch = useCallback((event: PlaybackEvent) => {
    setState(current => reducePlayback(current, event));
  }, []);

  const invalidate = useCallback(() => {
    attemptRef.current += 1;
    playPromiseRef.current = null;
  }, []);

  const attemptPlay = useCallback(() => {
    const video = ref.current;
    if (!video || video.paused === false || playPromiseRef.current) {
      return playPromiseRef.current ?? Promise.resolve();
    }
    const attempt = ++attemptRef.current;
    const promise = video.play().then(undefined, () => {
      if (attempt !== attemptRef.current) return;
      dispatch({ type: 'blocked' });
    });
    playPromiseRef.current = promise;
    void promise.finally(() => {
      if (playPromiseRef.current === promise) playPromiseRef.current = null;
    });
    return promise;
  }, [dispatch, ref]);

  const reconcile = useCallback(() => {
    if (shouldPlay(policyRef.current)) {
      dispatch({ type: 'visibility', inView: true });
      void attemptPlay();
      return;
    }
    invalidate();
    ref.current?.pause();
    dispatch({ type: 'visibility', inView: false });
  }, [attemptPlay, dispatch, invalidate, ref]);
  reconcileRef.current = reconcile;

  const play = useCallback(() => {
    policyRef.current.userIntent = 'requested';
    dispatch({ type: 'user-play' });
    reconcile();
    return playPromiseRef.current ?? Promise.resolve();
  }, [dispatch, reconcile]);

  const pause = useCallback(() => {
    policyRef.current.userIntent = 'paused';
    invalidate();
    ref.current?.pause();
    dispatch({ type: 'user-pause' });
  }, [dispatch, invalidate, ref]);

  useEffect(() => {
    if (skipEnabledReconcile.current) {
      skipEnabledReconcile.current = false;
      return;
    }
    reconcile();
  }, [enabled, reconcile]);

  useEffect(() => {
    const video = ref.current;
    const policy = policyRef.current;
    if (!video) return undefined;

    policy.documentVisible = isDocumentVisible();

    const onVisibilityChange = () => {
      const visible = isDocumentVisible();
      if (policy.documentVisible === visible) return;
      policy.documentVisible = visible;
      reconcileRef.current();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(
        ([entry]) => {
          const viewport = viewportFromEntry(entry, threshold);
          if (policy.viewport === viewport) return;
          policy.viewport = viewport;
          reconcileRef.current();
        },
        { threshold },
      );
      observer.observe(video);
    }
    reconcileRef.current();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer?.disconnect();
      policy.viewport = 'unknown';
      invalidate();
      video.pause();
      dispatch({ type: 'visibility', inView: false });
    };
  }, [dispatch, invalidate, ref, threshold]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;

    const onPlaying = () => {
      if (video.paused || !shouldPlay(policyRef.current)) return;
      dispatch({ type: 'playing' });
    };
    const onWaiting = () => {
      if (video.paused || !shouldPlay(policyRef.current)) return;
      dispatch({ type: 'waiting' });
    };
    const onError = () => {
      dispatch({ type: 'error' });
    };
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [dispatch, ref]);

  return { state, play, pause };
}
