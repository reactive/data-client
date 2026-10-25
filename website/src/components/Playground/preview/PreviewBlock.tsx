import React, {
  memo,
  Profiler,
  useContext,
  type ProfilerOnRenderCallback,
} from 'react';
import { LiveContext, LivePreview } from 'react-live';

import Boundary from '../Boundary';
import PendingSheet from './PendingSheet';
import PreviewError, { type PreviewErrorProps } from './PreviewError';
import styles from '../styles.module.css';

function PreviewBlock({
  onCommit,
  ...errorProps
}: PreviewErrorProps & { onCommit?: ProfilerOnRenderCallback }) {
  // react-live runs the code only after its first render: until it has, the
  // app is still loading (not an app that renders nothing)
  const { newCode, error } = useContext(LiveContext);
  const preview =
    newCode === undefined && !error ?
      <PendingSheet />
    : <LivePreview className={styles.sheet} />;
  return (
    <>
      <Boundary fallback={<PendingSheet />}>
        {onCommit ?
          <Profiler id="playground-preview" onRender={onCommit}>
            {preview}
          </Profiler>
        : preview}
      </Boundary>
      <PreviewError {...errorProps} />
    </>
  );
}
// memo: Store inspector toggles re-render Preview; they must not reach the
// profiled tree (or bump the render badge).
export default memo(PreviewBlock);
