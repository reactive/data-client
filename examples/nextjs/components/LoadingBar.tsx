'use client';
import { useRef, useEffect } from 'react';
import styles from './LoadingBar.module.css';

const LoadingBar = ({
  duration,
  loading,
}: {
  duration?: number;
  loading?: boolean;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const delay = 50;

  useEffect(() => {
    if (!loading) return;
    const node = barRef.current;

    let animation: Animation;
    const timeoutId = setTimeout(() => {
      if (!node) return;
      animation = node.animate(
        [
          {
            transform: `translateX(${-100}%)`,
          },
          {
            transform: `translateX(${-50}%)`,
            offset: 0.2,
          },
          {
            transform: `translateX(${0}%)`,
            easing: 'ease-out',
          },
        ],
        {
          duration: duration,
          iterations: 1,
          easing: 'linear',
        },
      );
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      if (animation) animation.cancel();
    };
  }, [duration, loading]);

  return (
    <div className={styles.container}>
      <div
        className={styles.inner}
        style={{
          transform: `translateX(${-100}%)`,
        }}
        ref={barRef}
      ></div>
    </div>
  );
};
LoadingBar.defaults = {
  duration: 200,
  loading: false,
};

export default LoadingBar;
