import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';
import tipStyles from '../tips.module.css';
import useTips from '../useTips';

/** One line, clipped; when it is, the whole text floats over it as a tip
 * (../useTips: hover, keyboard focus or a tap). `always` for a short form
 * that never shows all of `full`. */
export default function Clipped({
  children,
  full,
  className,
  always = false,
}: {
  children: React.ReactNode;
  full: string;
  className?: string;
  always?: boolean;
}) {
  const line = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(always);
  const tips = useTips<'full'>();

  // the line remounts as it turns into a button (and back), so observe anew
  useEffect(() => {
    const element = line.current;
    if (always || !element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() =>
      setClipped(element.scrollWidth > element.clientWidth),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [always, clipped]);

  const text = (
    <span ref={line} className={styles.line}>
      {children}
    </span>
  );
  if (!clipped)
    return <span className={clsx(styles.clipped, className)}>{text}</span>;
  return (
    <button
      type="button"
      {...tips.tappable('full', 'clean-btn', styles.clipped, className)}
      aria-label={full}
      aria-expanded={tips.open !== null}
    >
      {text}
      <span className={clsx(tipStyles.tip, styles.full)} aria-hidden>
        {full}
      </span>
    </button>
  );
}
