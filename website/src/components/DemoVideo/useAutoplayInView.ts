import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { reducePlayback } from './reducePlayback';
import type {
  AutoplayInViewController,
  AutoplayInViewOptions,
  DemoPlaybackState,
  PlaybackEvent,
} from './types';

export function useAutoplayInView(
  ref: RefObject<HTMLVideoElement | null>,
  { enabled, threshold = 0.25 }: AutoplayInViewOptions,
): AutoplayInViewController {
  const [state, setState] = useState<DemoPlaybackState>({ status: 'dormant' });
  const userPausedRef = useRef(false);
  const attemptRef = useRef(0);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const dispatch = useCallback((event: PlaybackEvent) => {
    setState(current => reducePlayback(current, event));
  }, []);

  const invalidate = useCallback(() => {
    attemptRef.current += 1;
  }, []);

  const attemptPlay = useCallback(() => {
    const video = ref.current;
    if (
      !video ||
      userPausedRef.current ||
      video.paused === false ||
      playPromiseRef.current
    ) {
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

  const play = useCallback(() => {
    userPausedRef.current = false;
    dispatch({ type: 'user-play' });
    return attemptPlay();
  }, [attemptPlay, dispatch]);

  const pause = useCallback(() => {
    userPausedRef.current = true;
    invalidate();
    playPromiseRef.current = null;
    ref.current?.pause();
    dispatch({ type: 'user-pause' });
  }, [dispatch, invalidate, ref]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled) return undefined;

    if (typeof IntersectionObserver !== 'function') {
      dispatch({ type: 'visibility', inView: true });
      void attemptPlay();
      return () => {
        invalidate();
        video.pause();
        dispatch({ type: 'visibility', inView: false });
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (inView) {
          dispatch({ type: 'visibility', inView: true });
          void attemptPlay();
        } else {
          invalidate();
          video.pause();
          dispatch({ type: 'visibility', inView: false });
        }
      },
      { threshold, root: null, rootMargin: '0px' },
    );
    observer.observe(video);
    return () => {
      invalidate();
      observer.disconnect();
      video.pause();
      dispatch({ type: 'visibility', inView: false });
    };
  }, [attemptPlay, dispatch, enabled, invalidate, ref, threshold]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled) return undefined;

    const onPlaying = () => {
      if (userPausedRef.current) return;
      dispatch({ type: 'playing' });
    };
    const onWaiting = () => {
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
  }, [dispatch, enabled, ref]);

  return { state, play, pause };
}
