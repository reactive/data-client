import {
  FetchAction,
  ReceiveAction,
  Manager,
  State,
  ActionTypes,
  MiddlewareAPI,
  Middleware,
  Dispatch,
} from '../types.js';
import { RECEIVE_TYPE, FETCH_TYPE, RESET_TYPE } from '../actionTypes.js';
import RIC from './RIC.js';
import { createReceive, createReceiveError } from './actions/index.js';
import { initialState } from './createReducer.js';
import Controller from '../controller/Controller.js';

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
 */
export default class NetworkManager implements Manager {
  protected fetched: { [k: string]: Promise<any> } = {};
  protected resolvers: { [k: string]: (value?: any) => void } = {};
  protected rejectors: { [k: string]: (value?: any) => void } = {};
  declare readonly dataExpiryLength: number;
  declare readonly errorExpiryLength: number;
  protected declare middleware: Middleware;
  protected getState: () => State<unknown> = () => initialState;
  declare cleanupDate?: number;

  constructor(dataExpiryLength = 60000, errorExpiryLength = 1000) {
    this.dataExpiryLength = dataExpiryLength;
    this.errorExpiryLength = errorExpiryLength;

    this.middleware = <R extends React.Reducer<any, any>>({
      dispatch,
      getState,
      controller,
    }: MiddlewareAPI<R>) => {
      this.getState = getState;
      return (next: Dispatch<R>) =>
        (action: React.ReducerAction<R>): Promise<void> => {
          switch (action.type) {
            case FETCH_TYPE:
              this.handleFetch(action, dispatch, controller);
              // This is the only case that causes any state change
              // It's important to intercept other fetches as we don't want to trigger reducers during
              // render - so we need to stop 'readonly' fetches which can be triggered in render
              if (
                action.meta.optimisticResponse !== undefined ||
                action.endpoint?.getOptimisticResponse !== undefined
              ) {
                return next(action);
              }
              return Promise.resolve();
            case RECEIVE_TYPE:
              // only receive after new state is computed
              return next(action).then(() => {
                if (action.meta.key in this.fetched) {
                  // Note: meta *must* be set by reducer so this should be safe
                  const error = getState().meta[action.meta.key]?.error;
                  // processing errors result in state meta having error, so we should reject the promise
                  if (error) {
                    this.handleReceive(createReceiveError(error, action.meta));
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
    return (
      action.type === FETCH_TYPE && Object.hasOwn(this.fetched, action.meta.key)
    );
  }

  /** On mount */
  init() {
    delete this.cleanupDate;
  }

  /** Ensures all promises are completed by rejecting remaining. */
  cleanup() {
    // ensure no dispatches after unmount
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
    delete this.resolvers[key];
    delete this.rejectors[key];
    delete this.fetched[key];
  }

  protected getLastReset() {
    if (this.cleanupDate) return this.cleanupDate;
    const lastReset = this.getState().lastReset;
    if (lastReset instanceof Date) return lastReset.valueOf();
    if (typeof lastReset !== 'number') return -Infinity;
    return lastReset;
  }

  /** Called when middleware intercepts 'rest-hooks/fetch' action.
   *
   * Will then start a promise for a key and potentially start the network
   * fetch.
   *
   * Uses throttle only when instructed by action meta. This is valuable
   * for ensures mutation requests always go through.
   */
  protected handleFetch(
    action: FetchAction,
    dispatch: Dispatch<any>,
    controller: Controller,
  ) {
    const fetch = action.payload;
    const { key, throttle, resolve, reject } = action.meta;
    // TODO(breaking): remove support for Date type in 'Receive' action
    const createdAt =
      typeof action.meta.createdAt !== 'number'
        ? action.meta.createdAt.getTime()
        : action.meta.createdAt;

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
      if (!throttle && action.endpoint) {
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
            // we still check for controller in case someone didn't have type protection since this didn't always exist
            if (action.endpoint && controller) {
              controller.resolve(action.endpoint, {
                args: action.meta.args as any,
                response: data,
                fetchedAt: createdAt,
              });
            } else {
              // does this throw if the reducer fails? - no because reducer is wrapped in try/catch
              dispatch(
                createReceive(data, {
                  ...action.meta,
                  fetchedAt: createdAt,
                  dataExpiryLength:
                    action.meta.options?.dataExpiryLength ??
                    this.dataExpiryLength,
                }),
              );
            }
          }
          return data;
        })
        .catch(error => {
          const lastReset = this.getLastReset();
          // don't update state with promises started before last clear
          if (createdAt >= lastReset) {
            if (action.endpoint && controller) {
              controller.resolve(action.endpoint, {
                args: action.meta.args as any,
                response: error,
                fetchedAt: createdAt,
                error: true,
              });
            } else {
              dispatch(
                createReceiveError(error, {
                  ...action.meta,
                  errorExpiryLength:
                    action.meta.options?.errorExpiryLength ??
                    this.errorExpiryLength,
                  fetchedAt: createdAt,
                }),
              );
            }
          }
          throw error;
        });
      // legacy behavior schedules resolution after dispatch
      if (!throttle && !action.endpoint) {
        promise = resolvePromise(promise);
      }
      return promise;
    };

    if (throttle) {
      return this.throttle(key, deferedFetch)
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
  protected handleReceive(action: ReceiveAction) {
    // this can still turn out to be untrue since this is async
    if (Object.hasOwn(this.fetched, action.meta.key)) {
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
  getMiddleware<T extends NetworkManager>(this: T) {
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
  protected throttle(key: string, fetch: () => Promise<any>) {
    // we're already fetching so reuse the promise
    if (key in this.fetched) {
      return this.fetched[key];
    }

    this.fetched[key] = new Promise((resolve, reject) => {
      this.resolvers[key] = resolve;
      this.rejectors[key] = reject;
    });

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
