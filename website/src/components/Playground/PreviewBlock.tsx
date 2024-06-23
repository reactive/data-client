import React from 'react';
import { LiveError, LivePreview } from 'react-live';

import Boundary from './Boundary';
import styles from './styles.module.css';

export default function PreviewBlock() {
  return (
    <>
      <Boundary fallback={<LivePreviewLoader />}>
        <LivePreview />
      </Boundary>
      <LiveError className={styles.playgroundError} />
    </>
  );
}
function LivePreviewLoader() {
  return <div>Loading...</div>;
}
