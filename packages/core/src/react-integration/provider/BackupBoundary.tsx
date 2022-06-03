import React, { Suspense, memo, useMemo, version } from 'react';

/* istanbul ignore next  */
const LegacyReact = version.startsWith('16') || version.startsWith('17');
/* istanbul ignore next  */
const SSR = typeof document === 'undefined';
const SSR_ID = 'rest-hooks-SSR';
/* istanbul ignore next  */
const HYDRATED = !SSR && document.getElementById(SSR_ID);

// since Suspense does not introduce DOM elements, this should not affect rehydration.
const BackupBoundary: React.FunctionComponent<{ children: React.ReactNode }> =
  /* istanbul ignore if */
  LegacyReact && SSR
    ? /* istanbul ignore next  */ ({ children }) => (
        <div id={SSR_ID}>{children}</div>
      )
    : /* istanbul ignore if */ HYDRATED
    ? /* istanbul ignore next  */ ({ children }) => (
        <Suspense fallback={<div id={SSR_ID}></div>}>
          <div id={SSR_ID}>{children}</div>
        </Suspense>
      )
    : ({ children }) => <Suspense fallback={<Loading />}>{children}</Suspense>;

export default memo(BackupBoundary);

function Loading() {
  let message: React.ReactNode = 'loading...';
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // env should not change during runtime and this excludes from build
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      console.warn(
        `Uncaught suspense.
Make sure to add your own Suspense boundaries: https://resthooks.io/docs/getting-started/data-dependency#async-fallbacks`,
      );
    }, []);

    message = (
      <>
        <span>Uncaught Suspense.</span>
        Try
        <a href="https://resthooks.io/docs/getting-started/data-dependency#async-fallbacks">
          adding a suspense boundary
        </a>
      </>
    );
  }
  return <div>{message}</div>;
}
