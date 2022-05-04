import React from 'react';
import { NetworkErrorBoundary, useController } from 'rest-hooks';

import styles from './Playground/styles.module.css';

export default function ResetableErrorBoundary({ children }) {
  const [i, setI] = React.useState(0);
  const { resetEntireStore } = useController();

  return (
    <NetworkErrorBoundary
      key={i}
      fallbackComponent={({ error }) => (
        <>
          <div className={styles.playgroundError}>
            {error.message} <i>{error.status}</i>
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
      )}
    >
      {children}
    </NetworkErrorBoundary>
  );
}
