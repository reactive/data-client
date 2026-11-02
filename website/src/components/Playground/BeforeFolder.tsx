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
 * on each run. Once a run is over and what it set moving has settled, a
 * beat later, its end screen (`data-ended`) offers Play (Replay once it has
 * played), with `replayable`, and Show code, which shows the code in its
 * place. Until the demo has played (or won't play by itself), it shows
 * none */
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
  showCodeRef: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  // with nothing to play, there's nothing to wait for
  const [ended, setEnded] = useState(!replayable);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // the latest run: a restart outdates an end still settling
    let latest = 0;
    // once per run: the reader's input ends an idle demo again and again
    let ending = false;
    const restart = () => {
      latest++;
      ending = false;
      setRun(n => n + 1);
      setEnded(false);
    };
    const end = async () => {
      if (ending) return;
      ending = true;
      const mine = latest;
      await settled(el.closest('[data-playground]') ?? el);
      if (mine === latest) setEnded(true);
    };
    el.addEventListener(BEFORE_RESTART, restart);
    el.addEventListener(BEFORE_END, end);
    return () => {
      latest++;
      el.removeEventListener(BEFORE_RESTART, restart);
      el.removeEventListener(BEFORE_END, end);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={clsx(styles.previewWrapper, styles.beforeFolder)}
      data-before
      data-ended={ended || undefined}
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
        <div className={styles.endScreen} inert={!ended}>
          <div className={styles.endControls}>
            {replayable ?
              <button
                type="button"
                className={clsx('clean-btn', styles.endButton)}
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

/** Once what moves in `root` has stopped (a row's highlight, a toast
 * fading out), and a beat after: the last step lands before the end screen
 * covers it. Animations that loop (a pulsing dot) never stop, so don't
 * count; jsdom has none */
async function settled(root: Element) {
  // what the last step set off starts on the next frames
  await new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
  const moving = (root.getAnimations?.({ subtree: true }) ?? []).filter(
    animation => animation.effect?.getComputedTiming().endTime !== Infinity,
  );
  await Promise.allSettled(moving.map(animation => animation.finished));
  await new Promise(resolve => setTimeout(resolve, BEAT));
}
const BEAT = 500;
