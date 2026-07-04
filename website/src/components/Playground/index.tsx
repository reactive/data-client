import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import React, { lazy } from 'react';
import { LiveProvider } from 'react-live';

import Boundary from './Boundary';
import { isGoogleBot } from './isMobileOrBot';
import MonacoPreloads from './MonacoPreloads';
import { PlaygroundTextEdit } from './PlaygroundTextEdit';
import type PreviewWithScopeType from './PreviewWithScope';
import PreviewWrapper from './PreviewWrapper';
import { StoreToggle } from './StoreInspector';
import styles from './styles.module.css';
import type { PreviewProps } from './types';
import { useCode } from './useCode';
import { useReactLiveTheme } from './useReactLiveTheme';

type LiveProviderProps = React.ComponentProps<typeof LiveProvider>;

export default function Playground<T>({
  children,
  groupId,
  defaultOpen,
  row = false,
  hidden = false,
  fixtures,
  getInitialInterceptorData,
  defaultTab,
  ...props
}: LiveProviderProps &
  Omit<PreviewProps<T>, 'row'> & {
    row?: boolean;
    hidden?: boolean;
    children: string | React.ReactElement[];
    defaultTab?: string;
  }) {
  const {
    liveCodeBlock: { playgroundPosition },
  } = useDocusaurusContext().siteConfig.themeConfig as any;
  const realTheme = useReactLiveTheme();

  return (
    <>
      <div
        className={clsx(styles.playgroundContainer, {
          [styles.row]: row,
          [styles.hidden]: hidden,
        })}
      >
        <LiveProvider theme={realTheme} enableTypeScript={true} {...props}>
          <PlaygroundContent
            reverse={playgroundPosition === 'top'}
            row={row}
            fixtures={fixtures}
            groupId={groupId}
            defaultOpen={defaultOpen}
            getInitialInterceptorData={getInitialInterceptorData}
            defaultTab={defaultTab}
          >
            {children}
          </PlaygroundContent>
        </LiveProvider>
      </div>
      <MonacoPreloads />
    </>
  );
}

function PlaygroundContent<T>({
  reverse,
  children,
  row,
  fixtures,
  groupId,
  defaultOpen,
  defaultTab,
  getInitialInterceptorData,
}: ContentProps<T>) {
  const { handleCodeChange, codes, codeTabs } = useCode(children, defaultTab);
  // defer so typing in the editor isn't blocked by preview re-transpilation
  const code = React.useDeferredValue(codes.join('\n'));

  return (
    <Reversible reverse={reverse}>
      <PlaygroundTextEdit
        fixtures={fixtures}
        row={row}
        codeTabs={codeTabs}
        handleCodeChange={handleCodeChange}
        codes={codes}
      />
      <Boundary fallback={previewLoading}>
        <PreviewWithScopeLazy
          code={code}
          {...{
            groupId,
            defaultOpen,
            row,
            fixtures,
            getInitialInterceptorData,
          }}
        />
      </Boundary>
    </Reversible>
  );
}
interface ContentProps<T = any> extends PreviewProps<T> {
  children: React.ReactNode;
  reverse?: boolean;
  defaultTab?: string;
}

const previewLoading = (
  <PreviewWrapper key="preview">
    <div className={styles.playgroundPreview}></div>
    <StoreToggle />
  </PreviewWrapper>
);

const PreviewWithScopeLazy = lazy<typeof PreviewWithScopeType>(() =>
  isGoogleBot ?
    Promise.resolve({ default: () => previewLoading })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './PreviewWithScope'
    ),
);

function Reversible({
  children,
  reverse = false,
}: {
  children: React.ReactNode[];
  reverse?: boolean;
}): React.ReactElement {
  return (reverse ? [...children].reverse() : children) as React.ReactElement;
}
