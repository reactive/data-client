import { normalize } from '@data-client/normalizr';

import { OPTIMISTIC_TYPE } from '../../actionTypes.js';
import type Controller from '../../controller/Controller.js';
import type { State, ReceiveAction, OptimisticAction } from '../../types.js';

export function setReducer(
  state: State<unknown>,
  action: OptimisticAction | ReceiveAction,
  controller: Controller,
) {
  if (action.error) {
    return reduceError(state, action, action.payload);
  }
  try {
    let payload: any;
    // for true receives payload is contained in action
    if (action.type === OPTIMISTIC_TYPE) {
      // this should never happen
      if (!action.endpoint.getOptimisticResponse) return state;
      try {
        // compute optimistic response based on current state
        payload = action.endpoint.getOptimisticResponse.call(
          action.endpoint,
          controller.snapshot(state, action.meta.fetchedAt),
          ...action.meta.args,
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
      action.endpoint.schema,
      action.meta.args as any,
      state.entities,
      state.indexes,
      state.entityMeta,
      action.meta,
    );
    const results = {
      ...state.results,
      [action.meta.key]: result,
    };
    try {
      if (action.endpoint.update) {
        const updaters = action.endpoint.update(result, ...action.meta.args);
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
        action.endpoint.schema,
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
        errorPolicy: action.endpoint.errorPolicy?.(error),
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
