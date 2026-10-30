import { useEffect, useRef } from 'react';

import { isGecko } from '../../userAgent';

/** Keys of the history entries `useMouseBack` adds in Firefox, and stamps */
const OURS = '__storeBack';
const UNDER = '__storeBackUnder';

/** The mouse's back button (and, in Firefox, any Back) goes `back` instead of
 * leaving the page, while the mouse is over `ref` and `canGoBack` holds.
 *
 * Chromium sends the button to the page as a `mouseup` with `button` 3, and
 * cancelling it keeps the page. Firefox sends the page no events for it (its
 * widget turns the button straight into a Back command), so there an entry
 * for the same URL is added while the mouse is over `ref`: Back lands on the
 * entry under it, and that `popstate` goes no further than here, so the
 * site's router never sees it. The entry goes as the mouse leaves. */
export function useMouseBack(
  ref: React.RefObject<HTMLElement | null>,
  canGoBack: boolean,
  back: () => void,
) {
  const latest = useRef({ canGoBack, back });
  latest.current = { canGoBack, back };
  // adds or removes Firefox's entry as `canGoBack` changes
  const sync = useRef<() => void>(undefined);
  useEffect(() => sync.current?.(), [canGoBack]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 3 || !latest.current.canGoBack) return;
      e.preventDefault();
      latest.current.back();
    };
    el.addEventListener('mouseup', onMouseUp);
    if (!isGecko()) return () => el.removeEventListener('mouseup', onMouseUp);

    let over = false;
    // while our entry is the current one: the token the entry under it
    // carries, so Back to it is told from Back further, left to the page
    let under: { token: string; restoration: ScrollRestoration } | null = null;
    // our own Back, taking the entry away
    let leaving = false;
    let unmounted = false;
    const add = () => {
      under = {
        token: Math.random().toString(36).slice(2),
        restoration: history.scrollRestoration,
      };
      // landing on it must not scroll the page to where it was now
      history.scrollRestoration = 'manual';
      history.replaceState({ ...history.state, [UNDER]: under.token }, '');
      history.pushState({ ...history.state, [OURS]: under.token }, '');
    };
    const remove = () => {
      if (!under || leaving || history.state?.[OURS] !== under.token) return;
      leaving = true;
      history.back();
    };
    const update = () => {
      if (over && latest.current.canGoBack) {
        if (!under) add();
      } else remove();
    };
    sync.current = update;
    const stop = () => window.removeEventListener('popstate', onPopState, true);
    function onPopState(e: PopStateEvent) {
      if (!under) return;
      const landed = e.state?.[UNDER] === under.token;
      if (landed) {
        history.scrollRestoration = under.restoration;
        e.stopImmediatePropagation();
      }
      under = null;
      if (leaving) {
        leaving = false;
        if (unmounted) stop();
        else update();
        return;
      }
      if (!landed) return;
      latest.current.back();
      // one more level to go back to, until the panel says otherwise
      update();
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      over = true;
      update();
    };
    const onLeave = () => {
      over = false;
      update();
    };
    // ahead of the router's own listener, so it can stop it
    window.addEventListener('popstate', onPopState, true);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      unmounted = true;
      over = false;
      sync.current = undefined;
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      // its own Back is still to come, for the listener to take
      remove();
      if (!leaving) stop();
    };
  }, [ref]);
}
