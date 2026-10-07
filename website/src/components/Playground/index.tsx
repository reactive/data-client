import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
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
import { StoreToggle } from './preview/StoreInspector';
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
}

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
}: PlaygroundProps<T>) {
  const { playgroundPosition } = (
    useDocusaurusContext().siteConfig.themeConfig as any
  ).liveCodeBlock;

  const model = useCodeDocuments(children, defaultTab);
  // Defer preview transpilation so editor input remains responsive.
  // `;` keeps a half-typed statement from absorbing the next document.
  const code = useDeferredValue(
    model.documents.map(document => document.value).join('\n;\n'),
  );

  // Hydrate Monaco on first show and keep it (preserves undo / go-to-def).
  const [editorInteractive, setEditorInteractive] = useState(!hidden);
  useIsomorphicLayoutEffect(() => {
    if (!hidden) setEditorInteractive(true);
  }, [hidden]);

  const editor = (
    <EditorShell key="editor">
      <EditorSurface
        {...model}
        interactive={editorInteractive}
        layout={row ? 'row' : 'stacked'}
        variant="playground"
        fixtureContent={
          fixtures.length ? <FixturePreview fixtures={fixtures} /> : undefined
        }
        headerControls={headerControls}
      />
    </EditorShell>
  );
  // Live preview only while visible — unmounts when hidden (resets store).
  const preview =
    hidden ? previewLoading : (
      <Boundary key="preview" fallback={previewLoading}>
        <LivePreview
          code={code}
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
          getInitialInterceptorData={getInitialInterceptorData}
          renderCount={renderCount}
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
        {playgroundPosition === 'top' ? [preview, editor] : [editor, preview]}
      </div>
    </div>
  );
}

/** SSR, crawler, hidden and loading state: empty preview frame + Store toggle */
const previewLoading = (
  <PreviewWrapper key="preview">
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
