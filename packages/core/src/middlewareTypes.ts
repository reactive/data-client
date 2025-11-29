import type Controller from './controller/Controller.js';
import type { ActionTypes, State } from './types.js';

export type Dispatch<Actions = ActionTypes> = (value: Actions) => Promise<void>;

export interface MiddlewareAPI extends Controller<Dispatch<ActionTypes>> {}

export interface MiddlewareController<Actions = ActionTypes> extends Controller<
  Dispatch<Actions>
> {}

/** @see https://dataclient.io/docs/api/Manager#middleware */
export type Middleware<Actions = ActionTypes> = <
  C extends MiddlewareController<Actions>,
>(
  controller: C,
) => (next: C['dispatch']) => C['dispatch'];

export type DataClientReducer = (
  prevState: State<unknown>,
  action: ActionTypes,
) => State<unknown>;
