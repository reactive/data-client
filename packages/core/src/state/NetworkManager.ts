import {
  MiddlewareAPI,
  Middleware,
  Dispatch,
} from '@rest-hooks/use-enhanced-reducer';
import { FetchAction, ReceiveAction, Manager } from '@rest-hooks/core/types';
import {
  RECEIVE_TYPE,
  FETCH_TYPE,
  RESET_TYPE,
} from '@rest-hooks/core/actionTypes';

import RIC from './RIC';
import { createReceive, createReceiveError } from './actions';

class CleanupError extends Error {
  message = 'Cleaning up Network Manager';
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

  constructor(dataExpiryLength = 60000, errorExpiryLength = 1000) {
    this.dataExpiryLength = dataExpiryLength;
    this.errorExpiryLength = errorExpiryLength;

    this.middleware = <R extends React.Reducer<any, any>>({
      dispatch,
      getState,
    }: MiddlewareAPI<R>) => {
      return (next: Dispatch<R>) => (
        action: React.ReducerAction<R>,
      ): Promise<void> => {
        switch (action.type) {
          case FETCH_TYPE:
            this.handleFetch(action, dispatch);
            // This is the only case that causes any state change
            // It's important to intercept other fetches as we don't want to trigger reducers during
            // render - so we need to stop 'readonly' fetches which can be triggered in render
            if (action.meta.optimisticResponse !== undefined) {
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
          case RESET_TYPE:
            this.cleanup();
            return next(action);
          default:
            return next(action);
        }
      };
    };
  }

  /** Ensures all promises are completed by rejecting remaining. */
  cleanup() {
    for (const k in this.rejectors) {
      this.rejectors[k](new CleanupError());
    }
  }

  /** Clear promise state for a given key */
  protected clear(key: string) {
    delete this.resolvers[key];
    delete this.rejectors[key];
    delete this.fetched[key];
  }

  /** Called when middleware intercepts 'rest-hooks/fetch' action.
   *
   * Will then start a promise for a key and potentially start the network
   * fetch.
   *
   * Uses throttle only when instructed by action meta. This is valuable
   * for ensures mutation requests always go through.
   */
  protected handleFetch(action: FetchAction, dispatch: Dispatch<any>) {
    const {
      endpoint,
      args,
      meta: { throttle, resolve, reject },
    } = action;
    const deferedFetch = () =>
      endpoint(...args)
        .then(data => {
          // does this throw if the reducer fails?
          dispatch(
            createReceive(data, {
              ...action,
              endpoint: {
                dataExpiryLength: this.dataExpiryLength,
                ...action.endpoint,
              },
            }),
          );
          return data;
        })
        .catch(error => {
          if (error instanceof CleanupError) return;
          dispatch(
            createReceiveError(error, {
              ...action,
              endpoint: {
                errorExpiryLength: this.errorExpiryLength,
                ...action.endpoint,
              },
            }),
          );
          throw error;
        });
    let promise;
    if (throttle) {
      promise = this.throttle(endpoint.key(args[0]), deferedFetch);
    } else {
      promise = deferedFetch();
    }
    promise.then(data => resolve(data)).catch(error => reject(error));
    return promise;
  }

  /** Called when middleware intercepts a receive action.
   *
   * Will resolve the promise associated with receive key.
   */
  protected handleReceive(action: ReceiveAction) {
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
