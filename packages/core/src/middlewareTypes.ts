import type Controller from './controller/Controller.js';
import { ActionTypes, State } from './types.js';

type RHDispatch<Actions = any> = (value: Actions) => Promise<void>;

export interface MiddlewareAPI<R extends RestHooksReducer = RestHooksReducer>
  extends Controller<RHDispatch<ActionTypes>> {
  /** @deprecated use members directly instead */
  controller: Controller<RHDispatch<ActionTypes>>;
}
export interface MiddlewareController<Actions = ActionTypes>
  extends Controller<RHDispatch<Actions>> {
  controller: Controller<RHDispatch<Actions>>;
}

export type Middleware<Actions = any> = <
  C extends MiddlewareController<Actions>,
>(
  controller: C,
) => (next: C['dispatch']) => C['dispatch'];

export type RestHooksReducer = (
  prevState: State<unknown>,
  action: ActionTypes,
) => State<unknown>;

/* The next are types from React; but we don't want dependencies on it */
export type Dispatch<R extends Reducer<any, any>> = (
  action: ReducerAction<R>,
) => Promise<void>;

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
