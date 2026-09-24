import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import { shouldAttachSources } from './attachSources';
import { prefersReducedData, prefersReducedMotion } from './mediaPrefs';
import styles from './styles.module.css';
import { trackDemoEvent } from './trackDemoEvent';
import type { DemoVideoProps } from './types';
import { useAutoplayInView } from './useAutoplayInView';
import { isGoogleBot } from '../Playground/isMobileOrBot';
import { useHasIntersected } from '../useHasIntersected';

/**
 * Autoplay video facade for MDX demos.
 *
 * Asset convention (site-root paths; resolved internally):
 * - videos: `/videos/demos/<id>.mp4` (optional `.webm`)
 * - posters: `/img/demos/<id>.jpg` (optional `.dark.jpg`)
 *
 * SSR and the first hydration render are poster-only. Media sources attach
 * after mount, once near the viewport, unless the user has a data-saving
 * preference (explicit Play then fetches).
 */
export default function DemoVideo({ source, onActivate }: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Generous margin so sources attach (and buffer) before scrolling into view.
  const [rootRef, hasIntersected] = useHasIntersected<HTMLDivElement>({
    threshold: 0,
    rootMargin: '400px 0px',
  });
  const [prefs, setPrefs] = useState<MediaPrefs | null>(null);
  const [forceAttach, setForceAttach] = useState(false);
  const pendingUserPlay = useRef(false);

  useEffect(() => {
    setPrefs({
      reducedMotion: prefersReducedMotion(),
      reducedData: prefersReducedData(),
    });
  }, []);

  const attachSources = shouldAttachSources({
    prefsReady: prefs !== null,
    isBot: isGoogleBot,
    nearViewport: hasIntersected || typeof IntersectionObserver !== 'function',
    reducedData: prefs?.reducedData ?? false,
    forceAttach,
  });

  const { state, play, pause } = useAutoplayInView(videoRef, {
    enabled: attachSources && (forceAttach || !prefs?.reducedMotion),
    threshold: 0.25,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!attachSources || !video) return;
    video.load();
    if (pendingUserPlay.current) {
      pendingUserPlay.current = false;
      void play();
    }
  }, [attachSources, play]);

  const handlePlay = () => {
    trackDemoEvent('demo_play', source.id);
    setForceAttach(true);
    if (attachSources) {
      void play();
    } else {
      pendingUserPlay.current = true;
    }
  };

  const handlePause = () => {
    trackDemoEvent('demo_pause', source.id);
    pause();
  };

  const { light, dark } = source.poster;
  const posterLight = useBaseUrl(light);
  const posterDark = useBaseUrl(dark ?? light);
  const mp4 = useBaseUrl(source.mp4);
  const webm = useBaseUrl(source.webm ?? '');

  const playing = state.status === 'playing';
  const failed = state.status === 'error';

  return (
    <div
      ref={rootRef}
      className={clsx(styles.root, onActivate && styles.activatable)}
      style={
        {
          '--demo-width': source.width,
          '--demo-height': source.height,
        } as React.CSSProperties
      }
      onClick={onActivate}
    >
      <ThemedImage
        className={clsx(styles.poster, playing && styles.posterHidden)}
        alt=""
        // ThemedImage SSRs both theme variants; lazy-load so below-fold demos
        // don't fetch two JPGs during initial page load.
        loading="lazy"
        decoding="async"
        sources={{ light: posterLight, dark: posterDark }}
      />
      <video
        ref={videoRef}
        className={styles.video}
        muted
        playsInline
        loop
        preload="none"
        width={source.width}
        height={source.height}
        aria-hidden
      >
        {attachSources ?
          <>
            {source.webm ?
              <source src={webm} type="video/webm" />
            : null}
            <source src={mp4} type="video/mp4" />
          </>
        : null}
      </video>
      {failed ?
        <div className={styles.unavailable}>Video unavailable</div>
      : null}
      <div className={styles.controls}>
        {playing ?
          <button
            type="button"
            className={styles.playback}
            onClick={event => {
              event.stopPropagation();
              handlePause();
            }}
            aria-label="Pause demo video"
          >
            <PauseIcon />
          </button>
        : <button
            type="button"
            className={styles.playback}
            onClick={event => {
              event.stopPropagation();
              handlePlay();
            }}
            aria-label="Play demo video"
          >
            <PlayIcon />
          </button>
        }
        {onActivate ?
          <button
            type="button"
            className={styles.activate}
            onClick={event => {
              event.stopPropagation();
              onActivate();
            }}
          >
            Try it
          </button>
        : null}
      </div>
    </div>
  );
}

interface MediaPrefs {
  reducedMotion: boolean;
  reducedData: boolean;
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path fill="currentColor" d="M3 1.8v10.4L12.2 7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path fill="currentColor" d="M3 2h3v10H3zm5 0h3v10H8z" />
    </svg>
  );
}
