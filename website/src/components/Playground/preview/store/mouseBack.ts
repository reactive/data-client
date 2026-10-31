import { useEffect, useRef } from 'react';

/** The mouse's back button goes `back` instead of leaving the page, while
 * the mouse is over `ref` and `canGoBack` holds.
 *
 * Chromium sends the button to the page as a `mouseup` with `button` 3, and
 * cancelling it keeps the page. Firefox sends the page no event for it (its
 * widget turns the button straight into a Back command), so there it still
 * leaves the page. */
export function useMouseBack(
  ref: React.RefObject<HTMLElement | null>,
  canGoBack: boolean,
  back: () => void,
) {
  const latest = useRef({ canGoBack, back });
  latest.current = { canGoBack, back };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 3 || !latest.current.canGoBack) return;
      e.preventDefault();
      latest.current.back();
    };
    el.addEventListener('mouseup', onMouseUp);
    return () => el.removeEventListener('mouseup', onMouseUp);
  }, [ref]);
}
