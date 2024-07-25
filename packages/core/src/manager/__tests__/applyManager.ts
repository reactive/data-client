import { Article } from '__tests__/new';

import { createSet } from '../../controller/actions';
import Controller from '../../controller/Controller';
import { Dispatch, Middleware } from '../../middlewareTypes';
import { Manager } from '../../types';
import applyManager, {
  ReduxMiddleware,
  ReduxMiddlewareAPI,
} from '../applyManager';
import NetworkManager from '../NetworkManager';

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

it('applyManagers should console.warn() when no NetworkManager is provided', () => {
  const warnspy = jest
    .spyOn(global.console, 'warn')
    .mockImplementation(() => {});
  try {
    applyManager([], new Controller());
    expect(warnspy.mock.calls.length).toBe(2);
  } finally {
    warnspy.mockRestore();
  }
});
it('applyManagers should not console.warn() when NetworkManager is provided', () => {
  const warnspy = jest
    .spyOn(global.console, 'warn')
    .mockImplementation(() => {});
  try {
    applyManager([new NetworkManager()], new Controller());
    expect(warnspy.mock.calls.length).toBe(0);
  } finally {
    warnspy.mockRestore();
  }
});
it('applyManagers should handle legacy Manager.getMiddleware()', () => {
  let initCount = 0;
  let actionCount = 0;
  class MyManager implements Manager {
    getMiddleware = (): Middleware => ctrl => {
      initCount++;
      return next => action => {
        actionCount++;
        return next(action);
      };
    };

    cleanup() {}
  }
  const middlewares = applyManager(
    [new MyManager(), new NetworkManager()],
    new Controller(),
  );

  const rootDispatch = jest.fn((action: any) => {
    return Promise.resolve();
  });

  const dispatch = middlewareDispatch(middlewares, rootDispatch);

  expect(initCount).toBe(1);
  expect(actionCount).toBe(0);
  expect(rootDispatch.mock.calls.length).toBe(0);
  dispatch(
    createSet(Article, { args: [{ id: 1 }], value: { id: 1, title: 'hi' } }),
  );
  expect(initCount).toBe(1);
  expect(actionCount).toBe(1);
  expect(rootDispatch.mock.calls.length).toBe(1);
});

function middlewareDispatch(
  middlewares: ReduxMiddleware[],
  rootDispatch: Dispatch,
) {
  const middlewareAPI: ReduxMiddlewareAPI = {
    getState: () => ({}),
    dispatch: action => rootDispatch(action),
  };
  const comp = compose(
    middlewares.map(middleware => middleware(middlewareAPI)),
  );
  const dispatch = comp(rootDispatch);
  return dispatch;
}
const compose = (fns: ((...args: any) => any)[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);
