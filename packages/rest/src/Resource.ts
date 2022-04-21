import type {
  SchemaDetail,
  SchemaList,
  AbstractInstanceType,
} from '@rest-hooks/endpoint';
import { schema } from '@rest-hooks/endpoint';

import BaseResource from './BaseResource.js';
import type { RestEndpoint } from './types.js';

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 * @see https://resthooks.io/docs/api/resource
 */
export default abstract class Resource extends BaseResource {
  /** Endpoint to get a single entity */
  static detail<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    undefined
  > {
    const endpoint = this.endpoint();
    return this.memo('#detail', () =>
      endpoint.extend({
        schema: this,
      }),
    );
  }

  /** Endpoint to get a list of entities */
  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params?: any) => Promise<any>,
    SchemaList<AbstractInstanceType<T>>,
    undefined
  > {
    const endpoint = this.endpoint();
    return this.memo('#list', () =>
      endpoint.extend({
        schema: [this],
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to create a new entity (post) */
  static create<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, first: any, second?: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return this.memo('#create', () => {
      const endpoint = this.endpointMutate();
      const instanceFetch = this.fetch.bind(this);
      return endpoint.extend({
        fetch(...args) {
          return instanceFetch(
            this.url(...args),
            this.getFetchInit(args[args.length - 1]),
          );
        },
        url: (...args) => {
          return args.length > 1 ? this.listUrl(args[0]) : this.listUrl();
        },
        schema: this,
      });
    });
  }

  /** Endpoint to update an existing entity (put) */
  static update<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    const endpoint = this.endpointMutate();
    return this.memo('#update', () =>
      endpoint.extend({
        method: 'PUT',
        schema: this,
      }),
    );
  }

  /** Endpoint to update a subset of fields of an existing entity (patch) */
  static partialUpdate<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    const endpoint = this.endpointMutate();
    return this.memo('#partialUpdate', () =>
      endpoint.extend({
        method: 'PATCH',
        schema: this,
      }),
    );
  }

  /** Endpoint to delete an entity (delete) */
  static delete<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    schema.Delete<T>,
    true
  > {
    const endpoint = this.endpointMutate();
    return this.memo('#delete', () =>
      endpoint.extend({
        fetch(this: RestEndpoint, params: any) {
          return endpoint.fetch
            .call(this, params)
            .then(res => (res && Object.keys(res).length ? res : params));
        },
        method: 'DELETE',
        schema: new schema.Delete(this),
      }),
    );
  }
}
