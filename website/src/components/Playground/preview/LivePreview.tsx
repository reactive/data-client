import { useMemo } from 'react';
import { LiveProvider } from 'react-live';

import Preview from './Preview';
import { ResetButton } from './PreviewError';
import PreviewWrapper from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import { previewScope } from './scope';
import SchemaRegistry from './store/schemaRegistry';
import transformCode from './transformCode';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';
import type { PreviewProps } from '../types';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  code: string;
  renderCount: boolean;
}

export default function LivePreview<T>({
  code,
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
  renderCount,
}: LivePreviewProps<T>) {
  usePlaygroundConsoleDemotion();
  const { onCommit, badge } = useRenderCount(renderCount);
  const { key, restored, reset, ...handlers } = usePreviewReset(code);
  // outlives remounts, so a restored store keeps its schemas
  const registry = useMemo(() => new SchemaRegistry(), []);
  const getInterceptorData = useMemo(
    () =>
      restored ?
        () => restored.interceptorData as T
      : getInitialInterceptorData,
    [restored, getInitialInterceptorData],
  );

  return (
    <LiveProvider
      key={key}
      code={code}
      transformCode={transformCode}
      enableTypeScript
      noInline
      scope={previewScope}
    >
      <PreviewWrapper
        headerControls={
          <>
            {badge}
            <ResetButton onClick={reset} />
          </>
        }
      >
        <Preview
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
          getInitialInterceptorData={getInterceptorData}
          onCommit={onCommit}
          initialState={restored?.state}
          registry={registry}
          onReset={reset}
          {...handlers}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
