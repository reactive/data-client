import { useCallback, useMemo, useState } from 'react';
import { LiveProvider } from 'react-live';

import ManagerHost, {
  REGISTER_MANAGERS,
  managersTrailer,
  managersVersion,
} from './managers';
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
import type { CodeDocument } from '../editor/codeModel';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  documents: readonly CodeDocument[];
  renderCount: boolean;
  actionLog?: LogOptions;
}

export default function LivePreview<T>({
  documents,
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
  const managers = useMemo(() => managersVersion(documents), [documents]);
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
  // outlives remounts, so a new store gets the last registered getManagers()
  const managerHost = useMemo(() => new ManagerHost(remount), [remount]);
  const scope = useMemo(
    () => ({ ...previewScope, [REGISTER_MANAGERS]: managerHost.register }),
    [managerHost],
  );
  // changes only along with `code`, so it never re-runs the code by itself
  const transformWithManagers = useCallback(
    (code: string) => transformCode(code) + managersTrailer(managers),
    [managers],
  );
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
      transformCode={transformWithManagers}
      enableTypeScript
      noInline
      scope={scope}
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
          managerHost={managerHost}
          onReset={reset}
          {...handlers}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
