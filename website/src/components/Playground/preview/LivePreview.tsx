import { useMemo, useState } from 'react';
import { LiveProvider } from 'react-live';

import Preview from './Preview';
import { ResetButton } from './PreviewError';
import PreviewWrapper from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import type { PreviewProps } from '../types';
import type { LogOptions } from './store/actionLog';
import SchemaRegistry from './store/schemaRegistry';
import { StoreHeaderToggle } from './StoreToggle';
import { useCodeManagers } from './useCodeManagers';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';
import type { CodeDocument } from '../editor/codeModel';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  documents: readonly CodeDocument[];
  renderCount: boolean;
  actionLog?: LogOptions;
}

export default function LivePreview<T>({
  documents,
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
  // `;` keeps a half-typed statement from absorbing the next document.
  const code = useMemo(
    () => documents.map(document => document.value).join('\n;\n'),
    [documents],
  );
  const {
    key,
    storeKey,
    history,
    replacedHistory,
    restored,
    reset,
    remount,
    ...handlers
  } = usePreviewReset(code);
  // outlives remounts, so a restored store keeps its schemas and actions
  const [registry] = useState(() => new SchemaRegistry(actionLog));
  const managers = useCodeManagers(documents, remount);
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
      transformCode={managers.transformCode}
      enableTypeScript
      noInline
      scope={managers.scope}
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
          key={storeKey}
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
          managerHost={managers.host}
          onReset={reset}
          {...handlers}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
