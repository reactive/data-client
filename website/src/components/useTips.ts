import clsx from 'clsx';
import { useEffect, useState } from 'react';

import styles from './tips.module.css';

/**
 * Tooltips shown on hover, keyboard focus or a tap, so touch screens get what
 * hover gives desktop: one pinned at a time, and Escape hides them all until
 * the pointer next enters or presses one, or focus lands on one.
 */
export default function useTips<K>() {
  const [open, setOpen] = useState<K | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pinned = open !== null;
  useEffect(() => {
    if (!pinned) return;
    const close = (e: Event) => {
      if (!(e.target as Element).closest?.(`.${styles.anchor}[data-open]`))
        setOpen(null);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('focusin', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('focusin', close);
    };
  }, [pinned]);
  useEffect(() => {
    const dismiss = (e: KeyboardEvent) => {
      // an Escape another widget already handled is that widget's
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // focus stays put, except on a link in the tip this hides: it returns
      // to that tip's control, before the dismissal so this focus can't revive it
      const active = document.activeElement;
      if (active?.closest(`.${styles.tip}`))
        active
          .closest(`.${styles.anchor}`)
          ?.querySelector<HTMLElement>('a, button')
          ?.focus();
      setOpen(null);
      setDismissed(true);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, []);
  const revive = () => setDismissed(false);
  return {
    /** which tip a tap pinned open; a press or focus outside it unpins it */
    open,
    setOpen,
    toggle: (key: K) => setOpen(current => (current === key ? null : key)),
    /** props for the element holding a tip and what it explains */
    anchor: (key: K, className?: string) => ({
      className: clsx(styles.anchor, dismissed && styles.dismissed, className),
      'data-open': open === key || undefined,
      onPointerEnter: revive,
      onPointerDown: revive,
      onFocus: revive,
    }),
  };
}
