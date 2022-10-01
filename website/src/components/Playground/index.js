/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext } from 'react';
import { LiveProvider, LiveEditor } from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { usePrismTheme } from '@docusaurus/theme-common';
import * as ts from 'typescript';

import CodeTabContext from '../Demo/CodeTabContext';
import Result from './Result';
import styles from './styles.module.css';

const babelTransform = code => {
  const transformed = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2017,
      jsx: 'react',
    },
  });
  return transformed.outputText;
};

function Header({ children, className }) {
  return (
    <div className={clsx(styles.playgroundHeader, className)}>{children}</div>
  );
}

function ResultWithHeader({ groupId, defaultOpen, row }) {
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
        <Result groupId={groupId} defaultOpen={defaultOpen} row={row} />
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

function EditorWithHeader({ title }) {
  const { values } = useContext(CodeTabContext);
  const hasTabs = values.length > 0;
  const isBrowser = useIsBrowser();
  return (
    <div>
      {hasTabs ? (
        <HeaderWithTabControls>{title}</HeaderWithTabControls>
      ) : (
        <Header>{title}</Header>
      )}
      <LiveEditor key={isBrowser} className={styles.playgroundEditor} />
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
  hidden = false,
  ...props
}) {
  const {
    siteConfig: {
      themeConfig: {
        liveCodeBlock: { playgroundPosition },
      },
    },
  } = useDocusaurusContext();
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
            <ResultWithHeader
              groupId={groupId}
              defaultOpen={defaultOpen}
              row={row}
            />
            <EditorWithHeader />
          </>
        ) : (
          <>
            <EditorWithHeader />
            <ResultWithHeader
              groupId={groupId}
              defaultOpen={defaultOpen}
              row={row}
            />
          </>
        )}
      </LiveProvider>
    </div>
  );
}
Playground.defaultProps = {
  row: false,
};
