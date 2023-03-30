import type { EndpointInterface } from '@rest-hooks/normalizr';

import BaseController, {
  CompatibleDispatch,
  GenericDispatch,
} from './BaseController.js';
import createFetch from './createFetch.js';
import type { EndpointUpdateFunction } from './types.js';

export default class Controller<
  D extends GenericDispatch = CompatibleDispatch,
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
  ): ReturnType<E> => {
    const action = createFetch(endpoint, {
      args,
    });
    this.dispatch(action);

    return action.meta.promise as ReturnType<E>;
  };
}

export * from './BaseController.js';
