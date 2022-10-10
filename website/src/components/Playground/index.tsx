import React, { memo, useContext, useMemo, useReducer, useState } from 'react';
import { LiveProvider, LiveEditor, LiveProviderProps } from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { usePrismTheme } from '@docusaurus/theme-common';
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from 'typescript';
import { FixtureEndpoint } from '@rest-hooks/test';

import CodeTabContext from '../Demo/CodeTabContext';
import styles from './styles.module.css';
import FixturePreview from './FixturePreview';
import Header from './Header';
import PreviewWithHeader from './PreviewWithHeader';

function babelTransform(code) {
  const transformed = transpileModule(code.replaceAll(/^import.+$/gm, ''), {
    compilerOptions: {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ES2017,
      jsx: JsxEmit.React,
    },
  });
  return transformed.outputText;
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
  fixtures,
}: {
  title: string;
  fixtures: FixtureEndpoint[];
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

export default function Playground({
  children,
  transformCode,
  groupId,
  defaultOpen,
  row,
  hidden,
  fixtures,
  ...props
}: Omit<LiveProviderProps, 'ref'> & {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  children: string | any[];
  fixtures: FixtureEndpoint[];
}) {
  const {
    liveCodeBlock: { playgroundPosition },
  } = useDocusaurusContext().siteConfig.themeConfig as any;
  const prismTheme = usePrismTheme();
  const isBrowser = useIsBrowser();

  const handleTransformCode = useMemo(
    () => transformCode || (code => babelTransform(`${code};`)),
    [transformCode],
  );
  const codeTabs: { code: string; title?: string; collapsed: boolean }[] =
    useMemo(() => {
      if (typeof children === 'string')
        return [{ code: children.replace(/\n$/, ''), collapsed: false }];
      return (Array.isArray(children) ? children : [children])
        .filter(child => child.props.children)
        .map(child =>
          typeof child.props.children === 'string'
            ? child.props
            : child.props.children.props,
        )
        .map(({ children, title = '', collapsed = false }) => ({
          code: children.replace(/\n$/, ''),
          title: title.replaceAll('"', ''),
          collapsed,
        }));
    }, [children]);

  const [codes, dispatch] = useReducer(reduceCodes, undefined, () =>
    codeTabs.map(({ code }) => code),
  );
  const handleCodeChange = useMemo(
    () => codeTabs.map((_, i) => v => dispatch({ i, code: v })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeTabs.length],
  );
  const [closedList, setClosed] = useState(() =>
    codeTabs.map(({ collapsed }) => collapsed),
  );

  return (
    <div
      className={clsx(styles.playgroundContainer, {
        [styles.row]: row,
        [styles.hidden]: hidden,
      })}
    >
      <LiveProvider theme={prismTheme} {...props}>
        <Reversible reverse={playgroundPosition === 'top'}>
          <div>
            <EditorHeader fixtures={!row && fixtures} />
            {row && codeTabs.length > 1 ? (
              <EditorTabs
                titles={codeTabs.map(({ title }) => title)}
                closedList={closedList}
                onClick={i => setClosed(cl => cl.map((_, j) => j !== i))}
              />
            ) : null}
            {codeTabs.map(({ title }, i) => (
              <React.Fragment key={i}>
                {!row && title ? (
                  <CodeTabHeader
                    onClick={() =>
                      setClosed(cl => {
                        const n = [...cl];
                        n[i] = !n[i];
                        return n;
                      })
                    }
                    closed={closedList[i]}
                    title={title}
                  />
                ) : null}
                {closedList[i] ? null : (
                  <MemoEditor
                    key={`${isBrowser}-${i}`}
                    className={styles.playgroundEditor}
                    onChange={handleCodeChange[i]}
                    code={codes[i]}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <LiveProvider
            code={codes.join('\n')}
            transformCode={handleTransformCode}
            {...props}
          >
            <PreviewWithHeader
              groupId={groupId}
              defaultOpen={defaultOpen}
              row={row}
              fixtures={fixtures}
            />
          </LiveProvider>
        </Reversible>
      </LiveProvider>
    </div>
  );
}
Playground.defaultProps = {
  row: false,
  hidden: false,
};

function Reversible({
  children,
  reverse,
}: {
  children: React.ReactNode[];
  reverse: boolean;
}): React.ReactElement {
  const newchild = [...children];
  newchild.reverse();
  if (reverse) {
    return newchild as any;
  }
  return children as any;
}
Reversible.defaultProps = {
  reverse: false,
};

function reduceCodes(state: string[], action: { i: number; code: string }) {
  const newstate = [...state];
  newstate[action.i] = action.code;
  return newstate;
}
const MemoEditor = memo(LiveEditor);

function CodeTabHeader({ onClick, closed, title }) {
  return (
    <Header className={styles.small} onClick={onClick}>
      <span className={clsx(styles.arrow, closed ? styles.right : styles.down)}>
        ▶
      </span>
      {title}
    </Header>
  );
}

function EditorTabs({ titles, closedList, onClick }) {
  const { values } = useContext(CodeTabContext);
  const hasTabs = values.length > 0;
  return (
    <Header
      className={clsx(
        { [styles.small]: hasTabs, [styles.subtabs]: hasTabs },
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
