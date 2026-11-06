import NetworkManager from './NetworkManager.js';
import type Controller from '../controller/Controller.js';
import { Manager } from '../types.js';

/** Development only: the store each Manager instance last started (`init()` ran) with */
export const startedWith = new WeakMap<Manager, Controller>();
let warnedShared = false;

/** A Manager instance bound to a new store after it started with another is shared by both */
function warnIfShared(manager: Manager, controller: Controller) {
  const started = startedWith.get(manager);
  if (started === undefined || started === controller || warnedShared) return;
  warnedShared = true;
  console.warn(
    `${manager.constructor.name} is used by more than one store, so state about the first store leaks into the next one.
Pass managers as a function, so each store gets new instances: managers={() => [...getDefaultManagers(), new MyManager()]}
See https://dataclient.io/docs/api/Manager#lifetimes`,
  );
}

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
    if (process.env.NODE_ENV !== 'production' && !manager.middleware) {
      throw new Error(
        `${manager.constructor.name} has no middleware. Managers must define middleware: https://dataclient.io/docs/api/Manager#middleware`,
      );
    }
    return (api: ReduxMiddlewareAPI) => {
      if (i === 0) {
        controller.bindMiddleware(api);
      }
      if (process.env.NODE_ENV !== 'production')
        warnIfShared(manager, controller);
      // controller is a superset of the middleware API
      return manager.middleware(controller as any);
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
