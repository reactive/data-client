import { renderHook, act } from '@testing-library/react-hooks';

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
    expect(result.current).toBe('initial');
    jest.advanceTimersByTime(10);
    rerender({ value: 'next' });
    rerender({ value: 'third' });
    expect(result.current).toBe('initial');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('third');
  });

  it('should never update when updatable is false', () => {
    const { result, rerender } = renderHook(
      ({ value, updatable }: { value: string; updatable: boolean }) => {
        return useDebounce(value, 100, updatable);
      },
      { initialProps: { value: 'initial', updatable: false } },
    );
    expect(result.current).toBe('initial');
    jest.advanceTimersByTime(10);
    rerender({ value: 'next', updatable: false });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('initial');
    rerender({ value: 'third', updatable: true });
    expect(result.current).toBe('initial');
    jest.advanceTimersByTime(10);
    expect(result.current).toBe('initial');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('third');
  });
});
