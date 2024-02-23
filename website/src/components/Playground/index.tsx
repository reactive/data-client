import type { Fixture, Interceptor } from '@data-client/test';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import clsx from 'clsx';
import type { Language, PrismTheme } from 'prism-react-renderer';
import React, { lazy } from 'react';
import { LiveProvider } from 'react-live';

import Boundary from './Boundary';
import { isGoogleBot } from './isGoogleBot';
import MonacoPreloads from './MonacoPreloads';
import { PlaygroundTextEdit } from './PlaygroundTextEdit';
import PreviewWrapper from './PreviewWrapper';
import styles from './styles.module.css';
import { useCode } from './useCode';
import { useReactLiveTheme } from './useReactLiveTheme';

// previously exported by react-live
type LiveProviderProps = {
  code?: string;
  disabled?: boolean;
  enableTypeScript?: boolean;
  language?: Language;
  noInline?: boolean;
  scope?: Record<string, unknown>;
  theme?: PrismTheme;
  transformCode?(code: string): void;
};

export default function Playground<T>({
  children,
  transformCode,
  groupId,
  defaultOpen,
  row,
  hidden,
  fixtures,
  getInitialInterceptorData,
  defaultTab,
  ...props
}: Omit<LiveProviderProps, 'ref'> & {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  children: string | any[];
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
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
Playground.defaultProps = {
  row: false,
  hidden: false,
};

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
interface ContentProps<T = any> {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  fixtures: (Fixture | Interceptor<T>)[];
  children: React.ReactNode;
  reverse?: boolean;
  getInitialInterceptorData?: () => T;
  defaultTab?: string;
}

const previewLoading = (
  <PreviewWrapper key="preview">
    <div className={styles.playgroundPreview}></div>
    <div className={styles.debugToggle}>
      Store
      <span className={clsx(styles.arrow, styles.right, styles.vertical)}>
        ▶
      </span>
    </div>
  </PreviewWrapper>
);

const PreviewWithScopeLazy = lazy(() =>
  isGoogleBot ?
    Promise.resolve({ default: (props: any): JSX.Element => previewLoading })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ './PreviewWithScope'
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
