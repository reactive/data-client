import { render, waitFor } from '@testing-library/react';

import { renderHook, act } from '../../../../test';
import useLoading from '../useLoading';

describe('useLoading()', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('should not update until delay has passed', async () => {
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => resolve(value), 1000),
      );
    }
    let resolved = '';
    let wrongType = 0;
    const { result, waitForNextUpdate } = renderHook(() => {
      return useLoading(fun);
    });
    const wrappedFunc = result.current[0];
    expect(result.current[1]).toBe(false);
    act(() => {
      wrappedFunc('test string').then(value => {
        resolved = value;
        // @ts-expect-error
        wrongType = value;
      });
    });
    expect(result.current[1]).toBe(true);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current[1]).toBe(true);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    await waitForNextUpdate();
    expect(result.current[1]).toBe(false);
    expect(resolved).toBe('test string');
    // maintain referential equality
    expect(result.current[0]).toBe(wrappedFunc);
  });

  it('should work when resolution happens after unmount', async () => {
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => resolve(value), 1000),
      );
    }
    let resolved = '';
    let wrongType = 0;
    const { result, unmount } = renderHook(() => {
      return useLoading(fun);
    });
    const wrappedFunc = result.current[0];
    expect(result.current[1]).toBe(false);
    act(() => {
      wrappedFunc('test string').then(value => {
        resolved = value;
        // @ts-expect-error
        wrongType = value;
      });
    });
    expect(result.current[1]).toBe(true);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    act(() => {
      unmount();
    });
    act(() => {
      jest.advanceTimersByTime(600);
    });
    // since it's unmounted this won't change
    expect(result.current[1]).toBe(true);
  });

  it('should call error callback when rejected', async () => {
    const error = new Error('ack');
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => reject(error), 1000),
      ).catch(err => {
        rejectedError = err;
        throw err;
      });
    }
    let rejectedError: Error | null = null;
    const { result, waitForNextUpdate } = renderHook(() => {
      return useLoading(fun);
    });
    const wrappedFunc = result.current[0];
    expect(result.current[1]).toBe(false);
    act(() => {
      wrappedFunc('test string');
    });
    expect(result.current[1]).toBe(true);
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    await waitForNextUpdate();
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeDefined();
    expect(rejectedError).toBe(error);
    // maintain referential equality
    expect(result.current[0]).toBe(wrappedFunc);
  });

  it('should stop loading when error thrown', async () => {
    const error = new Error('ack');
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => reject(error), 1000),
      ).catch(err => {
        rejectedError = err;
        throw err;
      });
    }
    let rejectedError: Error | null = null;
    const { result, waitForNextUpdate } = renderHook(() => {
      return useLoading(fun);
    });
    const wrappedFunc = result.current[0];
    expect(result.current[1]).toBe(false);
    act(() => {
      wrappedFunc('test string');
    });
    expect(result.current[1]).toBe(true);
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    await waitForNextUpdate();
    expect(result.current[1]).toBe(false);
    expect(rejectedError).toBe(error);
    expect(result.current[2]).toBeDefined();
    expect(result.current[2]).toBe(error);
    // maintain referential equality
    expect(result.current[0]).toBe(wrappedFunc);
  });

  it('should clear error on the next call', async () => {
    const error = new Error('ack');
    let shouldReject = true;
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => (shouldReject ? reject(error) : resolve(value)), 1000),
      );
    }
    const { result, waitForNextUpdate } = renderHook(() => {
      return useLoading(fun);
    });
    act(() => {
      result.current[0]('first');
    });
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    await waitForNextUpdate();
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBe(error);

    shouldReject = false;
    let resolved = '';
    act(() => {
      result.current[0]('second').then(value => {
        resolved = value;
      });
    });
    // cleared as soon as the next call starts
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeUndefined();
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    await waitForNextUpdate();
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeUndefined();
    expect(resolved).toBe('second');
  });

  it('should follow the latest call when calls overlap', async () => {
    const error = new Error('ack');
    const settle: Record<string, () => void> = {};
    function fun(value: string) {
      return new Promise<string>((resolve, reject) => {
        settle[value] = () =>
          value === 'fail' ? reject(error) : resolve(value);
      });
    }
    const { result } = renderHook(() => useLoading(fun));
    let first: Promise<string>, second: Promise<string>;
    act(() => {
      first = result.current[0]('fail');
    });
    act(() => {
      second = result.current[0]('ok');
    });
    // latest call resolves first
    await act(async () => {
      settle.ok();
      await second;
    });
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeUndefined();
    // earlier call rejects afterwards: ignored
    await act(async () => {
      settle.fail();
      await first;
    });
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeUndefined();

    // earlier call settling first keeps loading for the latest call
    act(() => {
      first = result.current[0]('a');
    });
    act(() => {
      second = result.current[0]('b');
    });
    await act(async () => {
      settle.a();
      await first;
    });
    expect(result.current[1]).toBe(true);
    await act(async () => {
      settle.b();
      await second;
    });
    expect(result.current[1]).toBe(false);
  });

  it('should work in strictmode', async () => {
    const error = new Error('ack');
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => reject(error), 1000),
      ).catch(err => {
        rejectedError = err;
        throw err;
      });
    }
    let rejectedError: Error | null = null;
    let wrappedFunc: (value: string) => Promise<string>;
    const Data = () => {
      let loading: boolean;
      [wrappedFunc, loading] = useLoading(fun);
      return <div>{loading ? 'loading' : 'loaded'}</div>;
    };
    const tree = <Data />;
    const { getByText } = render(tree);
    expect(getByText(/loaded/i)).toBeDefined();
    act(() => {
      wrappedFunc('test string');
    });
    expect(getByText(/loading/i)).toBeDefined();
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => expect(getByText(/loaded/i)).toBeDefined());
  });

  it('should maintain referential equality if function does', async () => {
    function fun(value: string) {
      return new Promise<string>((resolve, reject) =>
        setTimeout(() => resolve(value), 1000),
      );
    }
    const { result, rerender } = renderHook(() => {
      return useLoading(fun);
    });
    const [cb] = result.current;
    rerender();
    expect(result.current[0]).toBe(cb);
  });

  it('should maintain referential equality based on deps', async () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => {
        return useLoading(() => {
          return new Promise<string>((resolve, reject) =>
            setTimeout(() => resolve(value), 1000),
          );
        }, [value]);
      },
      { initialProps: { value: 'a' } },
    );
    const [cb] = result.current;
    rerender({ value: 'a' });
    expect(result.current[0]).toBe(cb);
    rerender({ value: 'b' });
    expect(result.current[0]).not.toBe(cb);
  });
});
