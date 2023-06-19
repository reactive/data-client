import { Endpoint } from '@data-client/endpoint';
import { render } from '@testing-library/react';
import React, {
  useContext,
  ReactChild,
  ReactNode,
  ReactElement,
  StrictMode,
} from 'react';

import { useSuspense } from '../../hooks';
import AsyncBoundary from '../AsyncBoundary';
import CacheProvider from '../CacheProvider';

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
    expect(getByText(/hi/i)).toBeDefined();
  });
  it('should render fallback when suspending', () => {
    const getThing = new Endpoint(() => Promise.resolve('data'));
    function Data() {
      const thing = useSuspense(getThing);
      return <div>{thing}</div>;
    }
    const tree = (
      <StrictMode>
        <CacheProvider>
          <AsyncBoundary fallback="loading">
            <Data />
          </AsyncBoundary>
        </CacheProvider>
      </StrictMode>
    );
    const { getByText } = render(tree);
    expect(getByText(/loading/i)).toBeDefined();
  });
  it('should fallthrough if status is not set', () => {
    const originalError = console.error;
    console.error = jest.fn();
    let renderCount = 0;
    function Throw(): ReactElement {
      renderCount++;
      throw new Error('you failed');
    }
    const tree = (
      <AsyncBoundary>
        <Throw />
        <div>hi</div>
      </AsyncBoundary>
    );
    expect(() => render(tree)).toThrow('you failed');
    console.error = originalError;
    expect(renderCount).toBeLessThan(10);
  });
  it('should render error case when thrown', () => {
    function Throw(): ReactElement {
      const error: any = new Error('you failed');
      error.status = 500;
      throw error;
    }
    const tree = (
      <AsyncBoundary>
        <Throw />
        <div>hi</div>
      </AsyncBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/500/i)).toBeDefined();
    expect(queryByText(/hi/i)).toBe(null);
  });
  it('should render response.statusText using default fallback', () => {
    function Throw(): ReactElement {
      const error: any = new Error('you failed');
      error.status = 500;
      error.response = {
        statusText: 'my status text',
      };
      throw error;
    }
    const tree = (
      <AsyncBoundary>
        <Throw />
        <div>hi</div>
      </AsyncBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).toBeDefined();
    expect(queryByText(/hi/i)).toBe(null);
  });
});
