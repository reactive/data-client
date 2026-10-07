import React, { useCallback, useEffect, useRef, useState } from 'react';

import { activeGlide } from './glide';
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
  const memberRef = useMember({
    exiting: !show,
    onExited: () => setMounted(false),
  });
  const el = useRef<HTMLDivElement | null>(null);
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      return memberRef(node);
    },
    [memberRef],
  );
  // Leave on its own when no group slides it out (none around it, or its
  // layoutDependency didn't change with `show`): now if it is still, or once
  // whatever glide is moving it settles, so it never stays stuck on screen
  useEffect(() => {
    if (show) return;
    let reopened = false;
    const leave = () => reopened || setMounted(false);
    const moving = el.current && activeGlide(el.current);
    if (moving)
      moving.finished.then(leave, () => {
        // cancelled: the group took over and moves it next
      });
    else leave();
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
