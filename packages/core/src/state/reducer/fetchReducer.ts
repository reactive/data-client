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
  } else {
    // If 'fetch' action reaches the reducer there are no middlewares installed to handle it
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Fetch appears unhandled - you are likely missing the NetworkManager middleware',
      );
      console.warn(
        'See https://dataclient.io/docs/guides/redux for hooking up redux',
      );
    }

    return state;
  }
}
