import sinon from 'sinon';
import createEnhancedReducerHook from '../middleware';
import { testHook, act, cleanup } from 'react-testing-library';

afterEach(cleanup);

describe('createEnhancedReducerHook', () => {
  let logger: any;
  let faker: any;
  let dispatchingMiddleware: any;

  beforeEach(() => {
    faker = sinon.spy();
    logger = ({}) => {
      return (next: any) => (action: any) => {
        faker(action);
        const returnValue = next(action);
        return returnValue;
      };
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

  test('reducer to work properly', () => {
    let state, dispatch: Function;
    testHook(() => {
      const useEnhancedReducer = createEnhancedReducerHook(logger);
      [state, dispatch] = useEnhancedReducer(
        (state, action) => ({ ...state, omlet: action.payload }),
        { eggs: 'bacon' }
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
        dispatchingMiddleware
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
});
