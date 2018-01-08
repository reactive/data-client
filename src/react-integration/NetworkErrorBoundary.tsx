import React from 'react';

interface Props {
  children: React.ReactNode;
  fallbackComponent: React.ComponentType<{ error: Error }>;
}
interface State {
  error?: Error;
}
export default class NetworkErrorBoundary extends React.Component<
  Props,
  State
> {
  static defaultProps = {
    fallbackComponent: ({ error }: { error: any }) => (
      <div>
        {error.status} {error.response && error.response.statusText}
      </div>
    ),
  };

  static getDerivedStateFromError(error: any) {
    if (error.status) {
      return { error };
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
