import createOptimistic from '../../controller/createOptimistic.js';
import type {
  State,
  SetResponseAction,
  OptimisticAction,
  FetchAction,
} from '../../types.js';

export function fetchReducer(state: State<unknown>, action: FetchAction) {
  let setAction: SetResponseAction | OptimisticAction;

  if (action.endpoint.getOptimisticResponse && action.endpoint.sideEffect) {
    setAction = createOptimistic(action.endpoint, action.meta);
  } else {
    // If 'fetch' action reaches the reducer there are no middlewares installed to handle it
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Fetch appears unhandled - you are likely missing the NetworkManager middleware',
      );
      console.warn(
        'See https://dataclient.io/docs/guides/redux#indextsx for hooking up redux',
      );
    }

    return state;
  }
  return {
    ...state,
    optimistic: [...state.optimistic, setAction],
  };
}
