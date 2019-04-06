import sinon from 'sinon';
import React from 'react';
import createEnhancedReducerHook from '../middleware';
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
  let logger: any;
  let faker: sinon.SinonSpy;
  let statefaker: sinon.SinonSpy;
  let methodspy: any;
  let statespy: any;
  let dispatchingMiddleware: any;

  beforeEach(() => {
    faker = sinon.spy();
    statefaker = sinon.spy();
    logger = ({}) => {
      return (next: any) => (action: any) => {
        faker(action);
        const returnValue = next(action);
        return returnValue;
      };
    };
    methodspy = (methods: any) => {
      faker(methods);
      return (next: any) => (action: any) => next(action);
    };
    statespy = (methods: any) => {
      statefaker(methods.getState());
      return (next: any) => (action: any) => next(action);
    };
    dispatchingMiddleware = ({ dispatch }: { dispatch: Function }) => {
      return (next: any) => (action: any) => {
        if (action.type === 'dispatch') {
          dispatch({ ...action, type: 'nothing' });
        }
        return next(action);
      };
    };
  });

  test('runs through a single middleware', () => {
    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(logger);
      [state, dispatch] = useEnhancedReducer(state => state, {});
    });

    expect(faker.called).toBeFalsy();
    const action = { type: 5 };
    act(() => {
      dispatch(action);
    });
    expect(faker.calledOnce).toBeTruthy();
    expect(faker.calledWith(action)).toBeTruthy();
    act(() => {
      dispatch(action);
    });
    expect(faker.callCount).toBe(2);
  });

  it('wraps dispatch method with middleware once', () => {
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

    expect(faker.getCalls().length).toEqual(1);

    expect(faker.getCalls()[0].args[0]).toHaveProperty('getState');
    expect(faker.getCalls()[0].args[0]).toHaveProperty('dispatch');

    expect(statefaker.getCalls()[0].args[0]).toEqual({ double: 5 });
  });

  test('reducer to work properly', () => {
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
    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(
        logger,
        dispatchingMiddleware,
      );
      [state, dispatch] = useEnhancedReducer(state => state, {});
    });
    expect(faker.called).toBeFalsy();
    let action: any = { type: 'hi' };
    act(() => {
      dispatch(action);
    });
    expect(faker.calledOnce).toBeTruthy();
    expect(faker.calledWith(action)).toBeTruthy();
    action = { type: 'dispatch', payload: 5 };
    act(() => {
      dispatch(action);
    });
    expect(faker.callCount).toBe(3);
    expect(faker.thirdCall.calledWith({ type: 'nothing', payload: 5 }));
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
