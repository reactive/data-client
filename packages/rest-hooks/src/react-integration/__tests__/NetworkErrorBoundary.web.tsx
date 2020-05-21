import React, { useContext, ReactChild, ReactNode, ReactElement } from 'react';
import { render } from '@testing-library/react';

import NetworkErrorBoundary from '../NetworkErrorBoundary';

describe('<NetworkErrorBoundary />', () => {
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
    const tree = <NetworkErrorBoundary>hi</NetworkErrorBoundary>;
    const { getByText } = render(tree);
    expect(getByText(/hi/i)).toBeDefined();
  });
  it('should fallthrough if status is not set', () => {
    const originalError = console.error;
    console.error = jest.fn();
    function Throw(): ReactElement {
      throw new Error('you failed');
    }
    const tree = (
      <NetworkErrorBoundary>
        <Throw />
        <div>hi</div>
      </NetworkErrorBoundary>
    );
    expect(() => render(tree)).toThrow();
    console.error = originalError;
  });
  it('should render error case when thrown', () => {
    function Throw(): ReactElement {
      const error: any = new Error('you failed');
      error.status = 500;
      throw error;
    }
    const tree = (
      <NetworkErrorBoundary>
        <Throw />
        <div>hi</div>
      </NetworkErrorBoundary>
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
      <NetworkErrorBoundary>
        <Throw />
        <div>hi</div>
      </NetworkErrorBoundary>
    );
    const { getByText, queryByText } = render(tree);
    expect(getByText(/my status text/i)).toBeDefined();
    expect(queryByText(/hi/i)).toBe(null);
  });
});
