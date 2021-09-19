import type { ActionTypes } from '@rest-hooks/core/types';
import type { EndpointInterface, ResolveType } from '@rest-hooks/endpoint';
import createInvalidate from '@rest-hooks/core/controller/createInvalidate';
import createFetch from '@rest-hooks/core/controller/createFetch';
import createReset from '@rest-hooks/core/controller/createReset';
import createReceive from '@rest-hooks/core/controller/createReceive';
import {
  createUnsubscription,
  createSubscription,
} from '@rest-hooks/core/controller/createSubscription';
import type { EndpointUpdateFunction } from '@rest-hooks/core/controller/types';
import type { DenormalizeCache } from '@rest-hooks/normalizr';

type RHDispatch = (value: ActionTypes) => Promise<void>;

interface ConstructorProps {
  dispatch?: RHDispatch;
  globalCache?: DenormalizeCache;
}

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/Controller
 */
export default class Controller {
  declare readonly dispatch: RHDispatch;
  declare readonly globalCache: DenormalizeCache;

  constructor({
    dispatch = () => Promise.reject('dispatch not set'),
    globalCache = {
      entities: {},
      results: {},
    },
  }: ConstructorProps = {}) {
    this.dispatch = dispatch;
    this.globalCache = globalCache;
  }

  /*************** Action Dispatchers ***************/

  /**
   * Fetches the endpoint with given args, updating the Rest Hooks cache with the response or error upon completion.
   * @see https://resthooks.io/docs/api/Controller#fetch
   */
  fetch = <
    E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): ReturnType<E> => {
    const action = createFetch(endpoint, {
      args,
    });
    this.dispatch(action);

    return action.meta.promise as ReturnType<E>;
  };

  /**
   * Forces refetching and suspense on useResource with the same Endpoint and parameters.
   * @see https://resthooks.io/docs/api/Controller#invalidate
   */
  invalidate = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null
      ? this.dispatch(
          createInvalidate(endpoint, {
            args: args as readonly [...Parameters<E>],
          }),
        )
      : Promise.resolve();

  /**
   * Resets the entire Rest Hooks cache. All inflight requests will not resolve.
   * @see https://resthooks.io/docs/api/Controller#resetEntireStore
   */
  resetEntireStore = (): Promise<void> => this.dispatch(createReset());

  /**
   * Stores response in cache for given Endpoint and args.
   * @see https://resthooks.io/docs/api/Controller#receive
   */
  receive = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, any]
  ): Promise<void> => {
    const response: ResolveType<E> = rest[rest.length - 1];
    const action = createReceive(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
    });
    return this.dispatch(action);
  };

  /**
   * Stores the result of Endpoint and args as the error provided.
   * @see https://resthooks.io/docs/api/Controller#receiveError
   */
  receiveError = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, Error]
  ): Promise<void> => {
    const response: Error = rest[rest.length - 1];
    const action = createReceive(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
      error: true,
    });
    return this.dispatch(action);
  };

  /**
   * Marks a new subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#subscribe
   */
  subscribe = <E extends EndpointInterface & { sideEffect: undefined }>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null
      ? this.dispatch(
          createSubscription(endpoint, {
            args: args as readonly [...Parameters<E>],
          }),
        )
      : Promise.resolve();

  /**
   * Marks completion of subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#unsubscribe
   */
  unsubscribe = <E extends EndpointInterface & { sideEffect: undefined }>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null
      ? this.dispatch(
          createUnsubscription(endpoint, {
            args: args as readonly [...Parameters<E>],
          }),
        )
      : Promise.resolve();

  /*************** More ***************/

  /* TODO:
  abort = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void>

  getResponse = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>, State<unknown>]
  ): [value, expiresAt]

  getError = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>, State<unknown>]
  ): error

  */
}
