import { normalize } from '@data-client/normalizr';

import { OPTIMISTIC } from '../../actionTypes.js';
import AbortOptimistic from '../../controller/AbortOptimistic.js';
import type Controller from '../../controller/Controller.js';
import type {
  State,
  SetResponseAction,
  OptimisticAction,
} from '../../types.js';

export function setResponseReducer(
  state: State<unknown>,
  action: OptimisticAction | SetResponseAction,
  controller: Controller,
): State<unknown> {
  if (action.error) {
    return reduceError(state, action, action.response);
  }
  try {
    let response: any;
    // for true set's response is contained in action
    if (action.type === OPTIMISTIC) {
      // this should never happen
      /* istanbul ignore if */
      if (!action.endpoint.getOptimisticResponse) return state;
      try {
        // compute optimistic response based on current state
        response = action.endpoint.getOptimisticResponse.call(
          action.endpoint,
          controller.snapshot(state, action.meta.fetchedAt),
          ...action.args,
        );
      } catch (e: any) {
        // AbortOptimistic means 'do nothing', otherwise we count the exception as endpoint failure
        if (e.constructor === AbortOptimistic) {
          return state;
        }
        throw e;
      }
    } else {
      response = action.response;
    }
    const { result, entities, indexes, entitiesMeta } = normalize(
      action.endpoint.schema,
      response,
      action.args,
      state,
      action.meta,
    );
    const endpoints: Record<string, unknown> = {
      ...state.endpoints,
      [action.key]: result,
    };
    try {
      if (action.endpoint.update) {
        const updaters = action.endpoint.update(result, ...action.args);
        Object.keys(updaters).forEach(key => {
          endpoints[key] = updaters[key](endpoints[key]);
        });
      }
      // no reason to completely fail because of user-code error
      // integrity of this state update is still guaranteed
    } catch (error) {
      console.error(`Endpoint.update() error: ${action.key}`);
      console.error(error);
    }
    return {
      entities,
      endpoints,
      indexes,
      meta: {
        ...state.meta,
        [action.key]: {
          date: action.meta.date,
          fetchedAt: action.meta.fetchedAt,
          expiresAt: action.meta.expiresAt,
          prevExpiresAt: state.meta[action.key]?.expiresAt,
        },
      },
      entitiesMeta,
      optimistic: filterOptimistic(state, action),
      lastReset: state.lastReset,
    };
    // reducer must update the state, so in case of processing errors we simply compute the endpoints inline
  } catch (error: any) {
    if (typeof error === 'object') {
      error.message =
        process.env.NODE_ENV !== 'production' && action.type === OPTIMISTIC ?
          `${optimisticFailureIntro(action.key)}\n\n${error.message}`
        : `Error processing ${action.key}\n\nFull Schema: ${JSON.stringify(
            action.endpoint.schema,
            undefined,
            2,
          )}\n\nError:\n${error.message}`;
      if ('response' in action) error.response = action.response;
      error.status = 400;
    }

    // this is not always bubbled up, so let's double sure this doesn't fail silently
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production' && claimReport(action)) {
      console.error(error);
    }
    return reduceError(state, action, error);
  }
}

/** Optimistic failures already logged, by key and fetch time (development only).
 * Like filterOptimistic(), key + fetchedAt identifies the fetch. Capped, so a long
 * session can't grow it; clearing at worst repeats a report.
 */
const reportedOptimistic = /* @__PURE__ */ new Set<string>();
/** Records the report; false when this optimistic failure was already reported.
 * Optimistic actions are re-applied on every state change (also by DevToolsManager),
 * and React 18 StrictMode can re-create one from the same fetch, so each is reported once.
 */
function claimReport(action: OptimisticAction | SetResponseAction) {
  if (action.type !== OPTIMISTIC) return true;
  const reportKey = `${action.key} ${action.meta.fetchedAt}`;
  if (reportedOptimistic.has(reportKey)) return false;
  if (reportedOptimistic.size >= 100) reportedOptimistic.clear();
  reportedOptimistic.add(reportKey);
  return true;
}

function optimisticFailureIntro(key: string) {
  return `Optimistic update skipped for ${key}; the UI will update when the server responds.
getOptimisticResponse() threw, or returned a value that could not be normalized.
Often an Entity is missing its primary key: read it from the snapshot, like snap.getResponse(getMe).data.
https://dataclient.io/rest/api/RestEndpoint#getoptimisticresponse`;
}

function reduceError(
  state: State<unknown>,
  action: SetResponseAction | OptimisticAction,
  error: any,
): State<unknown> {
  if (error.name === 'AbortError') {
    // In case we abort simply undo the optimistic update and act like no fetch even occured
    // We still want those watching promises from fetch directly to observed the abort, but we don't want to
    // Trigger errors in this case. This means theoretically improperly built aborts useSuspense() could suspend forever.
    return {
      ...state,
      optimistic: filterOptimistic(state, action),
    };
  }
  return {
    ...state,
    meta: {
      ...state.meta,
      [action.key]: {
        date: action.meta.date,
        fetchedAt: action.meta.fetchedAt,
        expiresAt: action.meta.expiresAt,
        error,
        errorPolicy: action.endpoint.errorPolicy?.(error),
      },
    },
    optimistic: filterOptimistic(state, action),
  };
}
/** Filter all requests with same serialization that did not start after the resolving request */
function filterOptimistic(
  state: State<unknown>,
  resolvingAction: SetResponseAction | OptimisticAction,
) {
  return state.optimistic.filter(
    optimisticAction =>
      optimisticAction.key !== resolvingAction.key ||
      (optimisticAction.type === OPTIMISTIC ?
        optimisticAction.meta.fetchedAt !== resolvingAction.meta.fetchedAt
      : optimisticAction.meta.date > resolvingAction.meta.date),
  );
}
