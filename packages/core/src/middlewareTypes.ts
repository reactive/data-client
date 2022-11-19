import type Controller from './controller/Controller.js';
import { ActionTypes, State } from './types.js';

export interface MiddlewareAPI<
  R extends Reducer<State<unknown>, ActionTypes> = Reducer<
    State<unknown>,
    ActionTypes
  >,
> extends Controller {
  controller: Controller;
}

export type Dispatch<R extends Reducer<any, any>> = (
  action: ReducerAction<R>,
) => Promise<void>;

export type Middleware = <R extends RestHooksReducer>(
  controller: MiddlewareAPI<R>,
) => (next: Dispatch<R>) => Dispatch<R>;

export type RestHooksReducer = React.Reducer<State<unknown>, ActionTypes>;

/* The next are types from React; but we don't want dependencies on it */
export type Reducer<S, A> = (prevState: S, action: A) => S;
export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<
  infer S,
  any
>
  ? S
  : never;
export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<
  any,
  infer A
>
  ? A
  : never;
