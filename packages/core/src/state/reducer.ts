import { normalize } from '@rest-hooks/normalizr';
import { ActionTypes, State, ReceiveAction } from '@rest-hooks/core/types';
import { createReceive } from '@rest-hooks/core/state/actions';
import {
  RECEIVE_TYPE,
  INVALIDATE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  GC_TYPE,
} from '@rest-hooks/core/actionTypes';

import applyUpdatersToResults from './applyUpdatersToResults';
import mergeDeepCopy from './merge/mergeDeepCopy';

export const initialState: State<unknown> = {
  entities: {},
  indexes: {},
  results: {},
  meta: {},
  entityMeta: {},
  optimistic: [],
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
        const { result, entities, indexes } = normalize(
          action.payload,
          action.meta.schema,
          state.entities,
          state.indexes,
        );
        let results = {
          ...state.results,
          [action.meta.key]: result,
        };
        results = applyUpdatersToResults(results, result, action.meta.updaters);
        if (action.meta.update) {
          const updaters = action.meta.update(
            result,
            ...(action.meta.args || []),
          );
          Object.keys(updaters).forEach(key => {
            results[key] = updaters[key](results[key]);
          });
        }
        return {
          entities: mergeDeepCopy(
            state.entities,
            entities,
            state.entityMeta,
            action.meta.date,
          ),
          indexes: mergeDeepCopy(
            state.indexes,
            indexes,
            state.entityMeta,
            action.meta.date,
          ),
          results,
          meta: {
            ...state.meta,
            [action.meta.key]: {
              date: action.meta.date,
              expiresAt: action.meta.expiresAt,
              prevExpiresAt: state.meta[action.meta.key]?.expiresAt,
            },
          },
          entityMeta: updateEntityMeta(state.entityMeta, entities, action.meta),
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

/** Updates dates of entities for all those processed in a request */
function updateEntityMeta(
  entityMeta: State<unknown>['entityMeta'],
  entities: State<unknown>['entities'],
  { expiresAt, date }: { expiresAt: number; date: number },
): State<unknown>['entityMeta'] {
  const meta: any = { ...entityMeta };
  for (const k in entities) {
    meta[k] = { ...entityMeta[k] };
    for (const pk in entities[k]) {
      meta[k][pk] =
        meta[k][pk]?.expiresAt >= expiresAt ? meta[k][pk] : { expiresAt, date };
    }
  }
  return meta;
}
