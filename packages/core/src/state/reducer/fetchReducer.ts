import createOptimistic from '../../controller/createOptimistic.js';
import type {
  State,
  ReceiveAction,
  OptimisticAction,
  FetchAction,
} from '../../types.js';

export function fetchReducer(state: State<unknown>, action: FetchAction) {
  let receiveAction: ReceiveAction | OptimisticAction;

  if (action.endpoint.getOptimisticResponse && action.endpoint.sideEffect) {
    receiveAction = createOptimistic(action.endpoint, {
      args: action.meta.args,
      fetchedAt: action.meta.createdAt,
    });
  } else {
    // If 'fetch' action reaches the reducer there are no middlewares installed to handle it
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Fetch appears unhandled - you are likely missing the NetworkManager middleware',
      );
      console.warn(
        'See https://resthooks.io/docs/guides/redux#indextsx for hooking up redux',
      );
    }

    return state;
  }
  return {
    ...state,
    optimistic: [...state.optimistic, receiveAction],
  };
}
