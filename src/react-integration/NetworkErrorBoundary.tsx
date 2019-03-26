import React from 'react';

export interface ErrorWithStatus extends Error {
  status: number;
  response?: { statusText?: string, body?: any };
}

interface Props {
  children: React.ReactNode;
  fallbackComponent: React.ComponentType<{ error: ErrorWithStatus }>;
}
interface State {
  error?: ErrorWithStatus;
}
export default class NetworkErrorBoundary extends React.Component<
  Props,
  State
> {
  static defaultProps = {
    fallbackComponent: ({ error }: { error: ErrorWithStatus }) => (
      <div>
        {error.status} {error.response && error.response.statusText}
      </div>
    ),
  };

  static getDerivedStateFromError(error: ErrorWithStatus | any) {
    if (error.status) {
      return { error: error as ErrorWithStatus };
    }
  }

  state: State = {};

  componentDidCatch(error: any) {
    // Note this is dependant on superagent errors. Should rethink this.
    if (!error.status) {
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
