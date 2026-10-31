import BrowserOnly from '@docusaurus/BrowserOnly';
import { translate } from '@docusaurus/Translate';
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';
import clsx from 'clsx';
import type * as Monaco from 'monaco-editor';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Header from '../Header';
import { modelPath, useModelId } from '../monaco/modelPath';
import { createMissingModels } from '../monaco/models';
import { allowTopLevelAwait } from '../monaco/topLevelAwait';
import Editor from '../PlaygroundEditor';
import styles from '../styles.module.css';
import TabList from '../TabList';
import type { Layout } from '../types';
import type { CodeDocument, CodeModel } from './codeModel';
import type { InteractiveEditorProps } from './InteractiveEditor';
import type { CodeTarget } from './openCode';
import StaticEditor from './StaticEditor';

export interface EditorSurfaceProps extends CodeModel {
  /** `demo`: tabs like `row`, under the preview's header (see ../index.tsx).
   * `stacked`: tabs too, unless several files start open */
  layout: Layout;
  variant: 'playground' | 'standalone';
  /** False until the code first shows: plain text for crawlers, no Monaco.
   * Defaults true. */
  interactive?: boolean;
  /** The Store covers the code, which goes inert */
  covered?: boolean;
  /** A line to show, handed to its file's editor, which opens its tab and
   * puts the cursor there (each new object, once) */
  reveal?: CodeTarget | null;
  /** The code runs as an async function, so its files may `await` at the
   * top level */
  topLevelAwait?: boolean;
}

export default function EditorSurface({
  documents,
  update,
  layout,
  variant,
  interactive = true,
  covered = false,
  reveal,
  topLevelAwait = false,
}: EditorSurfaceProps) {
  const id = useModelId();
  useEffect(() => {
    if (topLevelAwait) return allowTopLevelAwait(id);
  }, [id, topLevelAwait]);
  const [closedList, setClosed] = useState(() =>
    documents.map(({ collapsed }) => collapsed),
  );

  // Document count and col flags are fixed after the initial parse, so
  // capturing them once keeps these handlers referentially stable. That
  // stability is what lets memo(InteractiveEditor) skip re-rendering
  // unedited tabs on every keystroke.
  const colFlags = useRef(documents.map(({ col }) => col)).current;
  // stacked files that start open together stay so: each its own card,
  // folding on its own; otherwise the files are tabs over one card
  const cards =
    layout === 'stacked' &&
    documents.filter(({ collapsed, col }) => !collapsed && !col).length > 1;
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

  // a lone file's title is its tab, and an untitled one has none; a column
  // file is a label, never a tab
  const tabbed = documents.filter(document => !document.col);
  const tabs =
    !cards && (tabbed.length > 1 || tabbed[0]?.title) ?
      <EditorTabs
        documents={documents}
        closedList={closedList}
        onClick={handleTabSwitch}
        compact={variant === 'standalone'}
        subtabs={layout === 'demo'}
      />
    : null;
  const code = documents.map((document, index) => {
    const editor = (
      <TextEditTab
        hidden={closedList[index]}
        ssr={document.ssr}
        interactive={interactive}
        tabIndex={index}
        onFocus={
          !cards && !document.col && documents.length > 1 ?
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
        reveal={reveal?.path === document.path ? reveal : undefined}
      />
    );
    const key = `${document.path}:${index}`;
    if (cards)
      return (
        <FileCard
          key={key}
          title={document.title}
          closed={closedList[index]}
          onToggle={() => handleTabToggle(index)}
        >
          {editor}
        </FileCard>
      );
    return (
      <React.Fragment key={key}>
        {/* beside tabs, a column file is a label on the layer under the
            code card, never folded away */}
        {document.col && document.title ?
          <div className={styles.codeHeader}>{document.title}</div>
        : null}
        {editor}
      </React.Fragment>
    );
  });
  return (
    // the Store covers the file tabs and the code card alike
    <div className={styles.playgroundTextEdit} inert={covered}>
      {tabs}
      {/* the files: the code card, or a card each */}
      <div className={clsx(styles.editorDocs, { [styles.fileCards]: cards })}>
        {code}
      </div>
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
  // those keep their text, unhighlighted since it is never seen. So does
  // code not yet shown (a hidden playground, a demo's code), which also
  // skips Monaco: highlighting costs a node per token.
  // Never branch on navigator / user agent outside BrowserOnly.
  const staticView =
    hidden ?
      ssr ? <pre>{editorProps.code}</pre>
      : null
    : interactive ?
      <StaticEditor code={editorProps.code} language={editorProps.language} />
    : <pre>{editorProps.code}</pre>;

  return (
    <div
      className={clsx(styles.playgroundEditor, {
        [styles.hidden]: hidden,
      })}
    >
      {interactive ?
        <BrowserOnly fallback={staticView}>
          {() => <Editor {...editorProps} />}
        </BrowserOnly>
      : staticView}
    </div>
  );
}

/** One of several files open at once: its code card under its name, which
 * folds it to just that name and back */
function FileCard({
  title,
  closed,
  onToggle,
  children,
}: {
  title?: string;
  closed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  // the folder steps back, so the file's own name reads first
  const slash = title ? title.lastIndexOf('/') + 1 : 0;
  return (
    <section className={styles.fileCard} data-closed={closed || undefined}>
      {title ?
        <button
          type="button"
          className={clsx('clean-btn', styles.fileName)}
          aria-expanded={!closed}
          onClick={onToggle}
        >
          {slash ?
            <span className={styles.fileDir}>{title.slice(0, slash)}</span>
          : null}
          {title.slice(slash)}
          <svg
            className={styles.fileChevron}
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden
          >
            <path d="M4.5 6.25 8 9.75l3.5-3.5" />
          </svg>
        </button>
      : null}
      {children}
    </section>
  );
}

function EditorTabs({
  documents,
  closedList,
  onClick,
  compact,
  subtabs,
}: {
  documents: readonly CodeDocument[];
  closedList: readonly boolean[];
  onClick: (index: number) => void;
  compact: boolean;
  /** Under the preview's header (the demo layout): a step above the bar, so
   * the two rows read apart */
  subtabs: boolean;
}) {
  const tabs = documents
    .map((document, index) => ({ document, index }))
    .filter(({ document }) => !document.col);

  return (
    <Header
      className={clsx(
        { [styles.subtabs]: subtabs },
        styles.noupper,
        styles.tabControls,
      )}
      small={subtabs || compact}
    >
      <TabList
        label={translate({ id: 'playground.files', message: 'Files' })}
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
