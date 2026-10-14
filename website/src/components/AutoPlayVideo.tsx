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
  /** Plays with sound at this volume (0-1) when the browser allows it, otherwise muted */
  volume?: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (volume !== undefined) videoElement.volume = volume;

    // Browsers block autoplay with sound until the user interacts with the page
    const play = () =>
      videoElement.play().catch((error: DOMException) => {
        if (error.name !== 'NotAllowedError' || videoElement.muted) return;
        videoElement.muted = true;
        return videoElement.play();
      });

    // Ensure IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback to always play if not supported
      play();
      return;
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
    };
  }, [volume]);

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
