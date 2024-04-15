import React from 'react';

import ErrorFallback from './ErrorFallback.js';

export interface ErrorBoundaryProps<E extends Error> {
  children: React.ReactNode;
  /** className prop sent to fallbackComponent */
  className?: string;
  /** Renders when an error is caught */
  fallbackComponent: React.ComponentType<{
    error: E;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  /** Subscription handler to reset error state on events like URL location changes */
  listen?: (resetListener: () => void) => () => void;
}
export interface ErrorState<E extends Error> {
  error?: E;
}
/**
 * Reusable React error boundary component
 * @see https://dataclient.io/docs/api/ErrorBoundary
 */
export default class ErrorBoundary<E extends Error> extends React.Component<
  ErrorBoundaryProps<E>,
  ErrorState<E>
> {
  static defaultProps = {
    fallbackComponent: ErrorFallback,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  private declare unsubscribe: undefined | (() => void);
  state: ErrorState<E> = {};

  componentDidMount() {
    this.listen();
  }

  componentDidUpdate(
    prevProps: Readonly<ErrorBoundaryProps<E>>,
    prevState: Readonly<ErrorState<E>>,
    snapshot?: any,
  ): void {
    // lol no useEffect do this in a simpler manner
    if (this.props.listen === prevProps.listen) return;
    if (prevProps.listen) {
      this.unlisten();
    }
    if (this.props.listen) this.listen();
  }

  componentWillUnmount() {
    this.unlisten();
  }

  listen() {
    this.unsubscribe = this.props.listen?.(() => {
      if (this.state.error) this.setState(emptyState);
    });
  }

  unlisten() {
    this.unsubscribe?.();
    delete this.unsubscribe;
  }

  render(): JSX.Element {
    if (!this.state.error) {
      return this.props.children as any;
    }
    const props: {
      error: E;
      resetErrorBoundary: () => void;
      className?: string;
    } = {
      error: this.state.error,
      resetErrorBoundary: () => {
        this.setState(emptyState);
      },
    };
    if (this.props.className) props.className = this.props.className;
    return <this.props.fallbackComponent {...props} />;
  }
}

const emptyState = { error: undefined };
