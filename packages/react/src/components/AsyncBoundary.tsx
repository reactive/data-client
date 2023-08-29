import type { NetworkError } from '@data-client/core';
import React, { memo, Suspense } from 'react';

import NetworkErrorBoundary from './NetworkErrorBoundary.js';

/**
 * Handles loading and error conditions of Suspense
 * @see https://dataclient.io/docs/api/AsyncBoundary
 */
function AsyncBoundary({
  children,
  errorComponent,
  fallback,
  ...errorProps
}: Props): JSX.Element {
  return (
    <Suspense fallback={fallback}>
      <NetworkErrorBoundary {...errorProps} fallbackComponent={errorComponent}>
        {children}
      </NetworkErrorBoundary>
    </Suspense>
  );
}
export default memo(AsyncBoundary) as typeof AsyncBoundary;

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorClassName?: string;
  errorComponent?: React.ComponentType<{
    error: NetworkError;
    className?: string;
  }>;
}
