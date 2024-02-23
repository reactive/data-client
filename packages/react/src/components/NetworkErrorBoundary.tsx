import type { NetworkError } from '@data-client/core';
import React from 'react';

function isNetworkError(error: NetworkError | unknown): error is NetworkError {
  return 'status' in (error as any);
}

interface ErrorBoundaryProps<E extends NetworkError> {
  children: React.ReactNode;
  className?: string;
  fallbackComponent: React.ComponentType<{ error: E; className?: string }>;
}
interface ErrorState<E extends NetworkError> {
  error?: E;
}
/**
 * Handles any networking errors from suspense
 * @see https://dataclient.io/docs/api/NetworkErrorBoundary
 */
export default class NetworkErrorBoundary<
  E extends NetworkError,
> extends React.Component<ErrorBoundaryProps<E>, ErrorState<E>> {
  static defaultProps = {
    fallbackComponent: ({
      error,
      className,
    }: {
      error: NetworkError;
      className: string;
    }) => (
      <div className={className}>
        {error.status} {error.response?.statusText}
      </div>
    ),
  };

  static getDerivedStateFromError(error: NetworkError | any) {
    if (isNetworkError(error)) {
      return { error };
    } else {
      throw error;
    }
  }

  state: ErrorState<E> = {};

  render(): JSX.Element {
    if (!this.state.error) {
      return this.props.children as any;
    }
    const props: { error: E; className?: string } = { error: this.state.error };
    if (this.props.className) props.className = this.props.className;
    return <this.props.fallbackComponent {...props} />;
  }
}
