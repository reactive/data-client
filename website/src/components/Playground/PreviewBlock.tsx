import React from 'react';
import { LiveError, LivePreview } from 'react-live';

import styles from './styles.module.css';

export default function PreviewBlock() {
  return (
    <>
      <LivePreview />
      <LiveError className={styles.playgroundError} />
    </>
  );
}
