import NetworkManager from './NetworkManager.js';
import type Controller from '../controller/Controller.js';
import { Manager } from '../types.js';

export default function applyManager(
  managers: Manager[],
  controller: Controller,
): ReduxMiddleware[] {
  /* istanbul ignore next */
  if (
    process.env.NODE_ENV !== 'production' &&
    !managers.find(mgr => mgr instanceof NetworkManager)
  ) {
    console.warn('NetworkManager not found; this is a required manager.');
    console.warn(
      'See https://dataclient.io/docs/guides/redux for hooking up redux',
    );
  }
  return managers.map((manager, i) => {
    if (!manager.middleware) manager.middleware = manager.getMiddleware?.();
    return (api: ReduxMiddlewareAPI) => {
      if (i === 0) {
        controller.bindMiddleware(api);
      }
      // controller is a superset of the middleware API
      return (manager as Manager & { middleware: ReduxMiddleware }).middleware(
        controller as any,
      );
    };
  });
}

/* These should be compatible with redux */
export interface ReduxMiddlewareAPI<
  R extends Reducer<any, any> = Reducer<any, any>,
> {
  getState: () => ReducerState<R>;
  dispatch: ReactDispatch<R>;
}
export type ReduxMiddleware = <R extends Reducer<any, any>>({
  dispatch,
}: ReduxMiddlewareAPI<R>) => (next: ReactDispatch<R>) => ReactDispatch<R>;

/* The next are types from React; but we don't want dependencies on it */
export type ReactDispatch<R extends Reducer<any, any>> = (
  action: ReducerAction<R>,
) => Promise<void>;

export type Reducer<S, A> = (prevState: S, action: A) => S;
export type ReducerState<R extends Reducer<any, any>> =
  R extends Reducer<infer S, any> ? S : never;
export type ReducerAction<R extends Reducer<any, any>> =
  R extends Reducer<any, infer A> ? A : never;
