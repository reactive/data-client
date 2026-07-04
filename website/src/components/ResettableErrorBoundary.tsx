import { NetworkErrorBoundary, useController } from '@data-client/react';
import React from 'react';

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
          <>
            <div className={styles.playgroundError}>
              {networkError.message} <i>{networkError.status}</i>
            </div>
            <button
              onClick={() => {
                resetEntireStore();
                setI(i => i + 1);
              }}
            >
              Clear Error
            </button>
          </>
        );
      }}
    >
      {children}
    </NetworkErrorBoundary>
  );
}
