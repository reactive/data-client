import React, { useEffect, useRef } from 'react';

const AutoPlayVideo = ({
  src,
  type = 'video/mp4',
  alt,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement> & {
  type?: string;
  /** Describes what the video shows, for screen readers and as fallback text */
  alt: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Ensure IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback to always play if not supported
      videoElement.play();
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
          videoElement.play();
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
        <source src={src} type={type} />
        {alt}
      </video>
    </center>
  );
};

export default AutoPlayVideo;
