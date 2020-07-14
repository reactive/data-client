import { normalize } from '@rest-hooks/normalizr';
import { ActionTypes, State, ReceiveAction } from '@rest-hooks/core/types';
import { createReceive } from '@rest-hooks/core/state/actions';
import {
  RECEIVE_TYPE,
  INVALIDATE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
} from '@rest-hooks/core/actionTypes';

import applyUpdatersToResults from './applyUpdatersToResults';
import mergeDeepCopy from './merge/mergeDeepCopy';

export const initialState: State<unknown> = {
  entities: {},
  indexes: {},
  results: {},
  meta: {},
  optimistic: [],
};

export default function reducer(
  state: State<unknown> | undefined,
  action: ActionTypes,
): State<unknown> {
  if (!state) state = initialState;
  switch (action.type) {
    case FETCH_TYPE: {
      const optimisticResponse = action.meta.optimisticResponse;
      if (optimisticResponse === undefined) {
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
        optimistic: [
          ...state.optimistic,
          createReceive(optimisticResponse, {
            ...action,
            endpoint: {
              ...action.endpoint,

              dataExpiryLength: 9999999999999,
            },
          }),
        ],
      };
    }
    case RECEIVE_TYPE: {
      if (action.error) {
        return reduceError(state, action, action.payload);
      }
      try {
        const { result, entities, indexes } = normalize(
          action.payload,
          action.meta.schema,
        );
        let results = {
          ...state.results,
          [action.meta.key]: result,
        };
        results = applyUpdatersToResults(results, result, action.meta.updaters);
        return {
          entities: mergeDeepCopy(state.entities, entities),
          indexes: mergeDeepCopy(state.indexes, indexes),
          results,
          meta: {
            ...state.meta,
            [action.meta.key]: {
              date: action.meta.date,
              expiresAt: action.meta.expiresAt,
              prevExpiresAt: state.meta[action.meta.key]?.expiresAt,
            },
          },
          optimistic: filterOptimistic(state, action),
        };
        // reducer must update the state, so in case of processing errors we simply compute the results inline
      } catch (error) {
        error.message = `Error processing ${
          action.meta.key
        }\n\nFull Schema: ${JSON.stringify(
          action.meta.schema,
          undefined,
          2,
        )}\n\nError:\n${error.message}`;
        error.payload = action.payload;
        error.status = 400;
        return reduceError(state, action, error);
      }
    }
    case 'rest-hook/mounted': {
      if (!state.meta || !(action.payload in state.meta)) return state;
      return {
        ...state,
        meta: {
          ...state.meta,
          [action.payload]: {
            ...state.meta[action.payload],
            prevExpiresAt: undefined,
          },
        },
      };
    }
    case INVALIDATE_TYPE: {
      const results = { ...state.results };
      delete results[action.meta.key];
      return {
        ...state,
        results,
        meta: {
          ...state.meta,
          [action.meta.key]: {
            ...state.meta[action.meta.key],
            expiresAt: 0,
            invalidated: true,
          },
        },
      };
    }
    case RESET_TYPE:
      return initialState;

    default:
      // A reducer must always return a valid state.
      // Alternatively you can throw an error if an invalid action is dispatched.
      return state;
  }
}

type Writable<T> = { [P in keyof T]: NonNullable<Writable<T[P]>> };

function reduceError(
  state: State<unknown>,
  action: ReceiveAction,
  error: any,
): State<unknown> {
  return {
    ...state,
    meta: {
      ...state.meta,
      [action.meta.key]: {
        date: action.meta.date,
        error,
        expiresAt: action.meta.expiresAt,
      },
    },
    optimistic: filterOptimistic(state, action),
  };
}

/** Filter all requests with same serialization that did not start after the resolving request */
function filterOptimistic(
  state: State<unknown>,
  resolvingAction: ReceiveAction,
) {
  return state.optimistic.filter(
    optimisticAction =>
      optimisticAction.meta.key !== resolvingAction.meta.key ||
      optimisticAction.meta.date > resolvingAction.meta.date,
  );
}
