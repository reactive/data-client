import { memoize } from 'lodash';
import { FetchAction, ReceiveAction, MiddlewareAPI } from '../types';

export const RIC: (cb: (...args: any[]) => void, options: any) => void =
  typeof (global as any).requestIdleCallback === 'function'
    ? (global as any).requestIdleCallback
    : cb => global.setTimeout(cb, 0);

/** Handles all async network dispatches
 *
 * Dedupes concurrent requests by keeping track of all fetches in flight
 * and returning existing promises for requests already in flight.
 *
 * Interfaces with store via a redux-compatible middleware.
 */
export default class NetworkManager {
  protected fetched: { [k: string]: Promise<any> } = {};
  protected resolvers: { [k: string]: (value?: any) => void } = {};
  protected rejectors: { [k: string]: (value?: any) => void } = {};
  readonly dataExpiryLength: number;
  readonly errorExpiryLength: number;
  constructor(
    dataExpiryLength: number = 60000,
    errorExpiryLength: number = 1000,
  ) {
    this.dataExpiryLength = dataExpiryLength;
    this.errorExpiryLength = errorExpiryLength;
  }

  /** Ensures all promises are completed by rejecting remaining. */
  cleanup() {
    for (const k in this.rejectors) {
      this.rejectors[k](new Error('Cleaning up Network Manager'));
    }
  }

  /** Clear promise state for a given url */
  protected clear(url: string) {
    delete this.resolvers[url];
    delete this.rejectors[url];
    delete this.fetched[url];
  }

  /** Called when middleware intercepts 'fetch' action.
   *
   * Will then start a promise for a url and potentially start the network
   * fetch.
   *
   * Uses throttle only when instructed by action meta. This is valuable
   * for ensures mutation requests always go through.
   */
  protected handleFetch(action: FetchAction, dispatch: React.Dispatch<any>) {
    const fetch = action.payload;
    const {
      schema,
      url,
      responseType,
      throttle,
      resolve,
      reject,
      options = {},
    } = action.meta;
    const {
      dataExpiryLength = this.dataExpiryLength,
      errorExpiryLength = this.errorExpiryLength,
    } = options;

    const deferedFetch = () =>
      fetch()
        .then(data => {
          const now = Date.now();
          dispatch({
            type: responseType,
            payload: data,
            meta: {
              schema,
              url,
              date: now,
              expiresAt: now + dataExpiryLength,
            },
          });
          return data;
        })
        .catch(error => {
          const now = Date.now();
          dispatch({
            type: responseType,
            payload: error,
            meta: {
              schema,
              url,
              date: now,
              expiresAt: now + errorExpiryLength,
            },
            error: true,
          });
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
    const completePromise = () => {
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
    };
    // TODO: this should call after the reducer has been updated
    // in all concurrent fibers
    RIC(completePromise, { timeout: 1000 });
  }

  /** Attaches NetworkManager to store
   *
   * Intercepts 'fetch' actions to start requests.
   *
   * Resolve/rejects a request when matching 'receive' event
   * is seen.
   */
  getMiddleware = memoize(function<T extends NetworkManager>(this: T) {
    return <R extends React.Reducer<any, any>>({
      dispatch,
    }: MiddlewareAPI<R>) => {
      return (next: React.Dispatch<React.ReducerAction<R>>) => (
        action: React.ReducerAction<R>,
      ) => {
        switch (action.type) {
        case 'fetch':
          this.handleFetch(action, dispatch);
          return;
        case 'purge':
        case 'rpc':
        case 'receive':
          if (action.meta.url in this.fetched) {
            this.handleReceive(action);
          }
          // fallthrough is on purpose
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
    RIC(() => fetch().catch(() => null), { timeout: 500 });

    return this.fetched[url];
  }
}
