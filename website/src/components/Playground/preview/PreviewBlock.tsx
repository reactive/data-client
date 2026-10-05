import React, { memo, Profiler, type ProfilerOnRenderCallback } from 'react';
import { LiveError, LivePreview } from 'react-live';

import Boundary from '../Boundary';
import { Loading } from '../DesignSystem/Loading';
import styles from '../styles.module.css';

function PreviewBlock({ onCommit }: { onCommit?: ProfilerOnRenderCallback }) {
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
// memo: Store inspector toggles re-render Preview; they must not reach the
// profiled tree (or bump the render badge).
export default memo(PreviewBlock);
