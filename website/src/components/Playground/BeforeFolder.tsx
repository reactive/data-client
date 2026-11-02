import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import Header from './Header';
import { sheetClassName } from './preview/PendingSheet';
import { previewSurfaceClassName } from './preview/PreviewWrapper';
import styles from './styles.module.css';
import { BEFORE_RESTART, DEMO_REPLAY } from './types';
// its app is drawn in the design system's classes, like the preview's; it
// shows from the HTML on, before the preview's own chunk loads them
import './DesignSystem/design-system.css';

/** A `before` replay (../index.tsx): a folder like the preview's, beside it
 * (above it when narrow), with an app showing the old behavior. It is
 * watched, not used: its app is inert, and the preview's `autoRun` plays in
 * it step for step (./preview/autorun/stage.ts `mirrorStage`), from the start
 * on each run. With `replayable` (the preview has an `autoRun`), its
 * header's Replay button replays the demo in both */
export default function BeforeFolder({
  label,
  replayable,
  children,
}: {
  label: string;
  replayable: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const restart = () => setRun(n => n + 1);
    el.addEventListener(BEFORE_RESTART, restart);
    return () => el.removeEventListener(BEFORE_RESTART, restart);
  }, []);
  return (
    <div
      ref={ref}
      className={clsx(styles.previewWrapper, styles.beforeFolder)}
      data-before
    >
      <Header className={styles.previewHeader}>
        <span className={clsx(styles.liveLabel, styles.beforeLabel)}>
          {label}
        </span>
        {replayable ?
          <button
            type="button"
            className={clsx(
              'clean-btn',
              styles.headerButton,
              styles.replayButton,
            )}
            // a demo control: pressing it doesn't end a run as the reader's
            // input does, it starts one over
            data-autorun-control
            onClick={event =>
              event.currentTarget.dispatchEvent(
                new Event(DEMO_REPLAY, { bubbles: true }),
              )
            }
          >
            <ReplayIcon />
            {translate({
              id: 'playground.demo.replayShort',
              message: 'Replay',
            })}
          </button>
        : null}
      </Header>
      <div className={styles.playgroundResult} inert>
        <div className={previewSurfaceClassName}>
          <div key={run} className={sheetClassName}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A play mark: pressing it plays the demo again */
function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="0.85em" height="0.85em" aria-hidden="true">
      <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
    </svg>
  );
}
