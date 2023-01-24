import createOptimistic from '../../controller/createOptimistic.js';
import type {
  ReceiveAction,
  OptimisticAction,
  FetchAction,
} from '../../previousActions.js';
import type { State } from '../../types.js';
import { createReceive as legacyCreateReceive } from '../legacy-actions/index.js';

export function fetchReducer(state: State<unknown>, action: FetchAction) {
  const optimisticResponse = action.meta.optimisticResponse;
  const getOptimisticResponse = action.endpoint?.getOptimisticResponse;
  let receiveAction: ReceiveAction | OptimisticAction;

  if (getOptimisticResponse && action.endpoint) {
    receiveAction = createOptimistic(action.endpoint, {
      args: action.meta.args as readonly any[],
      fetchedAt:
        typeof action.meta.createdAt !== 'number'
          ? action.meta.createdAt.getTime()
          : action.meta.createdAt,
    }) as any;
  } /* istanbul ignore if */ else if (optimisticResponse) {
    // TODO(breaking): this is no longer used, remove this branch
    /* istanbul ignore next */
    receiveAction = legacyCreateReceive(optimisticResponse, {
      ...action.meta,
      dataExpiryLength: Infinity,
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
