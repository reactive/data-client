import type { Reducer, Dispatch, ReducerState } from '../middlewareTypes.js';
import { Manager } from '../types.js';
import type Controller from '../controller/Controller.js';

export default function applyManager(
  managers: Manager[],
  controller: Controller,
): Middleware[] {
  return managers.map(manager => {
    const middleware = manager.getMiddleware();
    return ({ dispatch, getState }) => {
      (controller as any).dispatch = dispatch;
      return middleware({ controller, dispatch, getState });
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
