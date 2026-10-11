import React, {
  Activity,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { settled } from './glide';
import { useMember, useWillGlide } from './MotionGroup';

/**
 * Shows `children` while `show`, sliding in from and back out past the end of
 * its flex container (so it follows the layout: sideways in a row, up from
 * the bottom when stacked). Once its exit finishes it is hidden (an
 * `<Activity>`), not unmounted, so reopening finds its state as it was left;
 * reopening mid-exit just turns it around. The motion comes from the nearest
 * `<MotionGroup>`; without one it just shows and hides.
 *
 * It slides over its siblings; clip it with `overflow: hidden` on an ancestor.
 * `data-visible` marks it from showing until its exit finishes, for styles
 * that should hold through the slide out.
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
  const [visible, setVisible] = useState(show);
  // renders nothing until first shown
  const [mounted, setMounted] = useState(show);
  if (show && !visible) {
    setVisible(true);
    setMounted(true);
  }
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
  // hides once it comes to rest: at once (before it paints in flow) if
  // nothing will slide it out, else after the group's glide settles
  useLayoutEffect(() => {
    const node = el.current;
    if (show || !node) return;
    if (!willGlide(node)) {
      setVisible(false);
      return;
    }
    let reopened = false;
    // the group starts its glide later in this commit
    queueMicrotask(() =>
      settled(node).then(() => reopened || setVisible(false)),
    );
    return () => {
      reopened = true;
    };
  }, [show, willGlide]);
  return mounted ?
      <Activity mode={visible ? 'visible' : 'hidden'}>
        <div
          ref={ref}
          className={className ? `motion-reveal ${className}` : 'motion-reveal'}
          data-visible={visible || undefined}
        >
          {shown.current}
        </div>
      </Activity>
    : null;
}
