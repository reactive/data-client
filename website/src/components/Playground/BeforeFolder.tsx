import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import Header from './Header';
import { sheetClassName } from './preview/PendingSheet';
import { previewSurfaceClassName } from './preview/PreviewWrapper';
import { CodeIcon } from './preview/StoreToggle';
import styles from './styles.module.css';
import { BEFORE_END, BEFORE_RESTART, DEMO_REPLAY } from './types';
// its app is drawn in the design system's classes, like the preview's; it
// shows from the HTML on, before the preview's own chunk loads them
import './DesignSystem/design-system.css';

/** A `before` replay (./index.tsx): a folder like the preview's, beside it
 * (above it when narrow), with an app showing the old behavior. It is
 * watched, not used: its app is inert, and the preview's `autoRun` plays in
 * it step for step (./preview/autorun/stage.ts `mirrorStage`), from the start
 * on each run (`data-playing` while it does). Between runs, its end screen
 * offers Play (Replay once it has played), with `replayable`, and Show code,
 * which shows the code in its place */
export default function BeforeFolder({
  label,
  replayable,
  onShowCode,
  showCodeRef,
  children,
}: {
  label: string;
  /** The preview has an `autoRun` to play in it */
  replayable: boolean;
  onShowCode: () => void;
  /** The Show code button, which takes focus back from the code */
  showCodeRef?: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const restart = () => {
      setRun(n => n + 1);
      setPlaying(true);
    };
    const end = () => setPlaying(false);
    el.addEventListener(BEFORE_RESTART, restart);
    el.addEventListener(BEFORE_END, end);
    return () => {
      el.removeEventListener(BEFORE_RESTART, restart);
      el.removeEventListener(BEFORE_END, end);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={clsx(styles.previewWrapper, styles.beforeFolder)}
      data-before
      data-playing={playing || undefined}
    >
      <Header className={styles.previewHeader}>
        <span className={clsx(styles.liveLabel, styles.beforeLabel)}>
          {label}
        </span>
      </Header>
      <div className={styles.playgroundResult}>
        <div className={previewSurfaceClassName} inert>
          <div key={run} className={sheetClassName}>
            {children}
          </div>
        </div>
        {/* over the replay, like a video's: gone while it plays */}
        <div className={styles.endScreen} inert={playing}>
          <div className={styles.endControls}>
            {replayable ?
              <button
                type="button"
                className={clsx('clean-btn', styles.endButton)}
                data-primary
                // a demo control: pressing it doesn't end a run as the
                // reader's input does, it starts one over
                data-autorun-control
                onClick={event =>
                  event.currentTarget.dispatchEvent(
                    new Event(DEMO_REPLAY, { bubbles: true }),
                  )
                }
              >
                <PlayIcon />
                {run ?
                  translate({
                    id: 'playground.demo.replayShort',
                    message: 'Replay',
                  })
                : translate({ id: 'playground.demo.play', message: 'Play' })}
              </button>
            : null}
            <button
              ref={showCodeRef}
              type="button"
              className={clsx('clean-btn', styles.endButton)}
              onClick={onShowCode}
            >
              <CodeIcon />
              {translate({ id: 'playground.code.show', message: 'Show code' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A play mark: pressing it plays the demo (again) */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="0.85em" height="0.85em" aria-hidden="true">
      <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
    </svg>
  );
}
