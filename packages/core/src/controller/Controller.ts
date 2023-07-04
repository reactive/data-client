import type { EndpointInterface, Denormalize } from '@data-client/normalizr';
import { denormalize } from '@data-client/normalizr';

import BaseController, {
  DataClientDispatch,
  GenericDispatch,
} from './BaseController.js';
import createFetch from './createFetch.js';
import type { EndpointUpdateFunction } from './types.js';

export default class Controller<
  D extends GenericDispatch = DataClientDispatch,
> extends BaseController<D> {
  /**
   * Fetches the endpoint with given args, updating the Rest Hooks cache with the response or error upon completion.
   * @see https://resthooks.io/docs/api/Controller#fetch
   */
  fetch = <
    E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): E['schema'] extends undefined | null
    ? ReturnType<E>
    : Promise<Denormalize<E['schema']>> => {
    const action = createFetch(endpoint, {
      args,
    });
    this.dispatch(action);

    if (endpoint.schema) {
      return action.meta.promise.then(input =>
        denormalize(input, endpoint.schema, {}, args),
      ) as any;
    }
    return action.meta.promise as any;
  };
}

export * from './BaseController.js';
