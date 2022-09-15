import { normalize } from '@rest-hooks/normalizr';

import {
  ActionTypes,
  State,
  ReceiveAction,
  OptimisticAction,
} from '../types.js';
import createOptimistic from '../controller/createOptimistic.js';
import { createReceive as legacyCreateReceive } from './actions/index.js';
import {
  RECEIVE_TYPE,
  INVALIDATE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  GC_TYPE,
  OPTIMISTIC_TYPE,
} from '../actionTypes.js';
import applyUpdatersToResults from './applyUpdatersToResults.js';
import Controller from '../controller/Controller.js';

export const initialState: State<unknown> = {
  entities: {},
  indexes: {},
  results: {},
  meta: {},
  entityMeta: {},
  optimistic: [],
  lastReset: 0,
};

export default function createReducer(controller: Controller) {
  return function reducer(
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
        const getOptimisticResponse = action.endpoint?.getOptimisticResponse;
        let receiveAction: ReceiveAction | OptimisticAction;

        if (getOptimisticResponse && action.endpoint) {
          receiveAction = createOptimistic(action.endpoint, {
            args: action.meta.args as readonly any[],
            fetchedAt:
              typeof action.meta.createdAt !== 'number'
                ? action.meta.createdAt.getTime()
                : action.meta.createdAt,
          });
        } else if (optimisticResponse) {
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
      case OPTIMISTIC_TYPE:

      // eslint-disable-next-line no-fallthrough
      case RECEIVE_TYPE: {
        if (action.error) {
          return reduceError(state, action, action.payload);
        }
        try {
          let payload: any;
          // for true receives payload is contained in action
          if (action.type === OPTIMISTIC_TYPE) {
            if (!action.endpoint.getOptimisticResponse) return state;
            try {
              // compute optimistic response based on current state
              payload = action.endpoint.getOptimisticResponse.call(
                action.endpoint,
                controller.snapshot(state, action.meta.fetchedAt),
                // if endpoint exists, so must args; TODO: fix typing
                ...(action.meta.args as any[]),
              );
            } catch (e: any) {
              // AbortOptimistic means 'do nothing', otherwise we count the exception as endpoint failure
              if (e.constructor?.name === 'AbortOptimistic') {
                return state;
              }
              throw e;
            }
          } else {
            payload = action.payload;
          }
          const { result, entities, indexes, entityMeta } = normalize(
            payload,
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
            if ('updaters' in action.meta && action.meta.updaters) {
              results = applyUpdatersToResults(
                results,
                result,
                action.meta.updaters as any,
              );
            }
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
            console.error(
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
        } catch (error: any) {
          if (typeof error === 'object') {
            error.message = `Error processing ${
              action.meta.key
            }\n\nFull Schema: ${JSON.stringify(
              action.meta.schema,
              undefined,
              2,
            )}\n\nError:\n${error.message}`;
            if ('payload' in action) error.payload = action.payload;
            error.status = 400;
          }

          // this is not always bubbled up, so let's double sure this doesn't fail silently
          /* istanbul ignore else */
          if (process.env.NODE_ENV !== 'production') {
            console.error(error);
          }
          return reduceError(state, action, error);
        }
      }
      case INVALIDATE_TYPE: {
        const results = { ...state.results };
        delete results[action.meta.key];
        const meta = {
          ...state.meta[action.meta.key],
          expiresAt: 0,
          invalidated: true,
        };
        delete meta.error;

        return {
          ...state,
          results,
          meta: {
            ...state.meta,
            [action.meta.key]: meta,
          },
        };
      }
      case RESET_TYPE:
        if (
          process.env.NODE_ENV !== 'production' &&
          action.date === undefined
        ) {
          console.warn(
            `${RESET_TYPE} sent without 'date' member. This is deprecated. Please use createReset() action creator to ensure correct action shape.`,
          );
        }
        return { ...initialState, lastReset: action.date ?? Date.now() };

      default:
        // A reducer must always return a valid state.
        // Alternatively you can throw an error if an invalid action is dispatched.
        return state;
    }
  };
}

type Writable<T> = { [P in keyof T]: NonNullable<Writable<T[P]>> };

function reduceError(
  state: State<unknown>,
  action: ReceiveAction | OptimisticAction,
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
  resolvingAction: ReceiveAction | OptimisticAction,
) {
  return state.optimistic.filter(
    optimisticAction =>
      optimisticAction.meta.key !== resolvingAction.meta.key ||
      (optimisticAction.type === OPTIMISTIC_TYPE
        ? optimisticAction.meta.fetchedAt !== resolvingAction.meta.fetchedAt
        : optimisticAction.meta.date > resolvingAction.meta.date),
  );
}
