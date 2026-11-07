import { createOptimistic } from '../../controller/actions/createOptimistic.js';
import type { State, FetchAction, OptimisticAction } from '../../types.js';

/** One optimistic action per fetch, so reducing the same fetch again (React StrictMode
 * re-runs reducers; DevToolsManager keeps its own state) yields the same action object
 */
const optimisticByFetch = new WeakMap<FetchAction, OptimisticAction>();

export function fetchReducer(state: State<unknown>, action: FetchAction) {
  if (action.endpoint.getOptimisticResponse && action.endpoint.sideEffect) {
    let setAction = optimisticByFetch.get(action);
    if (!setAction) {
      setAction = createOptimistic(
        action.endpoint,
        action.args,
        action.meta.fetchedAt,
      );
      optimisticByFetch.set(action, setAction);
    }
    return {
      ...state,
      optimistic: [...state.optimistic, setAction],
    };
  }
  return state;
}
