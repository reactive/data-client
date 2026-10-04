import React, { Profiler, type ProfilerOnRenderCallback } from 'react';
import { LiveError, LivePreview } from 'react-live';

import Boundary from '../Boundary';
import { Loading } from '../DesignSystem/Loading';
import styles from '../styles.module.css';

export default function PreviewBlock({
  onCommit,
}: {
  onCommit?: ProfilerOnRenderCallback;
}) {
  return (
    <>
      <Boundary fallback={<Loading />}>
        {onCommit ?
          <Profiler id="playground-preview" onRender={onCommit}>
            <LivePreview />
          </Profiler>
        : <LivePreview />}
      </Boundary>
      <LiveError className={styles.playgroundError} />
    </>
  );
}
