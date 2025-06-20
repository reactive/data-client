import { NetworkError, Endpoint } from '@data-client/rest';
import { render } from '@testing-library/react';
import { ReactElement, StrictMode } from 'react';

import { useSuspense } from '../../hooks';
import AsyncBoundary from '../AsyncBoundary';
import DataProvider from '../DataProvider';

describe('<AsyncBoundary />', () => {
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
    const tree = <AsyncBoundary>hi</AsyncBoundary>;
    const { getByText } = render(tree);
    expect(getByText(/hi/i)).not.toBeNull();
  });
  it('should render fallback when suspending', () => {
    const getThing = new Endpoint(() => Promise.resolve('data'), {
      name: 'getThing',
    });
    function Data() {
      const thing = useSuspense(getThing);
      return <div>{thing}</div>;
    }
    const tree = (
      <StrictMode>
        <DataProvider>
          <AsyncBoundary fallback="loading">
            <Data />
          </AsyncBoundary>
        </DataProvider>
      </StrictMode>
    );
    const { getByText } = render(tree);
    expect(getByText(/loading/i)).not.toBeNull();
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
      <AsyncBoundary errorClassName="error">
        <Throw />
        <div>hi</div>
      </AsyncBoundary>
    );
    const { getByText, queryByText, container } = render(tree);
    expect(getByText(/you failed/i)).not.toBeNull();
    console.error = originalError;
    expect(renderCount).toBeLessThan(10);
  });
  it('should render error case when thrown', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Throw(): ReactElement {
      throw new NetworkError(
        new Response('you failed', {
          statusText: '',
          status: 500,
        }),
      );
    }
    const tree = (
      <AsyncBoundary>
        <Throw />
        <div>hi</div>
      </AsyncBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/500/i)).not.toBeNull();
    expect(queryByText(/hi/i)).toBe(null);
    errorSpy.mockRestore();
  });
  it('should render response.statusText using default fallback', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Throw(): ReactElement {
      const response = new Response('', {
        statusText: 'my status text',
        status: 500,
      });
      throw new NetworkError(response);
    }
    const tree = (
      <AsyncBoundary>
        <Throw />
        <div>hi</div>
      </AsyncBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).not.toBeNull();
    expect(queryByText(/hi/i)).toBe(null);
    errorSpy.mockRestore();
  });
});
