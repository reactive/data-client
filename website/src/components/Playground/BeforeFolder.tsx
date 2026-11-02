import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import Header from './Header';
import { sheetClassName } from './preview/PendingSheet';
import { previewSurfaceClassName } from './preview/PreviewWrapper';
import styles from './styles.module.css';
import { BEFORE_RESTART } from './types';

/** A `before` replay (../index.tsx): a folder like the preview's, beside it
 * (above it when narrow), with an app showing the old behavior. It is
 * watched, not used: inert, the preview's `autoRun` plays in it step for
 * step (./preview/autorun/stage.ts `mirrorStage`), from the start on each
 * run */
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
      inert
    >
      <Header className={styles.previewHeader}>
        <span className={styles.beforeLabel}>{label}</span>
      </Header>
      <div className={styles.playgroundResult}>
        <div className={previewSurfaceClassName}>
          <div key={run} className={sheetClassName}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
