import type { Fixture, Interceptor } from '@data-client/test';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { parseCodeBlockTitle } from '@docusaurus/theme-common/internal';
import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import { useCallback, useContext, useMemo, useReducer, useState } from 'react';
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
    setClosed(cl => cl.map((_, j) => j !== i));
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
    <div>
      <EditorHeader
        fixtures={!row ? fixtures : []}
        title={row && codeTabs.length === 1 ? codeTabs[0].title : undefined}
      />
      {row && codeTabs.length > 1 ? (
        <EditorTabs
          titles={codeTabs.map(({ title }) => title)}
          closedList={closedList}
          onClick={handleTabSwitch}
          isPlayground={isPlayground}
        />
      ) : null}
      {codeTabs.map(({ title, path, code, collapsed, ...rest }, i) => (
        <React.Fragment key={i}>
          {!row && title ? (
            <CodeTabHeader
              onClick={() => handleTabToggle(i)}
              closed={closedList[i]}
              title={title}
              collapsible={codeTabs.length > 1 || fixtures?.length}
              lastChild={i === codeTabs.length - 1 && large}
            />
          ) : null}
          <div
            key={i}
            className={clsx(styles.playgroundEditor, {
              [styles.hidden]: closedList[i],
            })}
          >
            <BrowserOnly
              fallback={
                <LiveEditor key={i} language="tsx" code={codes[i]} disabled />
              }
            >
              {() => (
                /*closedList[i] ? null : */ <PlaygroundEditor
                  key={i}
                  tabIndex={i}
                  onFocus={
                    row && codeTabs.length > 1 ? handleTabSwitch : handleTabOpen
                  }
                  onChange={handleCodeChange[i]}
                  code={codes[i]}
                  path={'/' + id + '/' + (path || title || 'default.tsx')}
                  {...rest}
                  large={large}
                />
              )}
            </BrowserOnly>
          </div>
        </React.Fragment>
      ))}
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

const codeBlockCollapsedRegex = /collapsed(?=)(?<collapsed>.*?)\1/;
const codeBlockPathRegex = /path=(?<quote>["'])(?<path>.*?)\1/;
function parseCodeBlockCollapsed(metastring?: string): boolean {
  return metastring?.match(codeBlockCollapsedRegex)?.groups!.collapsed !==
    undefined
    ? true
    : false;
}
function parseCodeBlockPath(metastring?: string): string {
  return metastring?.match(codeBlockPathRegex)?.groups!.title ?? '';
}

export function useCode(children) {
  const codeTabs: {
    code: string;
    path?: string;
    title?: string;
    collapsed: boolean;
    [k: string]: any;
  }[] = useMemo(() => {
    if (typeof children === 'string')
      return [{ code: children.replace(/\n$/, ''), collapsed: false }];
    return (Array.isArray(children) ? children : [children])
      .filter(child => child.props.children)
      .map(child =>
        typeof child.props.children === 'string'
          ? child.props
          : child.props.children.props,
      )
      .map(({ children, metastring = '', ...rest }) => {
        const title = parseCodeBlockTitle(metastring) ?? '';
        const collapsed = parseCodeBlockCollapsed(metastring) ?? false;
        const path = parseCodeBlockPath(metastring);
        const highlights = /\{([\d\-,.]+)\}/.exec(metastring)?.[1];
        return {
          code: children.replace(/\n$/, ''),
          title,
          collapsed,
          path,
          highlights,
          ...rest,
        };
      });
  }, [children]);

  const [codes, dispatch] = useReducer(reduceCodes, undefined, () =>
    codeTabs.map(({ code }) => code),
  );
  //const [ready, setReady] = useState(() => codeTabs.map(() => false));
  const handleCodeChange = useMemo(
    () =>
      codeTabs.map((_, i) => v => {
        /*setReady(readies => {
        const ret = [...readies];
        ret[i] = true;
        return ret;
      });*/
        dispatch({ i, code: v });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeTabs.length],
  );
  return { handleCodeChange, codes, codeTabs };
}

function reduceCodes(state: string[], action: { i: number; code: string }) {
  const newstate = [...state];
  newstate[action.i] = action.code;
  return newstate;
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
        className={clsx(styles.small, {
          [styles.lastChild]: lastChild && closed,
        })}
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
        { [styles.small]: hasTabs || !isPlayground, [styles.subtabs]: hasTabs },
        styles.noupper,
        styles.tabControls,
      )}
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
  title,
  fixtures = [],
}: {
  title: string;
  fixtures: (Fixture | Interceptor)[];
}) {
  const { values } = useContext(CodeTabContext);
  const hasTabs = values.length > 0;

  return (
    <>
      {fixtures.length ? (
        <>
          <Header className={styles.small}>Fixtures</Header>
          <FixturePreview fixtures={fixtures} />
        </>
      ) : null}
      {hasTabs ? <HeaderWithTabControls>{title}</HeaderWithTabControls> : null}
    </>
  );
}
EditorHeader.defaultProps = {
  title: (
    <Translate
      id="theme.Playground.liveEditor"
      description="The live editor label of the live codeblocks"
    >
      Editor
    </Translate>
  ),
  fixtures: [],
};
