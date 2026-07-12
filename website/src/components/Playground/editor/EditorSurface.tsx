import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  type ComponentProps,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { LiveEditor } from 'react-live';

import { isGoogleBot } from './isMobileOrBot';
import Editor from './PlaygroundEditor';
import Header from '../Header';
import styles from '../styles.module.css';
import type { CodeDocument, CodeModel } from './codeModel';

export interface EditorSurfaceProps extends CodeModel {
  layout: 'row' | 'stacked';
  variant: 'playground' | 'standalone';
  fixtureContent?: React.ReactNode;
  headerControls?: React.ReactNode;
}

export default function EditorSurface({
  documents,
  update,
  layout,
  variant,
  fixtureContent,
  headerControls,
}: EditorSurfaceProps) {
  const id = useNumericId();
  const row = layout === 'row';
  const [closedList, setClosed] = useState(() =>
    documents.map(({ collapsed }) => collapsed),
  );

  const handleTabSwitch = useCallback(
    (index: number) => {
      setClosed(closed =>
        closed.map((previous, documentIndex) => {
          if (documents[documentIndex].col) return previous;
          return documentIndex !== index;
        }),
      );
    },
    [documents],
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

  return (
    <div className={styles.playgroundTextEdit}>
      <EditorHeader
        fixtureContent={!row ? fixtureContent : undefined}
        title={row && documents.length === 1 ? documents[0].title : undefined}
        controls={headerControls}
      />
      {row && documents.length > 1 ?
        <EditorTabs
          documents={documents}
          closedList={closedList}
          onClick={handleTabSwitch}
          compact={variant === 'standalone'}
          hasHeaderControls={headerControls != null}
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
            tabIndex={index}
            onFocus={
              row && !document.col && documents.length > 1 ?
                handleTabSwitch
              : handleTabOpen
            }
            onChange={value => update(index, value ?? '')}
            code={document.value}
            path={`/${id}/${document.path}`}
            isFocused={!closedList[index]}
            language={document.language}
            highlights={document.highlights}
            autoFocus={document.autoFocus as boolean | undefined}
            readOnly={document.readOnly as boolean | undefined}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function TextEditTab({
  hidden,
  code,
  language,
  tabIndex,
  ...rest
}: ComponentProps<typeof Editor> & { hidden: boolean }) {
  const fallback =
    hidden ? <></>
    : isGoogleBot ?
      <pre className="prism-code language-tsx" spellCheck="false">
        {code}
      </pre>
    : <LiveEditor language={language} code={code} disabled />;

  return (
    <div
      className={clsx(styles.playgroundEditor, {
        [styles.hidden]: hidden,
      })}
    >
      <BrowserOnly fallback={fallback}>
        {() => (
          <Editor
            tabIndex={tabIndex}
            code={code}
            language={language}
            {...rest}
          />
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
      <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
        {tabs.map(({ document, index }) => (
          <div
            role="tab"
            aria-selected={!closedList[index]}
            tabIndex={!closedList[index] ? 0 : -1}
            key={`${document.path}:${index}`}
            onClick={() => onClick(index)}
            className={clsx(styles.tab, {
              [styles.selected]: !closedList[index],
            })}
          >
            {document.title}
          </div>
        ))}
      </div>
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
}: {
  title?: React.ReactNode;
  fixtureContent?: React.ReactNode;
  controls?: React.ReactNode;
}) {
  return (
    <>
      {fixtureContent != null ?
        <>
          <Header small>Fixtures</Header>
          {fixtureContent}
        </>
      : null}
      {controls != null ?
        <Header className={styles.tabControls}>
          <div className={styles.title}>{title}</div>
          {controls}
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
