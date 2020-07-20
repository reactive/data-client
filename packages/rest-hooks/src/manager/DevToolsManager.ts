import {
  MiddlewareAPI,
  Middleware,
  Dispatch,
  Manager,
  State,
} from '@rest-hooks/core';

/** Integrates with https://github.com/zalmoxisus/redux-devtools-extension
 *
 * Options: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
 */
export default class DevToolsManager implements Manager {
  protected declare middleware: Middleware;
  protected declare devTools: undefined | any;

  constructor(config: any = {}) {
    this.devTools =
      process.env.NODE_ENV !== 'production' &&
      typeof window !== 'undefined' &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect(config);

    if (this.devTools) {
      this.middleware = <R extends React.Reducer<any, any>>({
        getState,
      }: MiddlewareAPI<R>) => {
        return (next: Dispatch<R>) => (action: React.ReducerAction<R>) => {
          return next(action).then(() => {
            this.devTools.send(action, getState(), {}, 'REST_HOOKS');
          });
        };
      };
    } else {
      this.middleware = () => next => action => next(action);
    }
  }

  /** Called when initial state is ready */
  init(state: State<any>) {
    if (this.devTools) this.devTools.init(state);
  }

  /** Ensures all subscriptions are cleaned up. */
  cleanup() {}

  /** Attaches Manager to store
   *
   */
  getMiddleware<T extends DevToolsManager>(this: T) {
    return this.middleware;
  }
}
