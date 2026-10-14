import React, { useEffect, useRef } from 'react';

const AutoPlayVideo = ({
  src,
  type = 'video/mp4',
  alt,
  children,
  volume,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement> & {
  type?: string;
  /** `<source>` elements in preference order; replaces `src` and `type` */
  children?: React.ReactNode;
  /** Describes what the video shows, for screen readers and as fallback text */
  alt: string;
  /** Plays with sound at this volume (0-1) when the browser allows it, otherwise muted.
   * iOS ignores the level and uses the device volume. */
  volume?: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && volume !== undefined)
      videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Browsers block autoplay with sound until the user interacts with the page,
    // so fall back to muted and retry sound each time it scrolls back into view
    let autoMuted = false;
    const play = () => {
      if (autoMuted) videoElement.muted = false;
      videoElement.play().catch((error: DOMException) => {
        if (error.name !== 'NotAllowedError' || videoElement.muted) return;
        autoMuted = true;
        videoElement.muted = true;
        // muted autoplay is always allowed; any other failure leaves the controls
        videoElement.play().catch(() => undefined);
      });
    };
    // once the reader unmutes, their choice wins over the fallback
    const onVolumeChange = () => {
      if (!videoElement.muted) autoMuted = false;
    };
    videoElement.addEventListener('volumechange', onVolumeChange);
    const removeListener = () =>
      videoElement.removeEventListener('volumechange', onVolumeChange);

    // Ensure IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback to always play if not supported
      play();
      return removeListener;
    }

    const observerOptions = {
      root: null, // Use the viewport as the container
      rootMargin: '0px',
      threshold: 0.25, // Play when 25% of the video is visible
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          play();
        } else {
          videoElement.pause();
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    observer.observe(videoElement);

    // Clean up the observer on unmount
    return () => {
      observer.unobserve(videoElement);
      removeListener();
    };
  }, []);

  return (
    <center>
      <video
        ref={videoRef}
        width="600"
        controls
        muted={volume === undefined}
        playsInline
        loop
        aria-label={alt}
        {...props}
      >
        {children ?? <source src={src} type={type} />}
        {alt}
      </video>
    </center>
  );
};

export default AutoPlayVideo;
