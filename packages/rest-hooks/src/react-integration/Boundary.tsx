import { memo, Suspense } from 'react';
import type { ReactNode } from 'react';
import type { NetworkError } from '@rest-hooks/core';

import NetworkErrorBoundary from './NetworkErrorBoundary';

function Boundary({
  children,
  errorFallback,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: React.ComponentType<{ error: NetworkError }>;
}) {
  return (
    <Suspense fallback={fallback}>
      <NetworkErrorBoundary fallbackComponent={errorFallback}>
        {children}
      </NetworkErrorBoundary>
    </Suspense>
  );
}
export default memo(Boundary);
