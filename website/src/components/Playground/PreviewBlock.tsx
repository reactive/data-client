import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';
import { LiveError, LivePreview } from 'react-live';

import Boundary from './Boundary';
import { Loading } from './DesignSystem/Loading';
import styles from './styles.module.css';

export default function PreviewBlock() {
  return (
    <>
      <Boundary fallback={<Loading />}>
        <LivePreview />
      </Boundary>
      {/* <Loading /> */}
      <LiveError className={styles.playgroundError} />
    </>
  );
}
