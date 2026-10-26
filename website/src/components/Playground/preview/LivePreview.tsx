import { useMemo, useState } from 'react';
import { LiveProvider } from 'react-live';

import DemoLabel from './autorun/DemoLabel';
import type { AutoRunScript } from './autorun/script';
import { useAutoRun } from './autorun/useAutoRun';
import Preview from './Preview';
import PreviewWrapper, { PreviewHeaderControls } from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import { routerTrailer } from './router';
import type { CodeDocument } from '../editor/codeModel';
import type { CodeControl, PreviewProps } from '../types';
import type { LogOptions } from './store/actionLog';
import SchemaRegistry from './store/schemaRegistry';
import type { ShowStore } from './store/storeView';
import { useCodeManagers } from './useCodeManagers';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  documents: readonly CodeDocument[];
  /** Row's fixtures, folded into the header (see PreviewWrapper) */
  fixtureContent?: React.ReactNode;
  renderCount: boolean;
  actionLog?: LogOptions;
  autoRun?: AutoRunScript;
  /** Opens or closes the Store for the demo, without saving it */
  showStore: ShowStore;
  /** Demo layout: the code in the result's place, and its toggle (../index.tsx) */
  code?: CodeControl;
  clock?: boolean;
}

export default function LivePreview<T>({
  documents,
  fixtureContent,
  storeOpen,
  storeMoves,
  toggleStore,
  row,
  storeHost,
  fixtures,
  getInitialInterceptorData,
  renderCount,
  actionLog,
  autoRun,
  showStore,
  code: codeControl,
  clock,
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
        fixtures={fixtureContent}
        code={codeControl}
        clock={clock}
        headerControls={
          <PreviewHeaderControls
            row={row}
            badge={badge}
            storeOpen={storeOpen}
            toggleStore={toggleStore}
            reset={reset}
          />
        }
      >
        <Preview
          key={storeKey}
          storeOpen={storeOpen}
          storeMoves={storeMoves}
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
