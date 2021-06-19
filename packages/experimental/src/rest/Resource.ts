import type { SchemaDetail, SchemaList } from '@rest-hooks/endpoint';
import type { AbstractInstanceType } from '@rest-hooks/normalizr';
import { schema } from '@rest-hooks/normalizr';

import getArrayPath from './getArrayPath';
import BaseResource from './BaseResource';
import type { RestEndpoint, Paginatable } from './types';

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
  ): Paginatable<
    RestEndpoint<
      (this: RestEndpoint, params: any) => Promise<any>,
      SchemaList<AbstractInstanceType<T>>,
      undefined
    >
  > {
    return this.memo('#list', () =>
      this.endpoint().extend({
        schema: [this],
        url: this.listUrl.bind(this),
        paginated(
          this: any,
          removeCursor: (...args: Parameters<typeof this>) => any,
        ) {
          // infer path from schema. if schema is undefined assume array is top level
          const path = getArrayPath(this.schema);
          if (path === false) throw new Error('schema has no array');

          return this.extend({
            update: (newPage: any, ...args: any) => ({
              [this.key(...removeCursor(...args))]: (existing: any) => {
                const set = new Set([
                  ...getIn(existing, path),
                  ...getIn(newPage, path),
                ]);
                // sorted?
                return setIn(newPage, path, [...set.values()]);
              },
            }),
          });
        },
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
          return endpoint.fetch
            .call(this, params)
            .then(res => (res ? res : params));
        },
        method: 'DELETE',
        schema: new schema.Delete(this),
      }),
    );
  }
}

const getIn = (results: any, path: string[]) => {
  let cur = results;
  for (const p of path) {
    cur = cur[p];
  }
  return cur;
};

const setIn = (results: any, path: string[], values: any[]) => {
  if (path.length === 0) return values;
  const newResults = { ...results };
  let cur = newResults;
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    cur = cur[p] = { ...cur[p] };
  }
  cur[path[path.length - 1]] = values;
  return newResults;
};
