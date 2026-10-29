import { useMemo, useState } from 'react';
import { LiveProvider } from 'react-live';

import DemoLabel from './autorun/DemoLabel';
import type { AutoRunScript } from './autorun/script';
import { useAutoRun } from './autorun/useAutoRun';
import { useInFlightCount } from './InFlightCount';
import Preview from './Preview';
import PreviewWrapper, { PreviewHeaderControls } from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import { routerTrailer } from './router';
import type { CodeDocument } from '../editor/codeModel';
import type { CodeControl, PreviewProps } from '../types';
import type { LogOptions } from './store/actionLog';
import { callerNow } from './store/callSite';
import SchemaRegistry from './store/schemaRegistry';
import type { ShowStore } from './store/storeView';
import { joinDocuments } from './transformCode';
import { useCodeManagers } from './useCodeManagers';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  documents: readonly CodeDocument[];
  /** Row's fixtures, folded into the header (see PreviewWrapper) */
  fixtureContent?: React.ReactNode;
  renderCount: boolean;
  inFlight?: boolean;
  actionLog?: LogOptions;
  autoRun?: AutoRunScript;
  /** Opens or closes the Store for the demo, without saving it */
  showStore: ShowStore;
  /** Demo layout: the code in the result's place, and its toggle (../index.tsx) */
  code?: CodeControl;
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
  inFlight = false,
  actionLog,
  autoRun,
  showStore,
  code: codeControl,
}: LivePreviewProps<T>) {
  usePlaygroundConsoleDemotion();
  const { onCommit, badge } = useRenderCount(renderCount);
  const inFlightCount = useInFlightCount(inFlight);
  const code = useMemo(
    () => joinDocuments(documents) + routerTrailer(documents),
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
  const [registry] = useState(
    // credits the app's actions to the hook, component or event sending them
    () => new SchemaRegistry({ caller: callerNow, ...actionLog }),
  );
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
        headerControls={
          <PreviewHeaderControls
            row={row}
            badge={
              <>
                {inFlightCount.badge}
                {badge}
              </>
            }
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
          observer={inFlightCount.manager}
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
