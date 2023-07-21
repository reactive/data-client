import React, { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver<T>(options: Props = {}) {
  const { threshold = 0.1, root = null, rootMargin = '0%' } = options;
  const ref = useRef<T>(null);
  const [entry, setEntry] = useState<null | IntersectionObserverEntry>(null);

  useEffect(() => {
    const node = ref?.current;

    if (!node || typeof IntersectionObserver !== 'function') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      { threshold, root, rootMargin },
    );

    observer.observe(node);

    return () => {
      setEntry(null);
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return [ref, entry] as const;
}
export interface Props {
  threshold?: number;
  root?: React.ReactElement;
  rootMargin?: string;
}
