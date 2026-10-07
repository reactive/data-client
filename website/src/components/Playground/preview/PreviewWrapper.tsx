import Translate from '@docusaurus/Translate';
import React from 'react';

import Header from '../Header';
import styles from '../styles.module.css';

export default function PreviewWrapper({ children, headerControls }: Props) {
  return (
    <div className={styles.previewWrapper}>
      <Header className={styles.previewHeader}>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          🔴 Live Preview
        </Translate>
        <span className={styles.previewControls}>{headerControls}</span>
      </Header>
      <div className={styles.playgroundResult}>{children}</div>
    </div>
  );
}
interface Props {
  children: React.ReactNode;
  headerControls?: React.ReactNode;
}
