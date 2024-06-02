import type { Fixture, Interceptor } from '@data-client/test';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import { useCallback, useContext, useMemo, useState } from 'react';
import React from 'react';
import { LiveEditor } from 'react-live';

import FixturePreview from './FixturePreview';
import Header from './Header';
import PlaygroundEditor from './PlaygroundEditor';
import styles from './styles.module.css';
import CodeTabContext from '../Demo/CodeTabContext';

export function PlaygroundTextEdit({
  fixtures,
  row,
  codeTabs,
  handleCodeChange,
  codes,
  large = false,
  isPlayground = true,
}: PlaygroundProps) {
  const id = useId();

  const [closedList, setClosed] = useState(() =>
    codeTabs.map(({ collapsed }) => collapsed),
  );

  const handleTabSwitch = useCallback(i => {
    setClosed(cl =>
      cl.map((prev, j) => {
        if (codeTabs[j].col) return prev;
        return j !== i;
      }),
    );
  }, []);
  const handleTabOpen = useCallback(i => {
    setClosed(cl => {
      if (!cl[i]) return cl;
      const n = [...cl];
      n[i] = false;
      return n;
    });
  }, []);
  const handleTabToggle = useCallback(i => {
    setClosed(cl => {
      const n = [...cl];
      n[i] = !n[i];
      return n;
    });
  }, []);

  return (
    <div className={styles.playgroundTextEdit}>
      <EditorHeader
        fixtures={!row ? fixtures : []}
        title={row && codeTabs.length === 1 ? codeTabs[0].title : undefined}
      />
      {row && codeTabs.length > 1 ?
        <EditorTabs
          titles={codeTabs.filter(({ col }) => !col).map(({ title }) => title)}
          closedList={closedList}
          onClick={handleTabSwitch}
          isPlayground={isPlayground}
        />
      : null}
      {codeTabs.map(
        ({ title, path, code, collapsed, col, language, ...rest }, i) => (
          <React.Fragment key={i}>
            {(!row || col) && title ?
              <CodeTabHeader
                onClick={() => handleTabToggle(i)}
                closed={closedList[i]}
                title={title}
                collapsible={codeTabs.length > 1 || fixtures?.length}
                lastChild={i === codeTabs.length - 1 && large}
              />
            : null}
            <div
              key={i}
              className={clsx(styles.playgroundEditor, {
                [styles.hidden]: closedList[i],
              })}
            >
              <BrowserOnly
                fallback={
                  <LiveEditor
                    key={i}
                    language={language}
                    code={codes[i]}
                    disabled
                  />
                }
              >
                {() => (
                  /*closedList[i] ? null : */ <PlaygroundEditor
                    key={i}
                    tabIndex={i}
                    onFocus={
                      row && !col && codeTabs.length > 1 ?
                        handleTabSwitch
                      : handleTabOpen
                    }
                    onChange={handleCodeChange[i]}
                    code={codes[i]}
                    path={'/' + id + '/' + path}
                    isFocused={!closedList[i]}
                    language={language}
                    {...rest}
                    large={large}
                  />
                )}
              </BrowserOnly>
            </div>
          </React.Fragment>
        ),
      )}
    </div>
  );
}
interface PlaygroundProps {
  fixtures: (Fixture | Interceptor)[];
  row: boolean;
  codeTabs: any;
  handleCodeChange: any;
  codes: any;
  large?: boolean;
  isPlayground?: boolean;
}

function CodeTabHeader({
  onClick,
  closed,
  title,
  collapsible = false,
  lastChild = false,
}) {
  if (collapsible)
    return (
      <Header
        className={clsx({
          [styles.lastChild]: lastChild && closed,
        })}
        small={true}
        onClick={onClick}
      >
        <span
          className={clsx(styles.arrow, closed ? styles.right : styles.down)}
        >
          ▶
        </span>
        {title}
      </Header>
    );
  return <div className={styles.codeHeader}>{title}</div>;
}

function EditorTabs({ titles, closedList, onClick, isPlayground = true }) {
  const { values } = useContext(CodeTabContext);
  const hasTabs = values.length > 0;
  return (
    <Header
      className={clsx(
        { [styles.subtabs]: hasTabs },
        styles.noupper,
        styles.tabControls,
      )}
      small={hasTabs || !isPlayground}
    >
      <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
        {titles.map((title, i) => (
          <div
            role="tab"
            key={i}
            onClick={() => onClick(i)}
            className={clsx(styles.tab, {
              [styles.selected]: !closedList[i],
            })}
          >
            {title}
          </div>
        ))}
      </div>
    </Header>
  );
}
function useId() {
  return useMemo(() => (Math.random() * 10000).toPrecision(4).toString(), []);
}

function HeaderTabs() {
  const { selectedValue, setSelectedValue, values } =
    useContext(CodeTabContext);
  return (
    <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
      {values.map(({ value, label }) => (
        <div
          role="tab"
          tabIndex={selectedValue === value ? 0 : -1}
          aria-selected={selectedValue === value}
          key={value}
          className={clsx(styles.tab, {
            [styles.selected]: selectedValue === value,
          })}
          onFocus={setSelectedValue}
          onClick={setSelectedValue}
          value={value}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function HeaderWithTabControls({ children }) {
  return (
    <Header className={styles.tabControls}>
      <div className={styles.title}>{children}</div>
      <HeaderTabs />
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
  fixtures = [],
}: {
  title?: React.ReactNode;
  fixtures?: (Fixture | Interceptor)[];
}) {
  const { values } = useContext(CodeTabContext);
  const hasTabs = values.length > 0;

  return (
    <>
      {fixtures.length ?
        <>
          <Header small={true}>Fixtures</Header>
          <FixturePreview fixtures={fixtures} />
        </>
      : null}
      {hasTabs ?
        <HeaderWithTabControls>{title}</HeaderWithTabControls>
      : null}
    </>
  );
}
