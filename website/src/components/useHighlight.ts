import React, { useState } from 'react';

/**
 * One highlighted item in a diagram: hover on desktop, tap on touch screens
 * (tapping the background clears it). `state()` gives the `on` class to the
 * items that belong to the highlight and `off` to the rest.
 */
export default function useHighlight<T>(on: string, off: string) {
  const [active, setActive] = useState<T | null>(null);
  const select = (item: T) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(item);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(null);
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setActive(item);
    },
  });
  const clear = () => setActive(null);
  const state = (...items: T[]) =>
    active === null ? undefined
    : items.includes(active) ? on
    : off;
  return { select, clear, state };
}
