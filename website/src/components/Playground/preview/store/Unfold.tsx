import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import styles from './store.module.css';
import { prefersReducedMotion, springEasing, springs } from '../../../motion';

/** By when an `Unfold`'s slide shut (`--motion-smooth`) is over */
export const TIMELINE_CLOSE_MS = springEasing(springs.smooth).duration + 100;

/** Slides `children` open and shut (see `.unfold`): their row grows from
 * nothing as they rise into place, and back. Shut, they stay mounted, but
 * neither focusable nor announced, showing what they did until the slide
 * ends. It mounts shut and opens on the next frame, so the slide open runs
 * as a transition too: one slide shut turned around reverses from where it
 * is, and redisplaying the panel (hidden, it keeps its state) replays
 * nothing, as keyframes would */
export default function Unfold({
  open,
  onShut,
  onBlur,
  children,
}: {
  open: boolean;
  /** Called once a slide shut is over */
  onShut?: () => void;
  /** Called as it shuts with focus inside, to move focus somewhere shown */
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // whether it held focus as it began to shut: going inert can drop focus
  // to the page before the effect below looks
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current!;
    if (!open) {
      el.removeAttribute('data-open');
      if (hadFocus.current || el.contains(document.activeElement)) onBlur?.();
      return;
    }
    const frame = requestAnimationFrame(() => el.setAttribute('data-open', ''));
    return () => cancelAnimationFrame(frame);
    // only as `open` flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // from a slide shut's start to its end; reopened mid-slide turns it around
  const [was, setWas] = useState(open);
  const [closing, setClosing] = useState(false);
  if (was !== open) {
    hadFocus.current = !open && !!ref.current?.contains(document.activeElement);
    setWas(open);
    setClosing(!open);
  }
  const closingNow = closing || (was !== open && !open);
  // what it showed stays while it slides shut
  const shown = useRef(children);
  if (open || !closingNow) shown.current = children;
  // the latest, so an inline `onShut` doesn't re-arm the settle timer below
  const onShutRef = useRef(onShut);
  useLayoutEffect(() => {
    onShutRef.current = onShut;
  });
  const shut = useCallback(() => {
    setClosing(false);
    onShutRef.current?.();
  }, []);
  useLayoutEffect(() => {
    // no transition to end under reduced motion
    if (closing && prefersReducedMotion()) shut();
  }, [closing, shut]);
  useEffect(() => {
    // the slide's end can go unseen (the panel hidden mid-slide, the toggle
    // flipped twice in a frame): once it must be over, settle regardless
    if (!closing) return;
    const id = setTimeout(shut, TIMELINE_CLOSE_MS);
    return () => clearTimeout(id);
  }, [closing, shut]);
  return (
    <div
      ref={ref}
      className={styles.unfold}
      inert={!open}
      aria-hidden={!open || undefined}
      onTransitionEnd={e => {
        if (e.target === e.currentTarget && closing) shut();
      }}
    >
      <div className={styles.unfoldBody}>{shown.current}</div>
    </div>
  );
}
