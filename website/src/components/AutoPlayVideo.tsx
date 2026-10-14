import React, { useEffect, useRef } from 'react';

const AutoPlayVideo = ({
  src,
  type = 'video/mp4',
  alt,
  children,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement> & {
  type?: string;
  /** `<source>` elements in preference order; replaces `src` and `type` */
  children?: React.ReactNode;
  /** Describes what the video shows, for screen readers and as fallback text */
  alt: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    // a pause() before play() settles rejects with AbortError; the controls show any real failure
    const play = () => videoElement.play().catch(() => undefined);

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
  }, []);

  return (
    <center>
      <video
        ref={videoRef}
        width="600"
        controls
        muted
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
