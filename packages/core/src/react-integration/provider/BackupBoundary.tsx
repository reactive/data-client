import React, { Suspense, memo } from 'react';
import { useMemo } from 'react';

function BackupBoundary({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
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
        Try{' '}
        <a href="https://resthooks.io/docs/getting-started/data-dependency#async-fallbacks">
          adding a suspense boundary
        </a>
      </>
    );
  }
  return <div>{message}</div>;
}
