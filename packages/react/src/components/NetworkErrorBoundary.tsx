import type { NetworkError } from '@data-client/core';
import React from 'react';

function isNetworkError(error: NetworkError | unknown): error is NetworkError {
  return 'status' in (error as any);
}

interface Props<E extends NetworkError> {
  children: React.ReactNode;
  fallbackComponent: React.ComponentType<{ error: E }>;
}
interface State<E extends NetworkError> {
  error?: E;
}
/**
 * Handles any networking errors from suspense
 * @see https://resthooks.io/docs/api/NetworkErrorBoundary
 */
export default class NetworkErrorBoundary<
  E extends NetworkError,
> extends React.Component<Props<E>, State<E>> {
  static defaultProps = {
    fallbackComponent: ({ error }: { error: NetworkError }) => (
      <div>
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

  state: State<E> = {};

  render(): JSX.Element {
    if (!this.state.error) {
      return this.props.children as any;
    }
    return <this.props.fallbackComponent error={this.state.error} />;
  }
}
