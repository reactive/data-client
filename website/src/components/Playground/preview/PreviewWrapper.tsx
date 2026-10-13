import React, { useState } from 'react';

import Header from '../Header';
import { liveLabel } from '../liveLabel';
import styles from '../styles.module.css';
import { RouterControlsSlot } from './routerSlot';

export default function PreviewWrapper({
  children,
  headerControls,
  label,
  ref,
}: Props) {
  const [routerSlot, setRouterSlot] = useState<HTMLElement | null>(null);
  return (
    <div className={styles.previewWrapper} ref={ref}>
      <Header className={styles.previewHeader}>
        {label ?? <span className={styles.liveLabel}>{liveLabel()}</span>}
        <span className={styles.routerSlot} ref={setRouterSlot} />
        <span className={styles.previewControls}>{headerControls}</span>
      </Header>
      <RouterControlsSlot value={routerSlot}>
        <div className={styles.playgroundResult}>{children}</div>
      </RouterControlsSlot>
    </div>
  );
}
interface Props {
  children: React.ReactNode;
  headerControls?: React.ReactNode;
  /** In place of the "Live Preview" label (e.g. the demo's `DemoLabel`) */
  label?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}
