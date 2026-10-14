import React, { useRef, useState } from 'react';

import styles from './PosterVideo.module.css';

/** A narrated video that waits behind its poster until the reader presses play, then plays with sound */
export default function PosterVideo({
  poster,
  alt,
  duration,
  volume = 1,
  children,
}: {
  /** 16:9 image of what the video shows */
  poster: string;
  /** Describes what the video shows, for screen readers and as fallback text */
  alt: string;
  /** Shown on the play button, like "1:47" */
  duration?: string;
  /** Playback volume (0-1); iOS ignores it and uses the device volume */
  volume?: number;
  /** `<source>` elements in preference order */
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    setStarted(true);
    video.play();
    video.focus();
  };

  return (
    <div className={styles.frame}>
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        preload="none"
        playsInline
        controls={started}
        aria-label={alt}
      >
        {children}
        {alt}
      </video>
      {started ? null : (
        <button
          type="button"
          className={styles.play}
          onClick={play}
          aria-label={`Play video: ${alt}`}
        >
          <span className={styles.icon} aria-hidden="true" />
          {duration ?
            <span className={styles.duration}>{duration}</span>
          : null}
        </button>
      )}
    </div>
  );
}
