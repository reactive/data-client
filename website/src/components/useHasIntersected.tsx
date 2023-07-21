import React, { useEffect, useRef, useState } from 'react';

export function useHasIntersected<T>(options: Props = {}) {
  const { threshold = 0.1, root = null, rootMargin = '0%' } = options;
  const ref = useRef<T>(null);
  const [hasIntersected, setHasIntersected] = useState(true);

  useEffect(() => {
    const node = ref?.current;

    if (!node || typeof IntersectionObserver !== 'function') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();
        } else {
          // on browser load if we aren't intersected trigger update
          setHasIntersected(false);
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return [ref, hasIntersected] as const;
}
export interface Props {
  threshold?: number;
  root?: React.ReactElement;
  rootMargin?: string;
}
