import React, { useContext } from 'react';
import { LiveProvider, LiveEditor, LiveProviderProps } from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { usePrismTheme } from '@docusaurus/theme-common';
import * as ts from 'typescript';
import { FixtureEndpoint } from '@rest-hooks/test';

import CodeTabContext from '../Demo/CodeTabContext';
import Preview from './Preview';
import styles from './styles.module.css';
import FixturePreview from './FixturePreview';

const babelTransform = code => {
  const transformed = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2017,
      jsx: ts.JsxEmit.React,
    },
  });
  return transformed.outputText;
};

function Header({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx(styles.playgroundHeader, className)}>{children}</div>
  );
}

function PreviewWithHeader({ groupId, defaultOpen, row, fixtures }) {
  return (
    <div
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Header>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          Live Preview
        </Translate>
      </Header>
      <div className={styles.playgroundResult}>
        <Preview
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
        />
      </div>
    </div>
  );
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
      <div>{children}</div>
      <HeaderTabs />
    </Header>
  );
}

function EditorWithHeader({ title, fixtures }) {
  const { values } = useContext(CodeTabContext);
  const hasTabs = values.length > 0;
  const isBrowser = useIsBrowser();
  return (
    <div>
      {fixtures.length ? (
        <>
          <Header>Fixtures</Header>
          <FixturePreview fixtures={fixtures} />
        </>
      ) : null}
      {hasTabs ? (
        <HeaderWithTabControls>{title}</HeaderWithTabControls>
      ) : (
        <Header>{title}</Header>
      )}
      <LiveEditor key={`${isBrowser}`} className={styles.playgroundEditor} />
    </div>
  );
}
EditorWithHeader.defaultProps = {
  title: (
    <Translate
      id="theme.Playground.liveEditor"
      description="The live editor label of the live codeblocks"
    >
      Live Editor
    </Translate>
  ),
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
  children: string;
  fixtures: FixtureEndpoint[];
}) {
  const {
    liveCodeBlock: { playgroundPosition },
  } = useDocusaurusContext().siteConfig.themeConfig as any;
  const prismTheme = usePrismTheme();

  const scope = { ...props.scope };

  return (
    <div
      className={clsx(styles.playgroundContainer, {
        [styles.row]: row,
        [styles.hidden]: hidden,
      })}
    >
      <LiveProvider
        code={children.replace(/\n$/, '')}
        transformCode={transformCode || (code => babelTransform(`${code};`))}
        theme={prismTheme}
        {...props}
      >
        {playgroundPosition === 'top' ? (
          <>
            <PreviewWithHeader
              groupId={groupId}
              defaultOpen={defaultOpen}
              row={row}
              fixtures={fixtures}
            />
            <EditorWithHeader fixtures={fixtures} />
          </>
        ) : (
          <>
            <EditorWithHeader fixtures={fixtures} />
            <PreviewWithHeader
              groupId={groupId}
              defaultOpen={defaultOpen}
              row={row}
              fixtures={fixtures}
            />
          </>
        )}
      </LiveProvider>
    </div>
  );
}
Playground.defaultProps = {
  row: false,
  hidden: false,
};
