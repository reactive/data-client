import { createOptimistic } from '../../controller/actions/createOptimistic.js';
import type { State, FetchAction } from '../../types.js';

export function fetchReducer(state: State<unknown>, action: FetchAction) {
  if (action.endpoint.getOptimisticResponse && action.endpoint.sideEffect) {
    const setAction = createOptimistic(
      action.endpoint,
      action.args,
      action.meta.fetchedAt,
    );
    return {
      ...state,
      optimistic: [...state.optimistic, setAction],
    };
  }
  return state;
}
