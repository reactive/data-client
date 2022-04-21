/* istanbul ignore file */
import createReducer from './createReducer.js';
import Controller from '../controller/Controller.js';

/**
 * @deprecated use createReducer instead
 */
const reducer = createReducer(new Controller());

export default reducer;
