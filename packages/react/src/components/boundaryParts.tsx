import React from 'react';
import type { ReactElement, ReactNode } from 'react';

import ErrorBoundary, { ErrorBoundaryProps } from './ErrorBoundary.js';

/** AsyncBoundary's props as its Suspense's props and the content that Suspense holds */
export function boundaryParts({
  children,
  errorComponent,
  fallback,
  ...errorProps
}: Props): [{ fallback?: ReactNode }, ReactElement] {
  const content = (
    <ErrorBoundary {...errorProps} fallbackComponent={errorComponent}>
      {children}
    </ErrorBoundary>
  );
  return [fallback !== undefined ? { fallback } : {}, content];
}

export interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorClassName?: string;
  /** Renders when an error is caught */
  errorComponent?: ErrorBoundaryProps<Error>['fallbackComponent'];
  /** Subscription handler to reset error state on events like URL location changes */
  listen?: ErrorBoundaryProps<Error>['listen'];
}
