import { SET_RESPONSE, FETCH, RESET } from '../actionTypes.js';
import { createSetResponse } from '../controller/actions/index.js';
import Controller from '../controller/Controller.js';
import type {
  FetchAction,
  Manager,
  ActionTypes,
  Middleware,
  SetResponseAction,
} from '../types.js';

export class ResetError extends Error {
  name = 'ResetError';

  constructor() {
    super('Aborted due to RESET');
  }
}

export interface FetchingMeta {
  promise: Promise<any>;
  resolve: (value?: any) => void;
  reject: (value?: any) => void;
  fetchedAt: number;
}

/** Handles all async network dispatches
 *
 * Dedupes concurrent requests by keeping track of all fetches in flight
 * and returning existing promises for requests already in flight.
 *
 * Interfaces with store via a redux-compatible middleware.
 *
 * @see https://dataclient.io/docs/api/NetworkManager
 */
export default class NetworkManager implements Manager {
  protected fetching: Map<string, FetchingMeta> = new Map();
  declare readonly dataExpiryLength: number;
  declare readonly errorExpiryLength: number;
  protected controller: Controller = new Controller();

  constructor({ dataExpiryLength = 60000, errorExpiryLength = 1000 } = {}) {
    this.dataExpiryLength = dataExpiryLength;
    this.errorExpiryLength = errorExpiryLength;
  }

  middleware: Middleware = controller => {
    // A new store (like a remounted provider sharing this manager) must not reuse
    // the old store's fetches: their commits never come, so they never settle.
    if (controller !== this.controller) this.clearAll();
    this.controller = controller;
    return next => action => {
      // From an unmounted store using the same manager: keep its actions away from the new store's fetches
      if (controller !== this.controller) return next(action);
      switch (action.type) {
        case FETCH:
          this.handleFetch(action);
          // This is the only case that causes any state change
          // It's important to intercept other fetches as we don't want to trigger reducers during
          // render - so we need to stop 'readonly' fetches which can be triggered in render
          if (
            action.endpoint.getOptimisticResponse !== undefined &&
            action.endpoint.sideEffect
          ) {
            return next(action);
          }
          return Promise.resolve();
        case SET_RESPONSE:
          // only set after new state is computed
          return next(action).then(() => {
            if (this.fetching.has(action.key)) {
              // Note: meta *must* be set by reducer so this should be safe
              const error = controller.getState().meta[action.key]?.error;
              // processing errors result in state meta having error, so we should reject the promise
              if (error) {
                this.handleSet(
                  createSetResponse(action.endpoint, {
                    args: action.args,
                    response: error,
                    fetchedAt: action.meta.fetchedAt,
                    error: true,
                  }),
                );
              } else {
                this.handleSet(action);
              }
            }
          });
        case RESET: {
          // take snapshot of rejectors at this point in time
          // we must use Array.from since iteration does not freeze state at this point in time
          const fetches = Array.from(this.fetching.values());

          this.clearAll();
          return next(action).then(() => {
            // there could be external listeners to the promise
            // this must happen after commit so our own rejector knows not to dispatch an error based on this
            for (const { reject } of fetches) {
              reject(new ResetError());
            }
          });
        }
        default:
          return next(action);
      }
    };
  };

  /** On mount */
  init() {}

  /** When the provider unmounts or is hidden (like by React <Activity>)
   *
   * Effect cleanup can't tell hiding from unmounting, so fetches in flight still resolve.
   * Responses after cleanup() were once dropped, because React 16/17 warn about state updates
   * after unmount (#1085). Now React 18+ ignores such an update, and useEnhancedReducer drops it on 16/17.
   */
  cleanup() {}

  /** Used by DevtoolsManager to determine whether to log an action */
  skipLogging(action: ActionTypes) {
    /* istanbul ignore next */
    return action.type === FETCH && this.fetching.has(action.key);
  }

  allSettled() {
    if (this.fetching.size)
      return Promise.allSettled(
        this.fetching.values().map(({ promise }) => promise),
      );
  }

  /** Clear all promise state */
  protected clearAll() {
    for (const k of this.fetching.keys()) {
      this.clear(k);
    }
  }

  /** Clear promise state for a given key */
  protected clear(key: string) {
    if (this.fetching.has(key)) {
      (this.fetching.get(key) as FetchingMeta).promise.catch(() => {});
      this.fetching.delete(key);
    }
  }

  protected getLastReset() {
    return this.controller.getState().lastReset;
  }

  /** Called when middleware intercepts 'rdc/fetch' action.
   *
   * Will then start a promise for a key and potentially start the network
   * fetch.
   *
   * Uses throttle endpoints without sideEffects. This is valuable
   * for ensures mutation requests always go through.
   */
  protected handleFetch(action: FetchAction) {
    const { resolve, reject, fetchedAt } = action.meta;
    const throttle = !action.endpoint.sideEffect;
    // Resolve into the store that started the fetch, even if it unmounted and a new store uses this manager
    const controller = this.controller;

    const deferedFetch = () => {
      let promise = action.endpoint(...action.args);
      const resolvePromise = (
        promise: Promise<string | number | object | null>,
      ) =>
        promise
          .then(data => {
            resolve(data);
            return data;
          })
          .catch(error => {
            reject(error);
            throw error;
          });
      // schedule non-throttled resolutions in a microtask before set
      // this enables users awaiting their fetch to trigger any react updates needed to deal
      // with upcoming changes because of the fetch (for instance avoiding suspense if something is deleted)
      if (!throttle) {
        promise = resolvePromise(promise);
      }
      promise = promise
        .then(response => {
          let lastReset = this.getLastReset();

          /* istanbul ignore else */
          if (process.env.NODE_ENV !== 'production' && isNaN(lastReset)) {
            console.error(
              'state.lastReset is NaN. Only positive timestamps are valid.',
            );
            lastReset = 0;
          }

          // don't update state with promises started before last clear
          if (fetchedAt >= lastReset) {
            controller.resolve(action.endpoint, {
              args: action.args,
              response,
              fetchedAt,
            });
          }
          return response;
        })
        .catch(error => {
          // don't update state with promises started before last clear
          if (fetchedAt >= this.getLastReset()) {
            controller.resolve(action.endpoint, {
              args: action.args,
              response: error,
              fetchedAt,
              error: true,
            });
          }
          throw error;
        });
      return promise;
    };

    if (throttle) {
      return this.throttle(action.key, deferedFetch, fetchedAt)
        .then(data => resolve(data))
        .catch(error => reject(error));
    } else {
      return deferedFetch().catch(() => {});
    }
  }

  /** Called when middleware intercepts a set action.
   *
   * Will resolve the promise associated with set key.
   */
  protected handleSet(action: SetResponseAction) {
    const fetchMeta = this.fetching.get(action.key);
    // this can still turn out to be untrue since this is async.
    // A response to an older fetch (like one before a reset) must not settle a newer one
    if (fetchMeta && action.meta.fetchedAt >= fetchMeta.fetchedAt) {
      const { reject, resolve } = fetchMeta;
      if (action.error) {
        reject(action.response);
      } else {
        resolve(action.response);
      }

      // since we're resolved we no longer need to keep track of this promise
      this.clear(action.key);
    }
  }

  /** Ensures only one request for a given key is in flight at any time
   *
   * Uses key to either retrieve in-flight promise, or if not
   * create a new promise and call fetch.
   *
   * Note: The new promise is not actually tied to fetch at all,
   * but is resolved when the expected 'receive' action is processed.
   * This ensures promises are resolved only once their data is processed
   * by the reducer.
   */
  protected throttle(
    key: string,
    fetch: () => Promise<any>,
    fetchedAt: number,
  ): Promise<any> {
    const lastReset = this.getLastReset();
    let fetchMeta = this.fetching.get(key);

    // we're already fetching so reuse the promise
    // fetches after reset do not count
    if (fetchMeta && fetchMeta.fetchedAt > lastReset) {
      return fetchMeta.promise;
    }

    fetchMeta = newFetchMeta(fetchedAt);
    this.fetching.set(key, fetchMeta);

    this.idleCallback(
      () => {
        // since our real promise is resolved via the wrapReducer(),
        // we should just stop all errors here.
        // TODO: decouple this from useFetcher() (that's what's dispatching the error the resolves in here)
        fetch().catch(() => null);
      },
      { timeout: 500 },
    );

    return fetchMeta.promise;
  }

  /** Calls the callback when client is not 'busy' with high priority interaction tasks
   *
   * Override for platform-specific implementations
   */
  protected idleCallback(
    callback: (...args: any[]) => void,
    options?: IdleRequestOptions,
  ) {
    callback();
  }
}

function newFetchMeta(fetchedAt: number): FetchingMeta {
  const fetchMeta = { fetchedAt } as FetchingMeta;
  fetchMeta.promise = new Promise((resolve, reject) => {
    fetchMeta.resolve = resolve;
    fetchMeta.reject = reject;
  });
  return fetchMeta;
}
