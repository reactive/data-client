import React, { useCallback, useEffect, useRef, useState } from 'react';

import { settled } from './glide';
import { useMember } from './MotionGroup';

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
  const el = useRef<HTMLDivElement | null>(null);
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      return memberRef(node);
    },
    [memberRef],
  );
  // leaves once it comes to rest: after the group slides it out, or at once
  // if nothing moves it (no group, or one that ignored this change)
  useEffect(() => {
    if (show || !el.current) return;
    let reopened = false;
    settled(el.current).then(() => reopened || setMounted(false));
    return () => {
      reopened = true;
    };
  }, [show]);
  return mounted ?
      <div
        ref={ref}
        className={className ? `motion-reveal ${className}` : 'motion-reveal'}
      >
        {shown.current}
      </div>
    : null;
}
