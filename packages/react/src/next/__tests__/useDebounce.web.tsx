import { Endpoint } from '@data-client/endpoint';
import { NetworkError } from '@data-client/rest';
import { renderHook, act } from '@data-client/test';
import { render, waitFor } from '@testing-library/react';
import React, { ReactElement, StrictMode, useTransition } from 'react';

import AsyncBoundary from '../../components/AsyncBoundary';
import DataProvider from '../../components/DataProvider';
import { useSuspense } from '../../hooks';
import useDebounce from '../useDebounce';

describe('useDebounce()', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('should not update until delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => {
        return useDebounce(value, 100);
      },
      { initialProps: { value: 'initial' } },
    );
    expect(result.current).toEqual(['initial', false]);
    jest.advanceTimersByTime(10);
    rerender({ value: 'next' });
    rerender({ value: 'third' });
    expect(result.current).toEqual(['initial', false]);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toEqual(['third', false]);
  });

  it('should never update when updatable is false', () => {
    const { result, rerender } = renderHook(
      ({ value, updatable }: { value: string; updatable: boolean }) => {
        return useDebounce(value, 100, updatable);
      },
      { initialProps: { value: 'initial', updatable: false } },
    );
    expect(result.current).toEqual(['initial', false]);
    jest.advanceTimersByTime(10);
    rerender({ value: 'next', updatable: false });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toEqual(['initial', false]);
    rerender({ value: 'third', updatable: true });
    expect(result.current).toEqual(['initial', false]);
    jest.advanceTimersByTime(10);
    expect(result.current).toEqual(['initial', false]);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toEqual(['third', false]);
  });

  it('should be pending while async operation is performed based on debounced value', async () => {
    const issueQuery = new Endpoint(
      ({ q }: { q: string }) => Promise.resolve({ q, text: 'hi' }),
      { name: 'issueQuery' },
    );
    function IssueList({ q }: { q: string }) {
      const response = useSuspense(issueQuery, { q });
      return <div>{response.q}</div>;
    }
    function Search({ query }: { query: string }) {
      const [debouncedQuery, isPending] = useDebounce(query, 100);
      return (
        <div>
          {isPending ?
            <span>loading</span>
          : null}
          <AsyncBoundary fallback={<div>searching...</div>}>
            <IssueList q={debouncedQuery} />
          </AsyncBoundary>
        </div>
      );
    }

    const tree = (
      <DataProvider>
        <Search query="initial" />
      </DataProvider>
    );
    const { queryByText, rerender, getByText } = render(tree);
    expect(queryByText(/loading/i)).toBeNull();
    expect(getByText(/searching/i)).not.toBeNull();

    await waitFor(() => expect(queryByText(/searching/i)).toBeNull());
    expect(getByText(/initial/i)).not.toBeNull();
    rerender(
      <DataProvider>
        <Search query="second" />
      </DataProvider>,
    );
    rerender(
      <DataProvider>
        <Search query="third" />
      </DataProvider>,
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });
    // only check in react 18
    if ('useTransition' in React) {
      // isPending
      expect(getByText(/loading/i)).not.toBeNull();
    }
    // keep showing previous values
    expect(getByText(/initial/i)).not.toBeNull();
    // only check in react 18
    if ('useTransition' in React) {
      expect(queryByText(/searching/i)).toBeNull();
    }

    await waitFor(() => expect(queryByText(/loading/i)).toBeNull());
    expect(getByText(/third/i)).not.toBeNull();
  });
});
