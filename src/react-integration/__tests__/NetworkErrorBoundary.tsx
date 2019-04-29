import React, { useContext, ReactChild, ReactNode, ReactElement } from 'react';
import { cleanup, act, render } from 'react-testing-library';

import NetworkErrorBoundary from '../NetworkErrorBoundary';

afterEach(cleanup);

describe('<NetworkErrorBoundary />', () => {
  function onError(e: any) {
    e.preventDefault();
  }
  beforeEach(() => {
    window.addEventListener('error', onError);
  });
  afterEach(() => {
    window.removeEventListener('error', onError);
  });

  it('should render children with no error', () => {
    const tree = <NetworkErrorBoundary>hi</NetworkErrorBoundary>;
    const { getByText } = render(tree);
    expect(getByText(/hi/i)).toBeDefined();
  });
  it('should fallthrough if status is not set', () => {
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
