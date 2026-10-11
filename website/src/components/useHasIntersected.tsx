import { useEffect, useState } from 'react';

export function useHasIntersected<T extends Element>(options: Props = {}) {
  const { threshold = 0.1, root = null, rootMargin = '0%' } = options;
  // Callback ref (via state) so a node mounted after the first render is observed
  const [node, ref] = useState<T | null>(null);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
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
  }, [node, threshold, root, rootMargin]);

  return [ref, hasIntersected] as const;
}
export interface Props {
  threshold?: number;
  root?: Element | Document | null;
  rootMargin?: string;
}
