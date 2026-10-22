import { usePluralForm } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import React, { useCallback, useRef, useState } from 'react';

import styles from '../styles.module.css';

/** Counts React commits of the preview (via `<Profiler onRender>`); click the badge to reset.
 *
 * Writes the count straight to the DOM so counting never causes a commit of its own.
 * Stays hidden until the first commit, so a build where `onRender` never fires
 * (e.g. without React's profiling build) shows no badge rather than a wrong count.
 */
export function useRenderCount(enabled: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const count = useRef(0);
  // selectMessage is new each render, so keep the first: a page's locale never
  // changes, and a stable label keeps onCommit stable
  const { selectMessage } = usePluralForm();
  const [label] = useState(
    () => (n: number) =>
      selectMessage(
        n,
        translate(
          {
            id: 'playground.renderCount',
            description: 'Plural forms, separated by |',
            message: '{count} render|{count} renders',
          },
          { count: n },
        ),
      ),
  );
  // Stable so memo(Preview) skips re-rendering on code edits
  const onCommit = useCallback(
    () => show(ref.current, label(++count.current)),
    [label],
  );
  if (!enabled) return {};
  const badge = (
    <button
      ref={ref}
      type="button"
      hidden
      className={styles.renderCount}
      title={translate({
        id: 'playground.renderCount.title',
        message: 'React commits of this preview. Click to reset.',
      })}
      onClick={() => show(ref.current, label((count.current = 0)))}
    />
  );
  return { onCommit, badge };
}

function show(badge: HTMLButtonElement | null, text: string) {
  if (!badge) return;
  badge.textContent = text;
  badge.hidden = false;
}
