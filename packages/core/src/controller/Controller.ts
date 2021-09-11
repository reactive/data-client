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
  dispatch: RHDispatch;
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
    dispatch,
    globalCache = {
      entities: {},
      results: {},
    },
  }: ConstructorProps) {
    this.dispatch = dispatch;
    this.globalCache = globalCache;
  }

  /*************** Action Dispatchers ***************/

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

  resetEntireStore = (): Promise<void> => this.dispatch(createReset());

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
}
