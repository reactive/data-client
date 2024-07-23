import type Controller from './controller/Controller.js';
import type { ActionTypes, State } from './types.js';

type ClientDispatch<Actions = ActionTypes> = (value: Actions) => Promise<void>;

export interface MiddlewareAPI
  extends Controller<ClientDispatch<ActionTypes>> {}

export interface MiddlewareController<Actions = ActionTypes>
  extends Controller<ClientDispatch<Actions>> {}

/** @see https://dataclient.io/docs/api/Manager#getmiddleware */
export type Middleware<Actions = ActionTypes> = <
  C extends MiddlewareController<Actions>,
>(
  controller: C,
) => (next: C['dispatch']) => C['dispatch'];

export type DataClientReducer = (
  prevState: State<unknown>,
  action: ActionTypes,
) => State<unknown>;

/* The next are types from React; but we don't want dependencies on it */
export type Dispatch<R extends Reducer<any, any>> = (
  action: ReducerAction<R>,
) => Promise<void>;

export type Reducer<S, A> = (prevState: S, action: A) => S;
export type ReducerState<R extends Reducer<any, any>> =
  R extends Reducer<infer S, any> ? S : never;
export type ReducerAction<R extends Reducer<any, any>> =
  R extends Reducer<any, infer A> ? A : never;
