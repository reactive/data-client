import { NetworkErrorBoundary, useController } from '@data-client/react';
import React from 'react';

import ErrorPanel from './Playground/ErrorPanel';
import styles from './Playground/styles.module.css';

interface Props {
  children: React.ReactNode;
}

export default function ResetableErrorBoundary({ children }: Props) {
  return (
    <NetworkErrorBoundary fallbackComponent={NetworkErrorFallback}>
      {children}
    </NetworkErrorBoundary>
  );
}

interface ErrorLike {
  message?: string;
  status?: number | string;
}

function NetworkErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: ErrorLike;
  resetErrorBoundary: () => void;
}) {
  const { resetEntireStore } = useController();
  return (
    <ErrorPanel
      kind="network"
      action={
        <button
          type="button"
          className={styles.errorAction}
          onClick={() => {
            resetEntireStore();
            resetErrorBoundary();
          }}
        >
          Clear Error
        </button>
      }
    >
      <div className={styles.playgroundError}>
        {error.status !== undefined && (
          <strong className={styles.errorName}>{error.status} </strong>
        )}
        {error.message}
      </div>
    </ErrorPanel>
  );
}
