import { useEffect, useRef } from 'react';

import { isGecko } from '../../userAgent';

/** Keys of the history entries `useMouseBack` adds in Firefox, and stamps */
const OURS = '__storeBack';
const UNDER = '__storeBackUnder';

/** The mouse's back button (and, in Firefox, any Back) goes `back` instead of
 * leaving the page, while the mouse is over `ref` and it is `depth` levels
 * deep.
 *
 * Chromium sends the button to the page as a `mouseup` with `button` 3, and
 * cancelling it keeps the page. Firefox sends the page no events for it (its
 * widget turns the button straight into a Back command), so there an entry
 * for the same URL is added while the mouse is over `ref`: Back lands on the
 * entry under it, and that `popstate` goes no further than here, so the
 * site's router never sees it. The entry goes as the mouse leaves. */
export function useMouseBack(
  ref: React.RefObject<HTMLElement | null>,
  depth: number,
  back: () => void,
) {
  const latest = useRef({ depth, back });
  latest.current = { depth, back };
  // Firefox's entry, added or removed as the depth changes: each Back
  // changes it, so the next entry waits for the level it goes back to
  const update = useRef<() => void>(undefined);
  useEffect(() => update.current?.(), [depth]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isGecko()) {
      const onMouseUp = (e: MouseEvent) => {
        if (e.button !== 3 || !latest.current.depth) return;
        e.preventDefault();
        latest.current.back();
      };
      el.addEventListener('mouseup', onMouseUp);
      return () => el.removeEventListener('mouseup', onMouseUp);
    }

    let over = false;
    // while our entry is the current one: the token the entry under it
    // carries, so Back to it is told from Back further, left to the page
    let under: { token: string; restoration: ScrollRestoration } | null = null;
    // our own Back, taking the entry away; once unmounted, the listener goes
    // as it lands
    let leaving: false | 'leave' | 'unmount' = false;
    const add = () => {
      const token = Math.random().toString(36).slice(2);
      under = { token, restoration: history.scrollRestoration };
      // landing on it must not scroll the page to where it was now
      history.scrollRestoration = 'manual';
      const base = history.state;
      history.replaceState({ ...base, [UNDER]: token }, '');
      history.pushState({ ...base, [OURS]: token }, '');
    };
    const remove = () => {
      if (!under || leaving || history.state?.[OURS] !== under.token) return;
      leaving = 'leave';
      history.back();
    };
    const sync = () => {
      if (over && latest.current.depth) {
        if (!under) add();
      } else remove();
    };
    update.current = sync;
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
        const how = leaving;
        leaving = false;
        if (how === 'unmount') stop();
        else sync();
      } else if (landed) latest.current.back();
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      over = true;
      sync();
    };
    const onLeave = () => {
      over = false;
      sync();
    };
    // ahead of the router's own listener, so it can stop it
    window.addEventListener('popstate', onPopState, true);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      over = false;
      remove();
      // its own Back is still to come, for the listener to take
      if (leaving) leaving = 'unmount';
      else stop();
    };
  }, [ref]);
}
