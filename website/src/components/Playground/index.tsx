import Translate from '@docusaurus/Translate';
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';
import clsx from 'clsx';
import React, { lazy, useDeferredValue, useState } from 'react';

import Boundary from './Boundary';
import { useCodeDocuments } from './editor/codeModel';
import EditorShell from './editor/EditorShell';
import EditorSurface from './editor/EditorSurface';
import type { AutoRunScript } from './preview/autorun/script';
import FixturePreview from './preview/FixturePreview';
import type LivePreviewType from './preview/LivePreview';
import PreviewWrapper from './preview/PreviewWrapper';
import type { LogOptions } from './preview/store/actionLog';
import {
  StoreBadge,
  StoreHeaderToggle,
  StoreToggle,
  useStoreOpen,
} from './preview/StoreToggle';
import styles from './styles.module.css';
import type { FixtureOrInterceptor } from './types';
import { isBot } from './userAgent';

export interface PlaygroundProps<T = any> {
  children: React.ReactNode;
  /** Tab-storage key for the Store inspector's open/closed choice */
  groupId?: string;
  /** Store inspector open by default */
  defaultOpen?: 'y' | 'n';
  /** Tabs for files + editor beside preview (when wide enough).
   * Use when the code is one tall open file and the preview is short; row
   * folds fixtures behind a toggle in the preview's header. Stay stacked when
   * the Store opens by default (it would cover the code), or when the preview
   * renders a long list (it gets tall in the narrow column). */
  row?: boolean;
  /** Inactive (e.g. unselected Demo tab): no Monaco until first shown, no preview */
  hidden?: boolean;
  fixtures?: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
  /** Title of the file tab to open; overrides `collapsed` metastrings */
  defaultTab?: string;
  headerControls?: React.ReactNode;
  /** Show a badge counting the preview's React commits (e.g. one notification vs N) */
  renderCount?: boolean;
  /** How the Store's action log records (e.g. `{ recordFrom: 'open' }` for
   * a fast stream), over `DOCS_LOG` */
  actionLog?: LogOptions;
  /** A demo the preview plays by itself once in view (its Live Preview label
   * replays it). Declare it once at module level: its identity keys the
   * once-per-page autostart. */
  autoRun?: AutoRunScript;
}

/** A page holds several playgrounds: each keeps a short history (a
 * devtool for a whole site would keep more, the log's own defaults) */
const DOCS_LOG: LogOptions = { limit: 150, updateLimit: 10, trimEvery: 25 };

export default function Playground<T>({
  children,
  groupId = 'playground',
  defaultOpen = 'n',
  row = false,
  hidden = false,
  fixtures = [],
  getInitialInterceptorData,
  defaultTab,
  headerControls,
  renderCount = false,
  actionLog: logOptions,
  autoRun,
}: PlaygroundProps<T>) {
  // read once, as the preview first builds its log
  const actionLog = { ...DOCS_LOG, ...logOptions };
  const model = useCodeDocuments(children, defaultTab);
  // Defer preview transpilation so editor input remains responsive.
  const documents = useDeferredValue(model.documents);

  const [storeOpen, toggleStore, showStore] = useStoreOpen(
    groupId,
    defaultOpen,
  );
  // Row layout: the Store slides over the code, leaving the preview usable
  const [storeHost, setStoreHost] = useState<HTMLDivElement | null>(null);
  const codeCovered = row && storeOpen;

  // Hydrate Monaco on first show and keep it (preserves undo / go-to-def).
  const [editorInteractive, setEditorInteractive] = useState(!hidden);
  useIsomorphicLayoutEffect(() => {
    if (!hidden) setEditorInteractive(true);
  }, [hidden]);

  const fixtureContent =
    fixtures.length ? <FixturePreview fixtures={fixtures} /> : undefined;
  const previewFixtures = row ? fixtureContent : undefined;

  const editor = (
    <EditorShell>
      <EditorSurface
        {...model}
        interactive={editorInteractive}
        layout={row ? 'row' : 'stacked'}
        variant="playground"
        fixtureContent={fixtureContent}
        headerControls={headerControls}
        cover={
          row ?
            <>
              <div ref={setStoreHost} className={styles.storeHost} />
              <StoreBadge open={storeOpen} onClick={toggleStore} />
            </>
          : null
        }
        covered={codeCovered}
        coverTitle={<Translate id="playground.store">Store</Translate>}
      />
    </EditorShell>
  );
  // Live preview only while visible — unmounts when hidden (resets store).
  const loading = <PreviewLoading row={row} fixtureContent={previewFixtures} />;
  const preview =
    hidden ? loading : (
      <Boundary fallback={loading}>
        <LivePreview
          documents={documents}
          fixtureContent={previewFixtures}
          storeOpen={storeOpen}
          toggleStore={toggleStore}
          row={row}
          storeHost={storeHost}
          fixtures={fixtures}
          getInitialInterceptorData={getInitialInterceptorData}
          renderCount={renderCount}
          actionLog={actionLog}
          autoRun={autoRun}
          showStore={showStore}
        />
      </Boundary>
    );

  return (
    <div
      // where the demo (autoRun) acts
      data-playground
      className={clsx(styles.playgroundQueryContainer, {
        [styles.hidden]: hidden,
      })}
    >
      <div
        className={clsx(styles.playgroundContainer, {
          [styles.row]: row,
        })}
      >
        {editor}
        {preview}
      </div>
    </div>
  );
}

/** SSR, crawler, hidden and loading state: empty preview frame + Store
 * toggle (the side strip, unless the code's corner badge is it), and row's
 * fixtures, already usable */
function PreviewLoading({
  row,
  fixtureContent,
}: {
  row: boolean;
  fixtureContent?: React.ReactNode;
}) {
  return (
    <PreviewWrapper
      headerControls={<StoreHeaderToggle />}
      fixtures={fixtureContent}
    >
      <div className={styles.playgroundPreview} />
      {row ? null : <StoreToggle />}
    </PreviewWrapper>
  );
}

const LivePreview = lazy<typeof LivePreviewType>(() =>
  isBot ?
    Promise.resolve({ default: PreviewLoading })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './preview/LivePreview'
    ),
);
