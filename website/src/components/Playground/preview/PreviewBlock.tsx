import React, { memo, Profiler, type ProfilerOnRenderCallback } from 'react';
import { LivePreview } from 'react-live';

import Boundary from '../Boundary';
import { Loading } from '../DesignSystem/Loading';
import PreviewError, { type PreviewErrorProps } from './PreviewError';

function PreviewBlock({
  onCommit,
  ...errorProps
}: PreviewErrorProps & { onCommit?: ProfilerOnRenderCallback }) {
  return (
    <>
      <Boundary fallback={<Loading />}>
        {onCommit ?
          <Profiler id="playground-preview" onRender={onCommit}>
            <LivePreview />
          </Profiler>
        : <LivePreview />}
      </Boundary>
      <PreviewError {...errorProps} />
    </>
  );
}
// memo: Store inspector toggles re-render Preview; they must not reach the
// profiled tree (or bump the render badge).
export default memo(PreviewBlock);
