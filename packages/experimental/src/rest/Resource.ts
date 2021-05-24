import { schema } from '@rest-hooks/normalizr';

import BaseResource from './BaseResource';

import type { RestEndpoint } from './types';
import type { SchemaDetail, SchemaList } from '@rest-hooks/endpoint';
import type { AbstractInstanceType } from '@rest-hooks/normalizr';

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
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
    return this.memo('#detail', () =>
      this.endpoint().extend({
        schema: this,
      }),
    );
  }

  /** Endpoint to get a list of entities */
  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    SchemaList<AbstractInstanceType<T>>,
    undefined
  > {
    return this.memo('#list', () =>
      this.endpoint().extend({
        schema: [this],
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to create a new entity (post) */
  static create<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    //Partial<AbstractInstanceType<T>>
    return this.memo('#create', () =>
      this.endpointMutate().extend({
        schema: this,
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to update an existing entity (put) */
  static update<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return this.memo('#update', () =>
      this.endpointMutate().extend({
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
    return this.memo('#partialUpdate', () =>
      this.endpointMutate().extend({
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
          return endpoint.fetch.call(this, params).then(() => params);
        },
        method: 'DELETE',
        schema: new schema.Delete(this),
      }),
    );
  }
}
