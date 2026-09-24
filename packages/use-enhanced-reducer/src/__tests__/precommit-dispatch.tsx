import { useRef } from 'react';

import { renderHook, act } from '../../../test';
import { MiddlewareAPI } from '../types';
import useEnhancedReducer from '../useEnhancedReducer';

describe('useEnhancedReducer pre-commit dispatch', () => {
  function ignoreError(e: Event) {
    e.preventDefault();
  }
  beforeEach(() => {
    if (typeof addEventListener === 'function')
      addEventListener('error', ignoreError);
  });
  afterEach(() => {
    if (typeof removeEventListener === 'function')
      removeEventListener('error', ignoreError);
  });

  test('replays actions from the first render in order after commit', async () => {
    const reduced: string[] = [];
    const resolvedWith: string[][] = [];
    const reducer = (state: string[], action: { type: string }) => {
      reduced.push(action.type);
      return [...state, action.type];
    };

    const { result } = renderHook(() => {
      const started = useRef(false);
      const tuple = useEnhancedReducer(reducer, [] as string[], []);
      if (!started.current) {
        started.current = true;
        const first = tuple[1]({ type: 'a' });
        const second = tuple[1]({ type: 'b' });
        expect(second).toBe(first);
        void first.then(() => {
          resolvedWith.push(tuple[2]());
        });
      }
      return tuple;
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(reduced).toEqual(['a', 'b']);
    expect(result.current[0]).toEqual(['a', 'b']);
    expect(resolvedWith).toEqual([['a', 'b']]);
  });

  test('resolves the dispatch promise only after the replayed state commits', async () => {
    const log: string[] = [];
    const reducer = (state: number, action: { type: string }) => {
      log.push(`reduce:${action.type}`);
      return state + 1;
    };

    const { result } = renderHook(() => {
      const started = useRef(false);
      const [state, dispatch, getState] = useEnhancedReducer(reducer, 0, []);
      if (!started.current) {
        started.current = true;
        void dispatch({ type: 'inc' }).then(() => {
          log.push(`resolved:${getState()}`);
        });
      }
      return state;
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe(1);
    expect(log).toEqual(['reduce:inc', 'resolved:1']);
  });

  test('ignores dispatch after unmount', async () => {
    const info = jest
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);
    const reducer = jest.fn((state: number) => state + 1);
    let injected: MiddlewareAPI['dispatch'] = () => Promise.resolve();
    const capturing = ({ dispatch }: MiddlewareAPI) => {
      injected = dispatch;
      return (next: (action: any) => any) => (action: any) => next(action);
    };
    try {
      const { unmount } = renderHook(() =>
        useEnhancedReducer(reducer, 0, [capturing]),
      );
      unmount();
      let resolved = false;
      await act(async () => {
        await injected({ type: 'late' }).then(() => {
          resolved = true;
        });
      });
      expect(resolved).toBe(true);
      expect(reducer).not.toHaveBeenCalled();
      expect(info).toHaveBeenCalledWith(
        'Action dispatched after unmount. This will be ignored.',
      );
    } finally {
      info.mockRestore();
    }
  });
});
