import { normalize } from '@rest-hooks/normalizr';
import {
  ActionTypes,
  State,
  ReceiveAction,
  ReceiveMeta,
} from '@rest-hooks/core/types';
import { createReceive } from '@rest-hooks/core/state/actions/index';
import {
  RECEIVE_TYPE,
  INVALIDATE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  GC_TYPE,
} from '@rest-hooks/core/actionTypes';
import applyUpdatersToResults from '@rest-hooks/core/state/applyUpdatersToResults';

export const initialState: State<unknown> = {
  entities: {},
  indexes: {},
  results: {},
  meta: {},
  entityMeta: {},
  optimistic: [],
  lastReset: -Infinity,
};

export default function reducer(
  state: State<unknown> | undefined,
  action: ActionTypes,
): State<unknown> {
  if (!state) state = initialState;
  switch (action.type) {
    case GC_TYPE:
      // inline deletes are fine as these should have 0 refcounts
      action.entities.forEach(([key, pk]) => {
        delete (state as any).entities[key]?.[pk];
        delete (state as any).entityMeta[key]?.[pk];
      });
      action.results.forEach(fetchKey => {
        delete (state as any).results[fetchKey];
        delete (state as any).meta[fetchKey];
      });
      return state;
    case FETCH_TYPE: {
      // If 'fetch' action reaches the reducer there are no middlewares installed to handle it
      /* istanbul ignore next */
      if (process.env.NODE_ENV !== 'production' && !action.meta.nm) {
        console.warn(
          'Fetch appears unhandled - you are likely missing the NetworkManager middleware',
        );
        console.warn(
          'See https://resthooks.io/docs/guides/redux#indextsx for hooking up redux',
        );
      }
      const optimisticResponse = action.meta.optimisticResponse;
      if (optimisticResponse === undefined) {
        return state;
      }

      return {
        ...state,
        optimistic: [
          ...state.optimistic,
          createReceive(optimisticResponse, {
            ...action.meta,
            dataExpiryLength: 9999999999999,
          }),
        ],
      };
    }
    case RECEIVE_TYPE: {
      if (action.error) {
        return reduceError(state, action, action.payload);
      }
      try {
        const { result, entities, indexes, entityMeta } = normalize(
          action.payload,
          action.meta.schema,
          state.entities,
          state.indexes,
          state.entityMeta,
          action.meta,
        );
        let results = {
          ...state.results,
          [action.meta.key]: result,
        };
        try {
          results = applyUpdatersToResults(
            results,
            result,
            action.meta.updaters,
          );
          if (action.meta.update) {
            const updaters = action.meta.update(
              result,
              ...(action.meta.args || []),
            );
            Object.keys(updaters).forEach(key => {
              results[key] = updaters[key](results[key]);
            });
          }
          // no reason to completely fail because of user-code error
          // integrity of this state update is still guaranteed
        } catch (error) {
          console.log(
            `The following error occured during Endpoint.update() for ${action.meta.key}`,
          );
          console.error(error);
        }
        return {
          entities,
          indexes,
          results,
          entityMeta,
          meta: {
            ...state.meta,
            [action.meta.key]: {
              date: action.meta.date,
              expiresAt: action.meta.expiresAt,
              prevExpiresAt: state.meta[action.meta.key]?.expiresAt,
            },
          },
          optimistic: filterOptimistic(state, action),
          lastReset: state.lastReset,
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
        // this is not always bubbled up, so let's double sure this doesn't fail silently
        if (process.env.NODE_ENV !== 'production') {
          console.error(error);
        }
        return reduceError(state, action, error);
      }
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
            error: undefined,
            expiresAt: 0,
            invalidated: true,
          },
        },
      };
    }
    case RESET_TYPE:
      return { ...initialState, lastReset: action.date };

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
  if (error.name === 'AbortError') {
    // In case we abort simply undo the optimistic update and act like no fetch even occured
    // We still want those watching promises from fetch directly to observed the abort, but we don't want to
    // Trigger errors in this case. This means theoretically improperly built abortes useResource() could suspend forever.
    return {
      ...state,
      optimistic: filterOptimistic(state, action),
    };
  }
  return {
    ...state,
    meta: {
      ...state.meta,
      [action.meta.key]: {
        date: action.meta.date,
        error,
        expiresAt: action.meta.expiresAt,
        errorPolicy: action.meta.errorPolicy?.(error),
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
