import { memoize } from 'lodash';

import RIC from './RIC';
import { createReceive, createReceiveError } from './actionCreators';

import {
  FetchAction,
  ReceiveAction,
  MiddlewareAPI,
  Manager,
  Dispatch,
} from '~/types';
import {
  RECEIVE_TYPE,
  RECEIVE_MUTATE_TYPE,
  RECEIVE_DELETE_TYPE,
  FETCH_TYPE,
  RESET_TYPE,
} from '~/actionTypes';

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
  constructor(dataExpiryLength = 60000, errorExpiryLength = 1000) {
    this.dataExpiryLength = dataExpiryLength;
    this.errorExpiryLength = errorExpiryLength;
  }

  /** Ensures all promises are completed by rejecting remaining. */
  cleanup() {
    for (const k in this.rejectors) {
      this.rejectors[k](new CleanupError());
    }
  }

  /** Clear promise state for a given url */
  protected clear(url: string) {
    delete this.resolvers[url];
    delete this.rejectors[url];
    delete this.fetched[url];
  }

  /** Called when middleware intercepts 'rest-hooks/fetch' action.
   *
   * Will then start a promise for a url and potentially start the network
   * fetch.
   *
   * Uses throttle only when instructed by action meta. This is valuable
   * for ensures mutation requests always go through.
   */
  protected handleFetch(action: FetchAction, dispatch: Dispatch<any>) {
    const fetch = action.payload;
    const { url, throttle, resolve, reject } = action.meta;
    const deferedFetch = () =>
      fetch()
        .then(data => {
          dispatch(createReceive(data, action.meta, this));
          return data;
        })
        .catch(error => {
          if (error instanceof CleanupError) return;
          dispatch(createReceiveError(error, action.meta, this));
          throw error;
        });
    let promise;
    if (throttle) {
      promise = this.throttle(url, deferedFetch);
    } else {
      promise = deferedFetch();
    }
    promise.then(data => resolve(data)).catch(error => reject(error));
    return promise;
  }

  /** Called when middleware intercepts a receive action.
   *
   * Will resolve the promise associated with receive url.
   */
  protected handleReceive(action: ReceiveAction) {
    // this can still turn out to be untrue since this is async
    if (action.meta.url in this.fetched) {
      let promiseHandler: (value?: any) => void;
      if (action.error) {
        promiseHandler = this.rejectors[action.meta.url];
      } else {
        promiseHandler = this.resolvers[action.meta.url];
      }
      promiseHandler(action.payload);
      // since we're resolved we no longer need to keep track of this promise
      this.clear(action.meta.url);
    }
  }

  /** Attaches NetworkManager to store
   *
   * Intercepts 'rest-hooks/fetch' actions to start requests.
   *
   * Resolve/rejects a request when matching 'rest-hooks/receive' event
   * is seen.
   */
  getMiddleware = memoize(function<T extends NetworkManager>(this: T) {
    return <R extends React.Reducer<any, any>>({
      dispatch,
    }: MiddlewareAPI<R>) => {
      return (next: Dispatch<R>) => (
        action: React.ReducerAction<R>,
      ): Promise<void> => {
        switch (action.type) {
          case FETCH_TYPE:
            this.handleFetch(action, dispatch);
            action.meta.nm = true;
            return next(action);
          case RECEIVE_DELETE_TYPE:
          case RECEIVE_MUTATE_TYPE:
          case RECEIVE_TYPE:
            // only receive after new state is computed
            return next(action).then(() => {
              if (action.meta.url in this.fetched) {
                this.handleReceive(action);
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
  });

  /** Ensures only one request for a given url is in flight at any time
   *
   * Uses url as key to either retrieve in-flight promise, or if not
   * create a new promise and call fetch.
   *
   * Note: The new promise is not actually tied to fetch at all,
   * but is resolved when the expected 'recieve' action is processed.
   * This ensures promises are resolved only once their data is processed
   * by the reducer.
   */
  protected throttle(url: string, fetch: () => Promise<any>) {
    // we're already fetching so reuse the promise
    if (url in this.fetched) {
      return this.fetched[url];
    }

    this.fetched[url] = new Promise((resolve, reject) => {
      this.resolvers[url] = resolve;
      this.rejectors[url] = reject;
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

    return this.fetched[url];
  }
}
