import React, { useContext, useMemo, useReducer, useState, lazy } from 'react';
import { LiveProvider, LiveProviderProps } from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePrismTheme } from '@docusaurus/theme-common';
import { FixtureEndpoint } from '@rest-hooks/test';

import CodeTabContext from '../Demo/CodeTabContext';
import styles from './styles.module.css';
import FixturePreview from './FixturePreview';
import Header from './Header';
import PreviewWithHeader from './PreviewWithHeader';
import Boundary from './Boundary';
import PlaygroundEditor from './PlaygroundEditor';
import MonacoPreloads from './MonacoPreloads';

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
  includeEndpoints,
  ...props
}: Omit<LiveProviderProps, 'ref'> & {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  children: string | any[];
  fixtures: FixtureEndpoint[];
  includeEndpoints: boolean;
}) {
  const {
    liveCodeBlock: { playgroundPosition },
  } = useDocusaurusContext().siteConfig.themeConfig as any;
  const prismTheme = usePrismTheme();

  return (
    <>
      <div
        className={clsx(styles.playgroundContainer, {
          [styles.row]: row,
          [styles.hidden]: hidden,
        })}
      >
        <LiveProvider theme={prismTheme} {...props}>
          <PlaygroundContent
            reverse={playgroundPosition === 'top'}
            row={row}
            fixtures={fixtures}
            includeEndpoints={includeEndpoints}
            groupId={groupId}
            defaultOpen={defaultOpen}
          >
            {children}
          </PlaygroundContent>
        </LiveProvider>
      </div>
      <MonacoPreloads />
    </>
  );
}
Playground.defaultProps = {
  row: false,
  hidden: false,
};

function PlaygroundContent({
  reverse,
  children,
  row,
  fixtures,
  includeEndpoints,
  groupId,
  defaultOpen,
}) {
  const id = useId();

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
      .map(({ children, title = '', collapsed = false, path, ...rest }) => ({
        code: children.replace(/\n$/, ''),
        title: title.replaceAll('"', ''),
        collapsed,
        path,
        ...rest,
      }));
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
  const [closedList, setClosed] = useState(() =>
    codeTabs.map(({ collapsed }) => collapsed),
  );

  /*const code = ready.every(v => v)
    ? codes.join('\n')
    : 'render(<div>Loading...</div>);';*/
  const code = codes.join('\n');

  return (
    <Reversible reverse={reverse}>
      <div>
        <EditorHeader fixtures={!row && fixtures} />
        {row && codeTabs.length > 1 ? (
          <EditorTabs
            titles={codeTabs.map(({ title }) => title)}
            closedList={closedList}
            onClick={i => setClosed(cl => cl.map((_, j) => j !== i))}
          />
        ) : null}
        {codeTabs.map(({ title, path, code, collapsed, ...rest }, i) => (
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
            <div
              key={i}
              className={clsx(styles.playgroundEditor, {
                [styles.hidden]: closedList[i],
              })}
            >
              {
                /*closedList[i] ? null : */ <PlaygroundEditor
                  key={i}
                  onChange={handleCodeChange[i]}
                  code={codes[i]}
                  path={'/' + id + '/' + (path || title || 'default.tsx')}
                  {...rest}
                />
              }
            </div>
          </React.Fragment>
        ))}
      </div>
      <Boundary
        fallback={
          <LiveProvider
            key="preview"
            code={'render(() => "Loading...");'}
            noInline
          >
            <PreviewWithHeader
              key="preview"
              {...{
                includeEndpoints,
                groupId,
                defaultOpen,
                row,
                fixtures,
              }}
            />
          </LiveProvider>
        }
      >
        <PreviewWithScopeLazy
          code={code}
          {...{ includeEndpoints, groupId, defaultOpen, row, fixtures }}
        />
      </Boundary>
    </Reversible>
  );
}

const isGoogleBot =
  typeof navigator === 'object' &&
  /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator?.userAgent);

const PreviewWithScopeLazy = lazy(() =>
  isGoogleBot
    ? Promise.resolve({ default: (props: any): JSX.Element => null })
    : import(
        /* webpackChunkName: '[request]', webpackPrefetch: true */ './PreviewWithScope'
      ),
);

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
function useId() {
  return useMemo(() => (Math.random() * 10000).toPrecision(4).toString(), []);
}
