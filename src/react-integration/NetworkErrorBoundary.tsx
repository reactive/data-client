import React from 'react';

export interface NetworkError extends Error {
  status: number | undefined;
  response?: { statusText?: string; body?: any };
}

function isNetworkError(error: NetworkError | any): error is NetworkError {
  return Object.prototype.hasOwnProperty.call(error, 'status');
}

interface Props<E extends NetworkError> {
  children: React.ReactNode;
  fallbackComponent: React.ComponentType<{ error: E }>;
}
interface State<E extends NetworkError> {
  error?: E;
}
export default class NetworkErrorBoundary<
  E extends NetworkError
> extends React.Component<Props<E>, State<E>> {
  static defaultProps = {
    fallbackComponent: ({ error }: { error: NetworkError }) => (
      <div>
        {error.status} {error.response && error.response.statusText}
      </div>
    ),
  };

  static getDerivedStateFromError(error: NetworkError | any) {
    if (isNetworkError(error)) {
      return { error };
    }
  }

  state: State<E> = {};

  componentDidCatch(error: any) {
    // Note this is dependant on superagent errors. Should rethink this.
    if (!isNetworkError(error)) {
      throw error;
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    return <this.props.fallbackComponent error={this.state.error} />;
  }
}
