/* istanbul ignore file */
import createReducer from '@rest-hooks/core/state/createReducer';
import Controller from '@rest-hooks/core/controller/Controller';

/**
 * @deprecated use createReducer instead
 */
const reducer = createReducer(new Controller());

export default reducer;
