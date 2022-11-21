import type Controller from './controller/Controller.js';
//import type { ActionTypes as LegacyActionTypes } from './legacyActions.js';
import type { ActionTypes } from './newActions.js';
import {
  ActionTypes as LegacyActionTypes,
  CombinedActionTypes,
  State,
} from './types.js';

type RHDispatch<Actions = any> = (value: Actions) => Promise<void>;

export interface MiddlewareAPI<R extends RestHooksReducer = RestHooksReducer>
  extends Controller<RHDispatch<CombinedActionTypes>> {
  controller: Controller<RHDispatch<CombinedActionTypes>>;
}
export interface MiddlewareController<Actions = LegacyActionTypes>
  extends Controller<RHDispatch<Actions>> {
  controller: Controller<RHDispatch<Actions>>;
}

export type Middleware<Actions = any> = <
  A extends MiddlewareController<Actions>,
>(
  controller: A,
) => (next: A['dispatch']) => A['dispatch'];

export type RestHooksReducer = React.Reducer<State<unknown>, ActionTypes>;

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
