import { SET_TYPE, FETCH_TYPE, RESET_TYPE } from '../actionTypes.js';
import Controller from '../controller/Controller.js';
import createSet from '../controller/createSet.js';
import RIC from '../state/RIC.js';
import type {
  FetchAction,
  Manager,
  ActionTypes,
  MiddlewareAPI,
  Middleware,
  SetAction,
} from '../types.js';

export class ResetError extends Error {
  name = 'ResetError';

  constructor() {
    super('Aborted due to RESET');
  }
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
  protected fetched: { [k: string]: Promise<any> } = Object.create(null);
  protected resolvers: { [k: string]: (value?: any) => void } = {};
  protected rejectors: { [k: string]: (value?: any) => void } = {};
  protected fetchedAt: { [k: string]: number } = {};
  declare readonly dataExpiryLength: number;
  declare readonly errorExpiryLength: number;
  protected declare middleware: Middleware;
  protected controller: Controller = new Controller();
  declare cleanupDate?: number;

  constructor(dataExpiryLength = 60000, errorExpiryLength = 1000) {
    this.dataExpiryLength = dataExpiryLength;
    this.errorExpiryLength = errorExpiryLength;

    this.middleware = <C extends MiddlewareAPI>(controller: C) => {
      this.controller = controller;
      return (next: C['dispatch']): C['dispatch'] =>
        (action): Promise<void> => {
          switch (action.type) {
            case FETCH_TYPE:
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
            case SET_TYPE:
              // only receive after new state is computed
              return next(action).then(() => {
                if (action.meta.key in this.fetched) {
                  // Note: meta *must* be set by reducer so this should be safe
                  const error =
                    controller.getState().meta[action.meta.key]?.error;
                  // processing errors result in state meta having error, so we should reject the promise
                  if (error) {
                    this.handleReceive(
                      createSet(action.endpoint, {
                        args: action.meta.args as any,
                        response: error,
                        fetchedAt: action.meta.fetchedAt,
                        error: true,
                      }),
                    );
                  } else {
                    this.handleReceive(action);
                  }
                }
              });
            case RESET_TYPE: {
              const rejectors = { ...this.rejectors };

              this.clearAll();
              return next(action).then(() => {
                // there could be external listeners to the promise
                // this must happen after commit so our own rejector knows not to dispatch an error based on this
                for (const k in rejectors) {
                  rejectors[k](new ResetError());
                }
              });
            }
            default:
              return next(action);
          }
        };
    };
  }

  /** Used by DevtoolsManager to determine whether to log an action */
  skipLogging(action: ActionTypes) {
    /* istanbul ignore next */
    return action.type === FETCH_TYPE && action.meta.key in this.fetched;
  }

  /** On mount */
  init() {
    delete this.cleanupDate;
  }

  /** Ensures all promises are completed by rejecting remaining. */
  cleanup() {
    // ensure no dispatches after unmount
    // this must be reversible (done in init) so useEffect() remains symmetric
    this.cleanupDate = Date.now();
  }

  allSettled() {
    const fetches = Object.values(this.fetched);
    if (fetches.length) return Promise.allSettled(fetches);
  }

  /** Clear all promise state */
  protected clearAll() {
    for (const k in this.rejectors) {
      this.clear(k);
    }
  }

  /** Clear promise state for a given key */
  protected clear(key: string) {
    this.fetched[key].catch(() => {});
    delete this.resolvers[key];
    delete this.rejectors[key];
    delete this.fetched[key];
    delete this.fetchedAt[key];
  }

  protected getLastReset() {
    if (this.cleanupDate) return this.cleanupDate;
    return this.controller.getState().lastReset;
  }

  /** Called when middleware intercepts 'rest-hooks/fetch' action.
   *
   * Will then start a promise for a key and potentially start the network
   * fetch.
   *
   * Uses throttle only when instructed by action meta. This is valuable
   * for ensures mutation requests always go through.
   */
  protected handleFetch(action: FetchAction) {
    const fetch = action.payload;
    const { key, throttle, resolve, reject, createdAt } = action.meta;

    const deferedFetch = () => {
      let promise = fetch();
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
      // schedule non-throttled resolutions in a microtask before receive
      // this enables users awaiting their fetch to trigger any react updates needed to deal
      // with upcoming changes because of the fetch (for instance avoiding suspense if something is deleted)
      if (!throttle) {
        promise = resolvePromise(promise);
      }
      promise = promise
        .then(data => {
          let lastReset = this.getLastReset();

          /* istanbul ignore else */
          if (process.env.NODE_ENV !== 'production' && isNaN(lastReset)) {
            console.error(
              'state.lastReset is NaN. Only positive timestamps are valid.',
            );
            lastReset = 0;
          }

          // don't update state with promises started before last clear
          if (createdAt >= lastReset) {
            this.controller.resolve(action.endpoint, {
              args: action.meta.args as any,
              response: data,
              fetchedAt: createdAt,
            });
          }
          return data;
        })
        .catch(error => {
          const lastReset = this.getLastReset();
          // don't update state with promises started before last clear
          if (createdAt >= lastReset) {
            this.controller.resolve(action.endpoint, {
              args: action.meta.args as any,
              response: error,
              fetchedAt: createdAt,
              error: true,
            });
          }
          throw error;
        });
      return promise;
    };

    if (throttle) {
      return this.throttle(key, deferedFetch, createdAt)
        .then(data => resolve(data))
        .catch(error => reject(error));
    } else {
      return deferedFetch().catch(() => {});
    }
  }

  /** Called when middleware intercepts a receive action.
   *
   * Will resolve the promise associated with receive key.
   */
  protected handleReceive(action: SetAction) {
    // this can still turn out to be untrue since this is async
    if (action.meta.key in this.fetched) {
      let promiseHandler: (value?: any) => void;
      if (action.error) {
        promiseHandler = this.rejectors[action.meta.key];
      } else {
        promiseHandler = this.resolvers[action.meta.key];
      }
      promiseHandler(action.payload);
      // since we're resolved we no longer need to keep track of this promise
      this.clear(action.meta.key);
    }
  }

  /** Attaches NetworkManager to store
   *
   * Intercepts 'rest-hooks/fetch' actions to start requests.
   *
   * Resolve/rejects a request when matching 'rest-hooks/receive' event
   * is seen.
   */
  getMiddleware() {
    return this.middleware;
  }

  /** Ensures only one request for a given key is in flight at any time
   *
   * Uses key to either retrieve in-flight promise, or if not
   * create a new promise and call fetch.
   *
   * Note: The new promise is not actually tied to fetch at all,
   * but is resolved when the expected 'recieve' action is processed.
   * This ensures promises are resolved only once their data is processed
   * by the reducer.
   */
  protected throttle(
    key: string,
    fetch: () => Promise<any>,
    createdAt: number,
  ) {
    const lastReset = this.getLastReset();
    // we're already fetching so reuse the promise
    // fetches after reset do not count
    if (key in this.fetched && this.fetchedAt[key] > lastReset) {
      return this.fetched[key];
    }

    this.fetched[key] = new Promise((resolve, reject) => {
      this.resolvers[key] = resolve;
      this.rejectors[key] = reject;
    });
    this.fetchedAt[key] = createdAt;

    // since our real promise is resolved via the wrapReducer(),
    // we should just stop all errors here.
    // TODO: decouple this from useFetcher() (that's what's dispatching the error the resolves in here)
    RIC(
      () => {
        fetch().catch(() => null);
      },
      { timeout: 500 },
    );

    return this.fetched[key];
  }
}
