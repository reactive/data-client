import Translate from '@docusaurus/Translate';
import React from 'react';

import Header from './Header';
import styles from './styles.module.css';

export default function PreviewWrapper({ children }: Props) {
  return (
    <div className={styles.previewWrapper}>
      <Header>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          🔴 Live Preview
        </Translate>
      </Header>
      <div className={styles.playgroundResult}>{children}</div>
    </div>
  );
}
interface Props {
  children: React.ReactNode;
}
