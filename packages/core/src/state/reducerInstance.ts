/* istanbul ignore file */
import createReducer from './createReducer.js';
import Controller from '../controller/Controller.js';
import { ActionTypes, State } from '../types.js';

/**
 * @deprecated use createReducer instead
 */
const reducer: (
  state: State<unknown> | undefined,
  action: ActionTypes,
) => State<unknown> = createReducer(new Controller());

export default reducer;
