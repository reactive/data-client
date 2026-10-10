import { useMemo, useState } from 'react';
import { LiveProvider } from 'react-live';

import Preview from './Preview';
import { ResetButton } from './PreviewError';
import PreviewWrapper from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import { previewScope } from './scope';
import type { PreviewProps } from '../types';
import type { LogOptions } from './store/actionLog';
import SchemaRegistry from './store/schemaRegistry';
import { StoreHeaderToggle } from './StoreToggle';
import transformCode from './transformCode';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  code: string;
  renderCount: boolean;
  actionLog?: LogOptions;
}

export default function LivePreview<T>({
  code,
  groupId,
  storeOpen,
  toggleStore,
  row,
  storeHost,
  fixtures,
  getInitialInterceptorData,
  renderCount,
  actionLog,
}: LivePreviewProps<T>) {
  usePlaygroundConsoleDemotion();
  const { onCommit, badge } = useRenderCount(renderCount);
  const { key, history, replacedHistory, restored, reset, ...handlers } =
    usePreviewReset(code);
  // outlives remounts, so a restored store keeps its schemas and actions
  const [registry] = useState(() => new SchemaRegistry(actionLog));
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
            <StoreHeaderToggle open={storeOpen} onClick={toggleStore} />
            <ResetButton onClick={reset} />
          </>
        }
      >
        <Preview
          groupId={groupId}
          storeOpen={storeOpen}
          toggleStore={toggleStore}
          row={row}
          storeHost={storeHost}
          fixtures={fixtures}
          getInitialInterceptorData={getInterceptorData}
          onCommit={onCommit}
          initialState={restored?.state}
          registry={registry}
          history={history}
          replacedHistory={replacedHistory}
          onReset={reset}
          {...handlers}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
