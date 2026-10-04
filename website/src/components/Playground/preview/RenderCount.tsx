import React, { useCallback, useRef } from 'react';

import styles from '../styles.module.css';

/** Counts React commits of the preview (via `<Profiler onRender>`); click the badge to reset.
 *
 * Writes the count straight to the DOM so counting never causes a commit of its own.
 */
export function useRenderCount(enabled: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const count = useRef(0);
  const show = (n: number) => {
    count.current = n;
    if (ref.current) ref.current.textContent = label(n);
  };
  // Stable so memo(Preview) skips re-rendering on code edits
  const onCommit = useCallback(() => show(count.current + 1), []);
  if (!enabled) return {};
  const badge = (
    <button
      ref={ref}
      type="button"
      className={styles.renderCount}
      title="React commits of this preview. Click to reset."
      onClick={() => show(0)}
    >
      {label(0)}
    </button>
  );
  return { onCommit, badge };
}

const label = (n: number) => `${n} render${n === 1 ? '' : 's'}`;
