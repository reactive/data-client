/* istanbul ignore file */
import Controller from '../controller/Controller.js';
import { ActionTypes, State } from '../types.js';
import createReducer from './createReducer.js';

/**
 * @deprecated use createReducer instead
 */
const reducer: (
  state: State<unknown> | undefined,
  action: ActionTypes,
) => State<unknown> = createReducer(new Controller());

export default reducer;
