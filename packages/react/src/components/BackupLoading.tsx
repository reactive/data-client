import React, { useMemo } from 'react';

export default function BackupLoading() {
  let message: React.ReactNode = 'loading...';
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // env should not change during runtime and this excludes from build
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      console.warn(
        `Uncaught suspense.
Make sure to add your own Suspense boundaries: https://dataclient.io/docs/getting-started/data-dependency#boundaries`,
      );
    }, []);

    message = (
      <>
        <span>Uncaught Suspense.</span>
        Try
        <a href="https://dataclient.io/docs/getting-started/data-dependency#boundaries">
          adding a suspense boundary
        </a>
      </>
    );
  }
  return <div>{message}</div>;
}
