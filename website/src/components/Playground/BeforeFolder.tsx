import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import Header from './Header';
import { sheetClassName } from './preview/PendingSheet';
import { previewSurfaceClassName } from './preview/PreviewWrapper';
import styles from './styles.module.css';
import { BEFORE_RESTART } from './types';
// its app is drawn in the design system's classes, like the preview's; it
// shows from the HTML on, before the preview's own chunk loads them
import './DesignSystem/design-system.css';

/** A `before` replay (../index.tsx): a folder like the preview's, beside it
 * (above it when narrow), with an app showing the old behavior. It is
 * watched, not used: its app is inert, and the preview's `autoRun` plays in
 * it step for step (./preview/autorun/stage.ts `mirrorStage`), from the start
 * on each run. Its controls are under both (./CompareBar.tsx) */
export default function BeforeFolder({
  label,
  children,
}: {
  label: string;
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
