import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { settled } from './glide';
import { useMember, useWillGlide } from './MotionGroup';

/**
 * Shows `children` while `show`, sliding in from and back out past the end of
 * its flex container (so it follows the layout: sideways in a row, up from
 * the bottom when stacked). Stays mounted until its exit finishes, so
 * reopening mid-exit just turns it around. The motion comes from the nearest
 * `<MotionGroup>`; without one it just mounts and unmounts.
 *
 * It slides over its siblings; clip it with `overflow: hidden` on an ancestor.
 */
export default function Reveal({
  show,
  className,
  children,
}: {
  show: boolean;
  /** Layout of the sliding box: it is the flex item; its children fill it */
  className?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(show);
  if (show && !mounted) setMounted(true);
  // keep showing what it had while it slides out
  const shown = useRef(children);
  if (show) shown.current = children;
  const memberRef = useMember({ exiting: !show });
  const willGlide = useWillGlide();
  const el = useRef<HTMLDivElement | null>(null);
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      return memberRef(node);
    },
    [memberRef],
  );
  // leaves once it comes to rest: at once (before it paints in flow) if
  // nothing will slide it out, else after the group's glide settles
  useLayoutEffect(() => {
    const node = el.current;
    if (show || !node) return;
    if (!willGlide(node)) {
      setMounted(false);
      return;
    }
    let reopened = false;
    // the group starts its glide later in this commit
    queueMicrotask(() =>
      settled(node).then(() => reopened || setMounted(false)),
    );
    return () => {
      reopened = true;
    };
  }, [show, willGlide]);
  return mounted ?
      <div
        ref={ref}
        className={className ? `motion-reveal ${className}` : 'motion-reveal'}
      >
        {shown.current}
      </div>
    : null;
}
