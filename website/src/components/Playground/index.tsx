import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';
import clsx from 'clsx';
import React, { lazy, useDeferredValue, useId, useRef, useState } from 'react';

import Boundary from './Boundary';
import { useCodeDocuments } from './editor/codeModel';
import EditorShell from './editor/EditorShell';
import EditorSurface from './editor/EditorSurface';
import FixturePreview from './FixturePreview';
import { isGoogleBot } from './isMobileOrBot';
import type { LivePreviewProps } from './preview/LivePreview';
import type LivePreviewType from './preview/LivePreview';
import PreviewWrapper from './PreviewWrapper';
import { StoreToggle } from './StoreInspector';
import styles from './styles.module.css';
import type { FixtureOrInterceptor, PreviewProps } from './types';
import DemoVideo from '../DemoVideo';
import { trackDemoEvent } from '../DemoVideo/trackDemoEvent';
import type { DemoSource } from '../DemoVideo/types';

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
  demo?: DemoSource;
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
  demo,
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
      <PlaygroundContent
        reverse={playgroundPosition === 'top'}
        row={row}
        hidden={hidden}
        fixtures={fixtures}
        groupId={groupId}
        defaultOpen={defaultOpen}
        getInitialInterceptorData={getInitialInterceptorData}
        defaultTab={defaultTab}
        headerControls={headerControls}
        demo={demo}
      >
        {children}
      </PlaygroundContent>
    </div>
  );
}

function PlaygroundContent<T>({
  reverse,
  children,
  row,
  hidden,
  fixtures,
  groupId,
  defaultOpen,
  defaultTab,
  getInitialInterceptorData,
  headerControls,
  demo,
}: ContentProps<T>) {
  const model = useCodeDocuments(children, defaultTab);
  // Defer preview transpilation so editor input remains responsive.
  const code = useDeferredValue(
    model.documents.map(document => document.value).join('\n'),
  );
  // `demo` is a fresh MDX object literal each render; effects key off this.
  const hasDemo = demo !== undefined;
  const [activated, setActivated] = useState(!hasDemo);
  const [codeOpen, setCodeOpen] = useState(!hasDemo);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const instanceId = useId().replace(/:/g, '');
  const editorPaneId = `${groupId}-${instanceId}-editor`;

  // Hydrate Monaco on first show and keep it (preserves undo / go-to-def).
  const [editorInteractive, setEditorInteractive] = useState(
    !hidden && !hasDemo,
  );
  useIsomorphicLayoutEffect(() => {
    if (!hidden && (!hasDemo || codeOpen)) setEditorInteractive(true);
  }, [hidden, hasDemo, codeOpen]);

  // Move focus to the live preview once, when the facade hands off.
  useIsomorphicLayoutEffect(() => {
    if (hasDemo && activated) liveRegionRef.current?.focus();
  }, [activated, hasDemo]);

  const activate = () => {
    if (demo) trackDemoEvent('demo_activate', demo.id);
    setActivated(true);
  };

  const toggleCode = () => {
    setCodeOpen(open => {
      const next = !open;
      if (next && demo) trackDemoEvent('demo_show_code', demo.id);
      return next;
    });
  };

  const hideCodeControl = (
    <button
      type="button"
      className={styles.paneToggle}
      aria-expanded={codeOpen}
      aria-controls={editorPaneId}
      aria-label="Hide code"
      title="Hide code"
      onClick={toggleCode}
    >
      <PanelLeftIcon />
    </button>
  );
  const showCodeControl = (
    <div className={styles.headerActions}>
      <button
        type="button"
        className={styles.headerAction}
        aria-expanded={codeOpen}
        aria-controls={editorPaneId}
        aria-label="Show code"
        title="Show code"
        onClick={toggleCode}
      >
        <PanelLeftIcon />
        Show code
      </button>
    </div>
  );
  const editorToggle = hasDemo && codeOpen && row ? hideCodeControl : undefined;
  const previewToggle =
    !hasDemo ? undefined
    : !codeOpen ? showCodeControl
    : !row ? hideCodeControl
    : undefined;

  const editor = (
    <EditorShell key="editor">
      <EditorSurface
        {...model}
        paneId={hasDemo ? editorPaneId : undefined}
        className={hasDemo && !codeOpen ? styles.codeCollapsed : undefined}
        interactive={editorInteractive}
        layout={row ? 'row' : 'stacked'}
        variant="playground"
        fixtureContent={
          fixtures.length ? <FixturePreview fixtures={fixtures} /> : undefined
        }
        headerControls={headerControls}
        paneToggle={editorToggle}
      />
    </EditorShell>
  );

  const viewport =
    demo && !codeOpen ? { width: demo.width, height: demo.height } : undefined;

  const livePreview = (
    <Boundary
      key="preview"
      fallback={
        <PreviewFallback headerControls={previewToggle} viewport={viewport} />
      }
    >
      <PreviewWithScopeLazy
        code={code}
        groupId={groupId}
        defaultOpen={defaultOpen}
        row={row}
        fixtures={fixtures}
        getInitialInterceptorData={getInitialInterceptorData}
        viewport={viewport}
        headerControls={previewToggle}
      />
    </Boundary>
  );

  if (demo && !activated) {
    return (
      <>
        <div className={clsx(styles.playgroundContainer, styles.demoFacade)}>
          <div className={styles.stageEnter}>
            <DemoVideo source={demo} onActivate={activate} />
          </div>
        </div>
        {/* Keep code in the SSR HTML for indexing while the facade shows. */}
        <div hidden>{editor}</div>
      </>
    );
  }

  // Live preview only while visible — unmounts when hidden (resets store).
  const previewInner =
    hidden ?
      <PreviewFallback
        key="preview"
        headerControls={previewToggle}
        viewport={viewport}
      />
    : livePreview;

  const preview =
    hasDemo ?
      <div
        key="preview"
        ref={liveRegionRef}
        tabIndex={-1}
        aria-label="Live demo"
        className={clsx(styles.previewPane, styles.stageEnter)}
      >
        {previewInner}
      </div>
    : previewInner;

  return (
    <div
      className={clsx(styles.playgroundContainer, {
        [styles.row]: row,
        [styles.hideCode]: hasDemo && !codeOpen,
      })}
    >
      {reverse ? [preview, editor] : [editor, preview]}
    </div>
  );
}

interface ContentProps<T> extends PreviewProps<T> {
  children: PlaygroundProps<T>['children'];
  reverse: boolean;
  hidden: boolean;
  defaultTab?: string;
  headerControls?: React.ReactNode;
  demo?: DemoSource;
}

function PanelLeftIcon() {
  return (
    <svg
      className={styles.headerActionIcon}
      width="12"
      height="12"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <rect
        x="1.75"
        y="2.25"
        width="12.5"
        height="11.5"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M6.25 2.25v11.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function PreviewFallback({
  headerControls,
  viewport,
}: Pick<LivePreviewProps<unknown>, 'headerControls' | 'viewport'>) {
  return (
    <PreviewWrapper headerControls={headerControls} viewport={viewport}>
      <div className={styles.playgroundPreview} />
      <StoreToggle />
    </PreviewWrapper>
  );
}

const PreviewWithScopeLazy = lazy<typeof LivePreviewType>(() =>
  isGoogleBot ?
    Promise.resolve({ default: PreviewFallback })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './preview/LivePreview'
    ),
);
