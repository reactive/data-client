/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Suspense } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import usePrismTheme from '@theme/hooks/usePrismTheme';
import { CacheProvider } from 'rest-hooks';
import ExecutionEnvironment from 'exenv';
import * as ts from 'typescript';

import StoreInspector from './StoreInspector';
import styles from './styles.module.css';

const babelTransform = code => {
  const transformed = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: 'react',
    },
  });

  return transformed.outputText;
};

function Header({ children }) {
  return <div className={clsx(styles.playgroundHeader)}>{children}</div>;
}

function ResultWithHeader() {
  const child = ExecutionEnvironment.canUseDOM ? (
    <Suspense fallback="loading...">
      <LivePreview />
      <LiveError />
    </Suspense>
  ) : null;
  return (
    <>
      <Header>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          Result
        </Translate>
      </Header>
      <div className={styles.playgroundResult}>
        <CacheProvider>
          <div className={styles.playgroundPreview}>{child}</div>
          <StoreInspector />
        </CacheProvider>
      </div>
    </>
  );
}

function EditorWithHeader({ title }) {
  return (
    <>
      <Header>{title}</Header>
      <LiveEditor className={styles.playgroundEditor} />
    </>
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

export default function Playground({ children, transformCode, ...props }) {
  const isBrowser = useIsBrowser();
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
    <div className={styles.playgroundContainer}>
      {/*<LiveProvider
        key={isBrowser}
        code={isBrowser ? endpointCode.replace(/\n$/, '') : ''}
        transformCode={transformCode || (code => `${code};`)}
        theme={prismTheme}
        {...props}
      >
        <EditorWithHeader
          title={
            <Translate
              id="theme.Playground.liveEditor"
              description="The live editor label of the live codeblocks"
            >
              Endpoint Editor
            </Translate>
          }
        />
        </LiveProvider>*/}
      <LiveProvider
        key={isBrowser}
        code={isBrowser ? children.replace(/\n$/, '') : ''}
        transformCode={transformCode || (code => babelTransform(`${code};`))}
        transpileOptions={{
          target: { chrome: 60 },
          transforms: { classes: false, letConst: false },
        }}
        theme={prismTheme}
        {...props}
      >
        {playgroundPosition === 'top' ? (
          <>
            <ResultWithHeader />
            <EditorWithHeader />
          </>
        ) : (
          <>
            <EditorWithHeader />
            <ResultWithHeader />
          </>
        )}
      </LiveProvider>
    </div>
  );
}
