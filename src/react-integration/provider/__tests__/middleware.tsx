import React from 'react';
import createEnhancedReducerHook from '../middleware';
import { MiddlewareAPI } from '../../../types';

import { testHook, act, cleanup } from 'react-testing-library';

function ignoreError(e: Event) {
  e.preventDefault();
}
beforeEach(() => {
  window.addEventListener('error', ignoreError);
});
afterEach(() => {
  window.removeEventListener('error', ignoreError);
});
afterEach(cleanup);

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

  test('runs through a single middleware', () => {
    const faker = jest.fn();
    const logger = makeTestActionMiddleware(faker);
    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(logger);
      [state, dispatch] = useEnhancedReducer(state => state, {});
    });

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

    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(methodspy, statespy);
      [state, dispatch] = useEnhancedReducer(state => state, { double: 5 });
    });

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

    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(logger);
      [state, dispatch] = useEnhancedReducer(
        (state, action) => ({ ...state, omlet: action.payload }),
        { eggs: 'bacon' },
      );
    });
    act(() => {
      dispatch({ payload: 5 });
    });
    expect(state).toEqual({
      eggs: 'bacon',
      omlet: 5,
    });
    act(() => {
      dispatch({ payload: 'chicken' });
    });
    expect(state).toEqual({
      eggs: 'bacon',
      omlet: 'chicken',
    });
  });

  test('should work with middlewares that call dispatch', () => {
    const faker = jest.fn();
    const logger = makeTestActionMiddleware(faker);

    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(
        logger,
        dispatchingMiddleware,
      );
      [state, dispatch] = useEnhancedReducer(state => state, {});
    });
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

  it('warns when dispatching during middleware setup', () => {
    function dispatchingMiddleware({ dispatch }: { dispatch: Function }) {
      dispatch({ type: 'dispatch', payload: 5 });
      return (next: Function) => (action: any) => next(action);
    }
    const test: { error: any } = { error: {} };
    class ErrorBoundary extends React.Component {
      state = { found: false };
      componentDidCatch(error: any) {
        test.error = error;
      }
      static getDerivedStateFromError() {
        return {
          found: true,
        };
      }
      render() {
        if (this.state.found) return null;
        return this.props.children;
      }
    }
    testHook(
      () => {
        createEnhancedReducerHook(dispatchingMiddleware)(state => state, {});
      },
      { wrapper: ({ children }) => <ErrorBoundary>{children}</ErrorBoundary> },
    );
    expect(test.error).toBeDefined();
    expect(test.error.message).toMatchSnapshot();
  });
});
