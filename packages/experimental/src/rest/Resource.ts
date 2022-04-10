import type {
  SchemaDetail,
  SchemaList,
  AbstractInstanceType,
} from '@rest-hooks/endpoint';
import { schema } from '@rest-hooks/endpoint';

import getArrayPath from './getArrayPath';
import BaseResource from './BaseResource';
import type { RestEndpoint, Paginatable } from './types';

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
  ): Paginatable<
    RestEndpoint<
      (this: RestEndpoint, params?: any) => Promise<any>,
      SchemaList<AbstractInstanceType<T>>,
      undefined
    >
  > {
    const endpoint = this.endpoint();
    return this.memo('#list', () =>
      endpoint.extend({
        schema: [this],
        paginated(
          this: any,
          removeCursor: (...args: Parameters<typeof this>) => {
            [k in keyof Parameters<typeof this>]: any;
          },
        ) {
          // infer path from schema. if schema is undefined assume array is top level
          const path = getArrayPath(this.schema);
          if (path === false) throw new Error('schema has no array');

          return this.extend({
            update: (newPage: any, ...args: any) => ({
              [this.key(...removeCursor(...args))]: (existing: any) => {
                const existingList = getIn(existing, path);
                // using set so our lookups are O(1) in case this is large
                const existingSet: Set<string> = new Set(existingList);
                const addedList = getIn(newPage, path).filter(
                  (pk: string) => !existingSet.has(pk),
                );
                const mergedResults: string[] = [...existingList, ...addedList];
                return setIn(existing, path, mergedResults);
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
          return args.length > 1 ? this.url(args[0]) : this.url();
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

const getIn = (results: any, path: string[]): any[] => {
  let cur = results;
  for (const p of path) {
    if (!cur) return [];
    cur = cur[p];
  }
  return cur || [];
};

const setIn = <T>(results: T, path: string[], values: any[]): T => {
  if (path.length === 0) return values as any;
  const newResults = { ...results };
  let cur: any = newResults;
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    cur = cur[p] = { ...cur[p] };
  }
  cur[path[path.length - 1]] = values;
  return newResults;
};
