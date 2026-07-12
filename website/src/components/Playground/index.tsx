import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import React, { lazy, useDeferredValue } from 'react';

import Boundary from './Boundary';
import { useCodeDocuments } from './editor/codeModel';
import EditorShell from './editor/EditorShell';
import EditorSurface from './editor/EditorSurface';
import FixturePreview from './FixturePreview';
import { isGoogleBot } from './isMobileOrBot';
import type LivePreviewType from './preview/LivePreview';
import PreviewWrapper from './PreviewWrapper';
import { StoreToggle } from './StoreInspector';
import styles from './styles.module.css';
import type { FixtureOrInterceptor, PreviewProps } from './types';

export interface PlaygroundProps<T = any> {
  children: React.ReactNode;
  groupId?: string;
  defaultOpen?: 'y' | 'n';
  row?: boolean;
  hidden?: boolean;
  fixtures?: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
  defaultTab?: string;
  headerControls?: React.ReactNode;
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
}: PlaygroundProps<T>) {
  const {
    liveCodeBlock: { playgroundPosition },
  } = useDocusaurusContext().siteConfig.themeConfig as any;

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
        <PlaygroundContent
          reverse={playgroundPosition === 'top'}
          row={row}
          fixtures={fixtures}
          groupId={groupId}
          defaultOpen={defaultOpen}
          getInitialInterceptorData={getInitialInterceptorData}
          defaultTab={defaultTab}
          headerControls={headerControls}
        >
          {children}
        </PlaygroundContent>
      </div>
    </div>
  );
}

function PlaygroundContent<T>({
  reverse,
  children,
  row,
  fixtures,
  groupId,
  defaultOpen,
  defaultTab,
  getInitialInterceptorData,
  headerControls,
}: ContentProps<T>) {
  const model = useCodeDocuments(children, defaultTab);
  // Defer preview transpilation so editor input remains responsive.
  const code = useDeferredValue(
    model.documents.map(document => document.value).join('\n'),
  );
  const editor = (
    <EditorShell key="editor">
      <EditorSurface
        {...model}
        layout={row ? 'row' : 'stacked'}
        variant="playground"
        fixtureContent={
          fixtures.length ? <FixturePreview fixtures={fixtures} /> : undefined
        }
        headerControls={headerControls}
      />
    </EditorShell>
  );
  const preview = (
    <Boundary key="preview" fallback={previewLoading}>
      <PreviewWithScopeLazy
        code={code}
        groupId={groupId}
        defaultOpen={defaultOpen}
        row={row}
        fixtures={fixtures}
        getInitialInterceptorData={getInitialInterceptorData}
      />
    </Boundary>
  );

  return <>{reverse ? [preview, editor] : [editor, preview]}</>;
}

interface ContentProps<T> extends PreviewProps<T> {
  children: PlaygroundProps<T>['children'];
  reverse: boolean;
  defaultTab?: string;
  headerControls?: React.ReactNode;
}

const previewLoading = (
  <PreviewWrapper key="preview">
    <div className={styles.playgroundPreview} />
    <StoreToggle />
  </PreviewWrapper>
);

const PreviewWithScopeLazy = lazy<typeof LivePreviewType>(() =>
  isGoogleBot ?
    Promise.resolve({ default: () => previewLoading })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './preview/LivePreview'
    ),
);
