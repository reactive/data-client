import { NetworkError } from '@data-client/rest';
import { render, fireEvent } from '@testing-library/react-native';
import { ReactElement } from 'react';
import { Text, Button, View } from 'react-native';

import ErrorBoundary from '../ErrorBoundary';

describe('<ErrorBoundary />', () => {
  function onError(e: any) {
    e.preventDefault();
  }
  beforeEach(() => {
    if (typeof addEventListener === 'function')
      addEventListener('error', onError);
  });
  afterEach(() => {
    if (typeof removeEventListener === 'function')
      removeEventListener('error', onError);
  });

  it('should render children with no error', () => {
    const tree = (
      <ErrorBoundary>
        <Text>hi</Text>
      </ErrorBoundary>
    );
    const { getByText } = render(tree);
    expect(getByText(/hi/i)).not.toBeNull();
  });
  it('should catch non-network errors', () => {
    const originalError = console.error;
    console.error = jest.fn();
    let renderCount = 0;
    function Throw(): ReactElement {
      renderCount++;
      throw new Error('you failed');
    }
    const tree = (
      <ErrorBoundary>
        <Throw />
        <Text>hi</Text>
      </ErrorBoundary>
    );
    const { getByText } = render(tree);
    expect(getByText(/you failed/i)).not.toBeNull();
    console.error = originalError;
    expect(renderCount).toBeLessThan(10);
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
        <Text>hi</Text>
      </ErrorBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).not.toBeNull();
    expect(queryByText(/hi/i)).toBe(null);
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
    }: {
      error: Error;
      resetErrorBoundary: () => void;
    }) => (
      <View role="alert">
        <Text>{error.message} </Text>
        <Button onPress={resetErrorBoundary} title="Clear Error" />
      </View>
    );

    const tree = (
      <ErrorBoundary fallbackComponent={Fallback}>
        <Throw />
        <Text>hi</Text>
      </ErrorBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).not.toBeNull();
    const resetButton = queryByText('Clear Error');
    expect(resetButton).not.toBeNull();
    if (!resetButton) return;
    shouldThrow = false;
    fireEvent.press(resetButton);
    expect(queryByText(/my status text/i)).toBe(null);
    expect(getByText(/hi/i)).not.toBeNull();
  });
});
