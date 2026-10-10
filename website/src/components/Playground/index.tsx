import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';
import clsx from 'clsx';
import React, { lazy, useDeferredValue, useState } from 'react';

import Boundary from './Boundary';
import { useCodeDocuments } from './editor/codeModel';
import EditorShell from './editor/EditorShell';
import EditorSurface from './editor/EditorSurface';
import FixturePreview from './preview/FixturePreview';
import type LivePreviewType from './preview/LivePreview';
import PreviewWrapper from './preview/PreviewWrapper';
import type { LogOptions } from './preview/store/actionLog';
import {
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
  /** Tabs for files + editor beside preview (when wide enough) */
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
}: PlaygroundProps<T>) {
  // read once, as the preview first builds its log
  const actionLog = { ...DOCS_LOG, ...logOptions };
  const model = useCodeDocuments(children, defaultTab);
  // Defer preview transpilation so editor input remains responsive.
  const documents = useDeferredValue(model.documents);

  const [storeOpen, toggleStore, closeStore] = useStoreOpen(
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

  const editor = (
    <EditorShell>
      <EditorSurface
        {...model}
        interactive={editorInteractive}
        layout={row ? 'row' : 'stacked'}
        variant="playground"
        fixtureContent={
          fixtures.length ? <FixturePreview fixtures={fixtures} /> : undefined
        }
        headerControls={headerControls}
        cover={
          row ? <div ref={setStoreHost} className={styles.storeHost} /> : null
        }
        covered={codeCovered}
        // switching files asks for the code back (when the tabs stay visible)
        onTabSelect={codeCovered ? closeStore : undefined}
      />
    </EditorShell>
  );
  // Live preview only while visible — unmounts when hidden (resets store).
  const preview =
    hidden ? previewLoading : (
      <Boundary fallback={previewLoading}>
        <LivePreview
          documents={documents}
          groupId={groupId}
          storeOpen={storeOpen}
          toggleStore={toggleStore}
          row={row}
          storeHost={storeHost}
          fixtures={fixtures}
          getInitialInterceptorData={getInitialInterceptorData}
          renderCount={renderCount}
          actionLog={actionLog}
        />
      </Boundary>
    );

  return (
    <div
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

/** SSR, crawler, hidden and loading state: empty preview frame + Store toggle */
const previewLoading = (
  <PreviewWrapper headerControls={<StoreHeaderToggle />}>
    <div className={styles.playgroundPreview} />
    <StoreToggle />
  </PreviewWrapper>
);

const LivePreview = lazy<typeof LivePreviewType>(() =>
  isBot ?
    Promise.resolve({ default: () => previewLoading })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './preview/LivePreview'
    ),
);
