import { NetworkErrorBoundary, useController } from '@data-client/react';
import React from 'react';

import { ErrorPanel } from './Playground/preview/PreviewError';
import styles from './Playground/styles.module.css';

interface Props {
  children: React.ReactNode;
}

interface ErrorLike {
  message?: string;
  status?: number | string;
}

export default function ResetableErrorBoundary({ children }: Props) {
  const [i, setI] = React.useState(0);
  const { resetEntireStore } = useController();

  return (
    <NetworkErrorBoundary
      key={i}
      fallbackComponent={({ error }) => {
        const networkError = error as ErrorLike;
        return (
          <ErrorPanel
            kind="network"
            action={
              <button
                type="button"
                className={styles.errorAction}
                onClick={() => {
                  resetEntireStore();
                  setI(i => i + 1);
                }}
              >
                Clear Error
              </button>
            }
          >
            <div className={styles.playgroundError}>
              {networkError.status !== undefined ?
                <strong className={styles.errorName}>
                  {networkError.status}
                </strong>
              : null}{' '}
              {networkError.message}
            </div>
          </ErrorPanel>
        );
      }}
    >
      {children}
    </NetworkErrorBoundary>
  );
}
