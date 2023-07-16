import type { NetworkError } from '@data-client/core';
import React, { memo, Suspense } from 'react';

import NetworkErrorBoundary from './NetworkErrorBoundary.js';

/**
 * Handles loading and error conditions of Suspense
 * @see https://resthooks.io/docs/api/AsyncBoundary
 */
function AsyncBoundary({
  children,
  errorComponent,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorComponent?: React.ComponentType<{ error: NetworkError }>;
}): JSX.Element {
  return (
    <Suspense fallback={fallback}>
      <NetworkErrorBoundary fallbackComponent={errorComponent}>
        {children}
      </NetworkErrorBoundary>
    </Suspense>
  );
}
export default memo(AsyncBoundary) as typeof AsyncBoundary;
