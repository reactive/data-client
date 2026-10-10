import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';
import clsx from 'clsx';
import type * as Monaco from 'monaco-editor';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import Header from '../Header';
import { modelPath, useModelId } from '../monaco/modelPath';
import { createMissingModels } from '../monaco/models';
import Editor from '../PlaygroundEditor';
import styles from '../styles.module.css';
import TabList from '../TabList';
import type { CodeDocument, CodeModel } from './codeModel';
import type { InteractiveEditorProps } from './InteractiveEditor';
import StaticEditor from './StaticEditor';

export interface EditorSurfaceProps extends CodeModel {
  layout: 'row' | 'stacked';
  variant: 'playground' | 'standalone';
  /** When false, keep static SSR-friendly editors (no Monaco). Defaults true. */
  interactive?: boolean;
  fixtureContent?: React.ReactNode;
  headerControls?: React.ReactNode;
  /** Layer over the files, below the header rows (the Store drawer's host) */
  cover?: React.ReactNode;
  /** Whether `cover` hides the code (which goes inert) */
  covered?: boolean;
  /** Called when the user switches to another file tab */
  onTabSelect?: () => void;
}

export default function EditorSurface({
  documents,
  update,
  layout,
  variant,
  interactive = true,
  fixtureContent,
  headerControls,
  cover,
  covered = false,
  onTabSelect,
}: EditorSurfaceProps) {
  const id = useModelId();
  const row = layout === 'row';
  const [closedList, setClosed] = useState(() =>
    documents.map(({ collapsed }) => collapsed),
  );

  // Document count and col flags are fixed after the initial parse, so
  // capturing them once keeps these handlers referentially stable. That
  // stability is what lets memo(InteractiveEditor) skip re-rendering
  // unedited tabs on every keystroke.
  const colFlags = useRef(documents.map(({ col }) => col)).current;
  const handleTabSwitch = useCallback(
    (index: number) => {
      setClosed(closed => {
        const next = closed.map((previous, documentIndex) => {
          if (colFlags[documentIndex]) return previous;
          return documentIndex !== index;
        });
        // keep identity when already selected so focusing it doesn't re-render
        return next.every((value, i) => value === closed[i]) ? closed : next;
      });
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

  const createModels = useCreateModels(id, documents);

  const tabs =
    row && documents.length > 1 ?
      <EditorTabs
        documents={documents}
        closedList={closedList}
        onClick={index => {
          // focus also selects, so only a different file counts
          if (closedList[index]) onTabSelect?.();
          handleTabSwitch(index);
        }}
        compact={variant === 'standalone'}
        hasHeaderControls={headerControls != null}
      />
    : null;
  // under a demo-level header the file tabs belong to the files, so the
  // Store covers them too; alone they stay as the header row
  const tabsCovered = cover != null && headerControls != null;
  const code = documents.map((document, index) => (
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
        ssr={document.ssr}
        interactive={interactive}
        tabIndex={index}
        onFocus={
          row && !document.col && documents.length > 1 ?
            handleTabSwitch
          : handleTabOpen
        }
        onChange={handleChanges[index]}
        code={document.value}
        path={modelPath(id, document.path)}
        beforeMount={createModels}
        isFocused={!closedList[index]}
        language={document.language}
        highlights={document.highlights}
        autoFocus={document.autoFocus}
      />
    </React.Fragment>
  ));
  return (
    <div
      className={clsx(styles.playgroundTextEdit, {
        [styles.withCover]: cover != null,
      })}
    >
      <EditorHeader
        fixtureContent={!row ? fixtureContent : undefined}
        title={row && documents.length === 1 ? documents[0].title : undefined}
        covered={covered}
        controls={headerControls}
      />
      {tabsCovered ? null : tabs}
      {cover == null ?
        code
      : <div className={styles.editorBody}>
          <div className={styles.editorDocs} inert={covered}>
            {tabsCovered ? tabs : null}
            {code}
          </div>
          {cover}
        </div>
      }
    </div>
  );
}

/**
 * `beforeMount` for every editor of a surface: every file's model must exist
 * before any is type-checked, or imports of later tabs read as missing
 * modules (see createMissingModels). Stable, so memo'd editors skip renders.
 */
function useCreateModels(id: string, documents: readonly CodeDocument[]) {
  const documentsRef = useRef(documents);
  // in an effect, not during render, so a discarded render can't leak in
  useIsomorphicLayoutEffect(() => {
    documentsRef.current = documents;
  });
  return useCallback(
    (monaco: typeof Monaco) =>
      createMissingModels(
        monaco,
        documentsRef.current.map(document => ({
          path: modelPath(id, document.path),
          code: document.value,
          language: document.language,
        })),
      ),
    [id],
  );
}

function TextEditTab({
  hidden,
  ssr,
  interactive,
  ...editorProps
}: InteractiveEditorProps &
  Pick<CodeDocument, 'ssr'> & {
    hidden: boolean;
    interactive: boolean;
  }) {
  // SSR + hydration markup: open tabs' source stays in the HTML for crawlers.
  // Collapsed tabs are left out to keep the HTML small, unless marked `ssr`:
  // those keep their text, unhighlighted since it is never seen.
  // Never branch on navigator / user agent outside BrowserOnly.
  const staticView =
    !hidden ?
      <StaticEditor code={editorProps.code} language={editorProps.language} />
    : ssr ? <pre>{editorProps.code}</pre>
    : null;

  return (
    <div
      className={clsx(styles.playgroundEditor, {
        [styles.hidden]: hidden,
      })}
    >
      {/* Not yet interactive (e.g. never-shown Demo tab): skip Monaco entirely */}
      {interactive ?
        <BrowserOnly fallback={staticView}>
          {() => <Editor {...editorProps} />}
        </BrowserOnly>
      : staticView}
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
}: {
  documents: readonly CodeDocument[];
  closedList: readonly boolean[];
  onClick: (index: number) => void;
  compact: boolean;
  hasHeaderControls: boolean;
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
  covered,
  fixtureContent,
  controls,
}: {
  title?: React.ReactNode;
  /** The Store covers the code: the title says so, sliding in as it does */
  covered: boolean;
  fixtureContent?: React.ReactNode;
  controls?: React.ReactNode;
}) {
  return (
    <>
      {fixtureContent != null ?
        <>
          <Header small>
            <Translate id="playground.fixtures">Fixtures</Translate>
          </Header>
          {fixtureContent}
        </>
      : null}
      {controls != null ?
        <Header
          className={clsx(styles.tabControls, styles.controlTabs, {
            [styles.overStore]: covered,
          })}
        >
          <div className={styles.title}>
            <span
              className={styles.titleSwap}
              data-covered={covered || undefined}
            >
              <span aria-hidden={covered}>{title}</span>
              <span aria-hidden={!covered}>
                <Translate id="playground.store">Store</Translate>
              </span>
            </span>
          </div>
          {controls}
        </Header>
      : null}
    </>
  );
}
