import { usePrismTheme } from '@docusaurus/theme-common';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { FixtureEndpoint } from '@rest-hooks/test';
import clsx from 'clsx';
import React, { useContext, useMemo, useReducer, useState, lazy } from 'react';
import { LiveProvider, LiveProviderProps } from 'react-live';

import CodeTabContext from '../Demo/CodeTabContext';
import Boundary from './Boundary';
import FixturePreview from './FixturePreview';
import Header from './Header';
import MonacoPreloads from './MonacoPreloads';
import PlaygroundEditor from './PlaygroundEditor';
import { PlaygroundTextEdit, useCode } from './PlaygroundTextEdit';
import PreviewWithHeader from './PreviewWithHeader';
import styles from './styles.module.css';

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
  const { handleCodeChange, codes, codeTabs } = useCode(children);
  /*const code = ready.every(v => v)
    ? codes.join('\n')
    : 'render(<div>Loading...</div>);';*/
  const code = codes.join('\n');

  return (
    <Reversible reverse={reverse}>
      <PlaygroundTextEdit
        fixtures={fixtures}
        row={row}
        codeTabs={codeTabs}
        handleCodeChange={handleCodeChange}
        codes={codes}
      />
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
