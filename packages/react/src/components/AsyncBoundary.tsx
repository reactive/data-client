import React, { memo, Suspense } from 'react';
import type { JSX } from 'react';

import ErrorBoundary, { ErrorBoundaryProps } from './ErrorBoundary.js';

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
  const susProps = fallback !== undefined ? { fallback } : {};
  return (
    <Suspense {...susProps}>
      <ErrorBoundary {...errorProps} fallbackComponent={errorComponent}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}
export default memo(AsyncBoundary) as typeof AsyncBoundary;

export interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorClassName?: string;
  /** Renders when an error is caught */
  errorComponent?: ErrorBoundaryProps<Error>['fallbackComponent'];
  /** Subscription handler to reset error state on events like URL location changes */
  listen?: ErrorBoundaryProps<Error>['listen'];
}
