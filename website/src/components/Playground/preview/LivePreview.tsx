import { useMemo, useState } from 'react';
import { LiveProvider } from 'react-live';

import DemoLabel from './autorun/DemoLabel';
import type { AutoRunScript } from './autorun/script';
import { useAutoRun } from './autorun/useAutoRun';
import FixturePreview from './FixturePreview';
import Preview from './Preview';
import { ResetButton } from './PreviewError';
import PreviewWrapper from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import { routerTrailer } from './router';
import type { CodeDocument } from '../editor/codeModel';
import type { PreviewProps } from '../types';
import type { LogOptions } from './store/actionLog';
import SchemaRegistry from './store/schemaRegistry';
import { StoreHeaderToggle } from './StoreToggle';
import { useCodeManagers } from './useCodeManagers';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  documents: readonly CodeDocument[];
  renderCount: boolean;
  actionLog?: LogOptions;
  autoRun?: AutoRunScript;
  /** Opens or closes the Store for the demo, without saving it */
  showStore: (open: boolean) => void;
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
  autoRun,
  showStore,
}: LivePreviewProps<T>) {
  usePlaygroundConsoleDemotion();
  const { onCommit, badge } = useRenderCount(renderCount);
  // `;` keeps a half-typed statement from absorbing the next document.
  const code = useMemo(
    () =>
      documents.map(document => document.value).join('\n;\n') +
      routerTrailer(documents),
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
  const demo = useAutoRun(autoRun, reset, showStore);
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
        ref={demo.watch}
        label={
          autoRun ?
            <DemoLabel player={demo.player} onPlay={demo.replay} />
          : undefined
        }
        fixtures={
          row && fixtures?.length ?
            <FixturePreview fixtures={fixtures} />
          : undefined
        }
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
          managerHost={managers.host}
          onReset={reset}
          {...handlers}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
