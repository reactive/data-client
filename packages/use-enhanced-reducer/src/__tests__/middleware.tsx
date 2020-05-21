import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

import useEnhancedReducer from '../useEnhancedReducer';
import { MiddlewareAPI } from '../types';

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

describe('createEnhancedReducerHook', () => {
  const makeTestActionMiddleware = (test: Function) => () => {
    return (next: any) => (action: any) => {
      test(action);
      return next(action);
    };
  };
  const makeTestMiddleware = (spy: Function) => (methods: MiddlewareAPI) => {
    spy(methods);
    return (next: any) => (action: any) => next(action);
  };
  const dispatchingMiddleware = ({ dispatch }: MiddlewareAPI) => {
    return (next: any) => (action: any) => {
      if (action.type === 'dispatch') {
        dispatch({ ...action, type: 'nothing' });
      }
      return next(action);
    };
  };
  const makeStatefulMiddleware = ({
    callBefore,
    callAfter,
  }: {
    callBefore: Function;
    callAfter: Function;
  }) => ({ getState }: MiddlewareAPI) => {
    return (next: any) => async (action: any) => {
      callBefore(getState());
      await next(action);
      callAfter(getState());
    };
  };

  test('runs through zero middlewares', () => {
    const { result } = renderHook(() => {
      return useEnhancedReducer(state => state, {}, []);
    });
    const [state, dispatch] = result.current;

    const action = { type: 5 };
    act(() => {
      dispatch(action);
    });
    act(() => {
      dispatch(action);
    });
  });

  test('runs through a single middleware', () => {
    const faker = jest.fn();
    const logger = makeTestActionMiddleware(faker);
    const { result } = renderHook(() => {
      return useEnhancedReducer(state => state, {}, [logger]);
    });
    const [state, dispatch] = result.current;

    expect(faker.mock.calls.length).toBe(0);
    const action = { type: 5 };
    act(() => {
      dispatch(action);
    });
    expect(faker.mock.calls.length).toBe(1);
    expect(faker.mock.calls[0][0]).toBe(action);
    act(() => {
      dispatch(action);
    });
    expect(faker.mock.calls.length).toBe(2);
  });

  it('wraps dispatch method with middleware once', () => {
    const [faker, statefaker] = [jest.fn(), jest.fn()];
    const methodspy = makeTestMiddleware(faker);
    const statespy = makeTestMiddleware(({ getState }: MiddlewareAPI) =>
      statefaker(getState()),
    );

    const { result } = renderHook(() => {
      return useEnhancedReducer(state => state, { double: 5 }, [
        methodspy,
        statespy,
      ]);
    });
    const [state, dispatch] = result.current;

    const action = { type: 5 };
    act(() => {
      dispatch(action);
      dispatch(action);
    });

    expect(faker.mock.calls.length).toEqual(1);

    expect(faker.mock.calls[0][0]).toHaveProperty('getState');
    expect(faker.mock.calls[0][0]).toHaveProperty('dispatch');

    expect(statefaker.mock.calls[0][0]).toEqual({ double: 5 });
  });

  test('reducer to work properly', () => {
    const logger = makeTestActionMiddleware(() => {});

    const { result } = renderHook(() => {
      return useEnhancedReducer(
        (state, action) => ({ ...state, omlet: action.payload }),
        { eggs: 'bacon' },
        [logger],
      );
    });
    let [state, dispatch] = result.current;
    act(() => {
      dispatch({ payload: 5 });
    });
    [state, dispatch] = result.current;
    expect(state).toEqual({
      eggs: 'bacon',
      omlet: 5,
    });
    act(() => {
      dispatch({ payload: 'chicken' });
    });
    [state, dispatch] = result.current;
    expect(state).toEqual({
      eggs: 'bacon',
      omlet: 'chicken',
    });
  });

  test('should work with middlewares that call dispatch', () => {
    const faker = jest.fn();
    const logger = makeTestActionMiddleware(faker);

    const { result } = renderHook(() => {
      return useEnhancedReducer(state => state, {}, [
        logger,
        dispatchingMiddleware,
      ]);
    });
    const [state, dispatch] = result.current;
    expect(faker.mock.calls.length).toBe(0);
    let action: any = { type: 'hi' };
    act(() => {
      dispatch(action);
    });
    expect(faker.mock.calls.length).toBe(1);
    expect(faker.mock.calls[0][0]).toBe(action);
    action = { type: 'dispatch', payload: 5 };
    act(() => {
      dispatch(action);
    });
    expect(faker.mock.calls.length).toBe(3);
    expect(faker.mock.calls[2][0]).toEqual({ type: 'nothing', payload: 5 });
  });

  test('should work with middlewares that getState()', async () => {
    const callBefore = jest.fn();
    const callAfter = jest.fn();
    const logger = makeStatefulMiddleware({ callBefore, callAfter });

    const reducer = (state: { counter: number }) => ({
      ...state,
      counter: state.counter + 1,
    });
    const { result } = renderHook(() => {
      return useEnhancedReducer(reducer, { counter: 0 }, [logger]);
    });
    let [state, dispatch] = result.current;
    expect(callBefore.mock.calls.length).toBe(0);
    let action: any = { type: 'hi' };
    await act(() => {
      return dispatch(action);
    });
    [state, dispatch] = result.current;
    expect(callBefore.mock.calls.length).toBe(1);
    expect(callAfter.mock.calls.length).toBe(1);
    expect(callBefore.mock.calls[0][0]).toEqual({ counter: 0 });
    expect(callAfter.mock.calls[0][0]).toEqual({ counter: 1 });
    expect(callAfter.mock.calls[0][0]).toEqual(state);
    action = { type: 'dispatch', payload: 5 };
    await act(() => {
      return dispatch(action);
    });
    expect(callBefore.mock.calls.length).toBe(2);
    expect(callAfter.mock.calls.length).toBe(2);
    expect(callBefore.mock.calls[1][0]).toEqual({ counter: 1 });
    expect(callAfter.mock.calls[1][0]).toEqual({ counter: 2 });
  });

  it('warns when dispatching during middleware setup', () => {
    function dispatchingMiddleware({ dispatch }: { dispatch: Function }) {
      dispatch({ type: 'dispatch', payload: 5 });
      return (next: Function) => (action: any) => next(action);
    }
    const { result } = renderHook(() => {
      useEnhancedReducer(state => state, {}, [dispatchingMiddleware]);
    });
    expect(result.error).toBeDefined();
    expect(result.error.message).toMatchSnapshot();
  });
});
