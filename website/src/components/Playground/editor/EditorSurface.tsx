import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  type ComponentProps,
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LiveEditor } from 'react-live';

import Header from '../Header';
import type PlaygroundEditor from '../PlaygroundEditor';
import styles from '../styles.module.css';
import TabList from '../TabList';
import type { CodeDocument, CodeModel } from './codeModel';

const Editor = lazy(() => import('../PlaygroundEditor'));

export interface EditorSurfaceProps extends CodeModel {
  layout: 'row' | 'stacked';
  variant: 'playground' | 'standalone';
  /** When false, keep static SSR-friendly editors (no Monaco). Defaults true. */
  interactive?: boolean;
  fixtureContent?: React.ReactNode;
  headerControls?: React.ReactNode;
  /** Trailing control on the editor tab/title row (e.g. Hide code). */
  paneToggle?: React.ReactNode;
  paneId?: string;
  className?: string;
}

export default function EditorSurface({
  documents,
  update,
  layout,
  variant,
  interactive = true,
  fixtureContent,
  headerControls,
  paneToggle,
  paneId,
  className,
}: EditorSurfaceProps) {
  const id = useNumericId();
  const row = layout === 'row';
  const [closedList, setClosed] = useState(() =>
    documents.map(({ collapsed }) => collapsed),
  );

  // Document count and col flags are fixed after the initial parse, so
  // capturing them once keeps these handlers referentially stable. That
  // stability is what lets memo(PlaygroundMonacoEditor) skip re-rendering
  // unedited tabs on every keystroke.
  const colFlags = useRef(documents.map(({ col }) => col)).current;
  const handleTabSwitch = useCallback(
    (index: number) => {
      setClosed(closed =>
        closed.map((previous, documentIndex) => {
          if (colFlags[documentIndex]) return previous;
          return documentIndex !== index;
        }),
      );
    },
    [colFlags],
  );
  const handleTabOpen = useCallback((index: number) => {
    setClosed(closed => {
      if (!closed[index]) return closed;
      return closed.map((value, i) => (i === index ? false : value));
    });
  }, []);
  const handleTabToggle = useCallback((index: number) => {
    setClosed(closed =>
      closed.map((value, i) => (i === index ? !value : value)),
    );
  }, []);
  const handleChanges = useMemo(
    () =>
      documents.map(
        (_, index) => (value?: string) => update(index, value ?? ''),
      ),
    // only depend on length so identities survive keystrokes (see colFlags note)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents.length, update],
  );

  return (
    <div id={paneId} className={clsx(styles.playgroundTextEdit, className)}>
      <EditorHeader
        fixtureContent={!row ? fixtureContent : undefined}
        title={row && documents.length === 1 ? documents[0].title : undefined}
        controls={headerControls}
        paneToggle={row && documents.length === 1 ? paneToggle : undefined}
      />
      {row && documents.length > 1 ?
        <EditorTabs
          documents={documents}
          closedList={closedList}
          onClick={handleTabSwitch}
          compact={variant === 'standalone'}
          hasHeaderControls={headerControls != null}
          paneToggle={paneToggle}
        />
      : null}
      {documents.map((document, index) => (
        <React.Fragment key={`${document.path}:${index}`}>
          {(!row || document.col) && document.title ?
            <CodeTabHeader
              onClick={() => handleTabToggle(index)}
              closed={closedList[index]}
              title={document.title}
              collapsible={documents.length > 1 || fixtureContent != null}
            />
          : null}
          <TextEditTab
            hidden={closedList[index]}
            interactive={interactive}
            tabIndex={index}
            onFocus={
              row && !document.col && documents.length > 1 ?
                handleTabSwitch
              : handleTabOpen
            }
            onChange={handleChanges[index]}
            code={document.value}
            path={`/${id}/${document.path}`}
            isFocused={!closedList[index]}
            language={document.language}
            highlights={document.highlights}
            autoFocus={document.autoFocus}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function TextEditTab({
  hidden,
  interactive,
  code,
  language,
  tabIndex,
  ...rest
}: ComponentProps<typeof PlaygroundEditor> & {
  hidden: boolean;
  interactive: boolean;
}) {
  // Stable across SSR/hydration (do not branch on navigator / isGoogleBot here).
  const staticView = <LiveEditor language={language} code={code} disabled />;

  // Deferred protocols: keep open-file source in the DOM for SSG/crawlers;
  // skip Monaco until the sandbox has been shown once.
  if (!interactive) {
    return (
      <div
        className={clsx(styles.playgroundEditor, {
          [styles.hidden]: hidden,
        })}
      >
        {hidden ? null : staticView}
      </div>
    );
  }

  const fallback = hidden ? <></> : staticView;

  return (
    <div
      className={clsx(styles.playgroundEditor, {
        [styles.hidden]: hidden,
      })}
    >
      <BrowserOnly fallback={fallback}>
        {() => (
          <Suspense fallback={fallback}>
            <Editor
              tabIndex={tabIndex}
              code={code}
              language={language}
              {...rest}
            />
          </Suspense>
        )}
      </BrowserOnly>
    </div>
  );
}

function CodeTabHeader({
  onClick,
  closed,
  title,
  collapsible,
}: {
  onClick: () => void;
  closed: boolean;
  title: React.ReactNode;
  collapsible: boolean;
}) {
  if (!collapsible) return <div className={styles.codeHeader}>{title}</div>;
  return (
    <Header small onClick={onClick}>
      <span className={clsx(styles.arrow, closed ? styles.right : styles.down)}>
        ▶
      </span>
      {title}
    </Header>
  );
}

function EditorTabs({
  documents,
  closedList,
  onClick,
  compact,
  hasHeaderControls,
  paneToggle,
}: {
  documents: readonly CodeDocument[];
  closedList: readonly boolean[];
  onClick: (index: number) => void;
  compact: boolean;
  hasHeaderControls: boolean;
  paneToggle?: React.ReactNode;
}) {
  const tabs = documents
    .map((document, index) => ({ document, index }))
    .filter(({ document }) => !document.col);

  return (
    <Header
      className={clsx(
        { [styles.subtabs]: hasHeaderControls },
        styles.noupper,
        styles.tabControls,
      )}
      small={hasHeaderControls || compact}
    >
      <TabList
        tabs={tabs.map(({ document, index }) => ({
          key: `${document.path}:${index}`,
          label: document.title,
          selected: !closedList[index],
          onSelect: () => onClick(index),
        }))}
      />
      {paneToggle}
    </Header>
  );
}

function EditorHeader({
  title = (
    <Translate
      id="theme.Playground.liveEditor"
      description="The live editor label of the live codeblocks"
    >
      Editor
    </Translate>
  ),
  fixtureContent,
  controls,
  paneToggle,
}: {
  title?: React.ReactNode;
  fixtureContent?: React.ReactNode;
  controls?: React.ReactNode;
  paneToggle?: React.ReactNode;
}) {
  return (
    <>
      {fixtureContent != null ?
        <>
          <Header small>Fixtures</Header>
          {fixtureContent}
        </>
      : null}
      {controls != null || paneToggle != null ?
        <Header className={styles.tabControls}>
          <div className={styles.title}>{title}</div>
          {controls}
          {paneToggle}
        </Header>
      : null}
    </>
  );
}

// Monaco model URIs are matched with /\/\d+\// in monaco-init.ts.
function useNumericId() {
  return useMemo(
    () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
    [],
  );
}
