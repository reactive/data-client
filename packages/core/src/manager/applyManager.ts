import type Controller from '../controller/Controller.js';
import type { Reducer, Dispatch, ReducerState } from '../middlewareTypes.js';
import { Manager } from '../types.js';

export default function applyManager(
  managers: Manager[],
  controller: Controller,
): Middleware[] {
  return managers.map(manager => {
    const middleware = manager.getMiddleware();
    // TODO(breaking): remove this once controller prop is no longer supported
    return ({ dispatch, getState }) => {
      (controller as any).dispatch = dispatch;
      (controller as any).getState = getState;
      // this is needed for backwards compatibility as we added 'controller' prop previously
      const API = Object.create(controller, {
        controller: { value: controller },
      });
      // controller is a superset of the middleware API
      return middleware(API);
    };
  });
}

/* These should be compatible with redux */
export interface MiddlewareAPI<
  R extends Reducer<any, any> = Reducer<any, any>,
> {
  getState: () => ReducerState<R>;
  dispatch: Dispatch<R>;
}
export type Middleware = <R extends Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI<R>) => (next: Dispatch<R>) => Dispatch<R>;
