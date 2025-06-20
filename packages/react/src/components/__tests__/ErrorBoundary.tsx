import { NetworkError } from '@data-client/rest';
import { act, render, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';

import ErrorBoundary from '../ErrorBoundary';

describe('<ErrorBoundary />', () => {
  let errorSpy: jest.SpyInstance;
  function onError(e: any) {
    e.preventDefault();
  }
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    if (typeof addEventListener === 'function')
      addEventListener('error', onError);
  });
  afterEach(() => {
    errorSpy.mockRestore();
    if (typeof removeEventListener === 'function')
      removeEventListener('error', onError);
  });

  it('should render children with no error', () => {
    const tree = <ErrorBoundary>hi</ErrorBoundary>;
    const { getByText } = render(tree);
    expect(getByText(/hi/i)).not.toBeNull();
  });
  it('should catch non-network errors', () => {
    let renderCount = 0;
    function Throw(): ReactElement {
      renderCount++;
      throw new Error('you failed');
    }
    const tree = (
      <ErrorBoundary>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>
    );
    const { getByText } = render(tree);
    expect(getByText(/you failed/i)).toBeDefined();
    expect(renderCount).toBeLessThan(10);
  });
  it('should render error case when thrown', () => {
    function Throw(): ReactElement {
      throw new NetworkError(
        new Response('you failed', {
          statusText: '',
          status: 500,
        }),
      );
    }
    const tree = (
      <ErrorBoundary className="error">
        <Throw />
        <div>hi</div>
      </ErrorBoundary>
    );
    const { getByText, queryByText, container } = render(tree);
    expect(getByText(/500/i)).toBeDefined();
    expect(queryByText(/hi/i)).toBe(null);
    expect(
      (container.firstChild as any)?.classList?.contains?.('error'),
    ).toBeTruthy();
  });
  it('should render response.statusText using default fallback', () => {
    function Throw(): ReactElement {
      const response = new Response('', {
        statusText: 'my status text',
        status: 500,
      });
      throw new NetworkError(response);
    }
    const tree = (
      <ErrorBoundary>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).toBeDefined();
    expect(queryByText(/hi/i)).toBe(null);
  });
  it('should reset error when listener triggers', async () => {
    let shouldThrow = true;
    function Throw(): ReactElement {
      const response = new Response('', {
        statusText: 'my status text',
        status: 500,
      });
      if (shouldThrow) throw new NetworkError(response);
      return <></>;
    }

    let listener = () => {};
    const listen = (l: () => void) => {
      listener = l;
      return () => {
        listener = () => {};
      };
    };
    const tree = (
      <ErrorBoundary listen={listen}>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).toBeDefined();
    shouldThrow = false;
    act(() => listener());
    expect(queryByText(/my status text/i)).toBe(null);
    expect(getByText(/hi/i)).toBeDefined();
  });
  it('should ignore listener when unregistered', async () => {
    let shouldThrow = true;
    function Throw(): ReactElement {
      const response = new Response('', {
        statusText: 'my status text',
        status: 500,
      });
      if (shouldThrow) throw new NetworkError(response);
      return <></>;
    }

    let listener = () => {};
    const listen = (l: () => void) => {
      listener = l;
      return () => {
        listener = () => {};
      };
    };
    const tree = (
      <ErrorBoundary listen={listen}>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>
    );
    const { getByText, queryByText, rerender } = render(tree);
    expect(getByText(/my status text/i)).toBeDefined();
    rerender(
      <ErrorBoundary>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>,
    );
    shouldThrow = false;
    act(() => listener());
    expect(getByText(/my status text/i)).toBeDefined();

    // validate re-register
    shouldThrow = true;
    rerender(
      <ErrorBoundary listen={listen}>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>,
    );
    expect(getByText(/my status text/i)).toBeDefined();
    shouldThrow = false;
    act(() => listener());
    expect(queryByText(/my status text/i)).toBe(null);
    expect(getByText(/hi/i)).toBeDefined();
  });

  it('should reset error when handler is called from fallback component', async () => {
    let shouldThrow = true;
    function Throw(): ReactElement {
      const response = new Response('', {
        statusText: 'my status text',
        status: 500,
      });
      if (shouldThrow) throw new NetworkError(response);
      return <></>;
    }
    const Fallback = ({
      error,
      resetErrorBoundary,
      className,
    }: {
      error: Error;
      resetErrorBoundary: () => void;
      className?: string;
    }) => (
      <pre role="alert" className={className}>
        {error.message}{' '}
        <button onClick={resetErrorBoundary}>Clear Error</button>
      </pre>
    );

    const tree = (
      <ErrorBoundary fallbackComponent={Fallback}>
        <Throw />
        <div>hi</div>
      </ErrorBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).toBeDefined();
    const resetButton = queryByText('Clear Error');
    expect(resetButton).not.toBeNull();
    shouldThrow = false;
    act(() => resetButton?.click());
    expect(queryByText(/my status text/i)).toBe(null);
    expect(getByText(/hi/i)).toBeDefined();
  });
});
