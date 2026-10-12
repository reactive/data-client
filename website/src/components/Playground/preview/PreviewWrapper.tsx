import { translate } from '@docusaurus/Translate';
import React from 'react';

import Header from '../Header';
import styles from '../styles.module.css';

export default function PreviewWrapper({
  children,
  headerControls,
  label,
  ref,
}: Props) {
  return (
    <div className={styles.previewWrapper} ref={ref}>
      <Header className={styles.previewHeader}>
        {label ?? <span className={styles.liveLabel}>{liveLabel()}</span>}
        <span className={styles.previewControls}>{headerControls}</span>
      </Header>
      <div className={styles.playgroundResult}>{children}</div>
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

/** The preview's "Live Preview" label text */
export const liveLabel = () =>
  translate({
    id: 'theme.Playground.result',
    description: 'The result label of the live codeblocks',
    message: 'Live Preview',
  });
