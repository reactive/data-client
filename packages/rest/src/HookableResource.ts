import type {
  SchemaDetail,
  SchemaList,
  AbstractInstanceType,
  Schema,
} from '@rest-hooks/endpoint';
import { schema } from '@rest-hooks/endpoint';
import BaseResource from '@rest-hooks/rest/BaseResource';
import type { RestEndpoint } from '@rest-hooks/rest/types';

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 * @see https://resthooks.io/docs/api/resource
 */
export default abstract class HookableResource extends BaseResource {
  /** Init options for fetch - run at render */
  static useFetchInit(init: Readonly<RequestInit>): RequestInit {
    return init;
  }

  /** Used to memoize endpoint methods
   *
   * Relies on existance of runInit() member.
   */
  protected static useMemo<
    T extends { extend: (...args: any) => any } & { useFetchInit(): T },
  >(name: string, construct: () => T): T {
    return this.memo(name, construct).useFetchInit() as T;
  }

  protected static endpoint(): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    Schema | undefined,
    undefined
  > & { useFetchInit: (this: any) => any } {
    // eslint-disable-next-line
    const resource = this;
    return super.endpoint().extend({
      useFetchInit(this: any) {
        this.fetchInit = resource.useFetchInit(this.fetchInit);
        return this;
      },
    });
  }

  /** Base endpoint but for sideEffects */
  protected static endpointMutate(): RestEndpoint<
    (this: RestEndpoint, params: any, body?: any) => Promise<any>,
    Schema | undefined,
    true
  > & { useFetchInit: (this: any) => any } {
    return super.endpointMutate() as any;
  }

  /** Endpoint to get a single entity */
  static useDetail<T extends typeof HookableResource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    undefined
  > {
    return this.useMemo('#detail', () =>
      this.endpoint().extend({
        schema: this,
      }),
    );
  }

  /** Endpoint to get a list of entities */
  static useList<T extends typeof HookableResource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    SchemaList<AbstractInstanceType<T>>,
    undefined
  > {
    return this.useMemo('#list', () =>
      this.endpoint().extend({
        schema: [this],
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to create a new entity (post) */
  static useCreate<T extends typeof HookableResource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return this.useMemo('#create', () =>
      this.endpointMutate().extend({
        schema: this,
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to update an existing entity (put) */
  static useUpdate<T extends typeof HookableResource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return this.useMemo('#update', () =>
      this.endpointMutate().extend({
        method: 'PUT',
        schema: this,
      }),
    );
  }

  /** Endpoint to update a subset of fields of an existing entity (patch) */
  static usePartialUpdate<T extends typeof HookableResource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any, body: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return this.useMemo('#partialUpdate', () =>
      this.endpointMutate().extend({
        method: 'PATCH',
        schema: this,
      }),
    );
  }

  /** Endpoint to delete an entity (delete) */
  static useDelete<T extends typeof HookableResource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    schema.Delete<T>,
    true
  > {
    return this.useMemo('#delete', () => {
      const endpoint = this.endpointMutate();
      return endpoint.extend({
        fetch(this: RestEndpoint, params: any) {
          return endpoint.fetch
            .call(this, params)
            .then(res => (res && Object.keys(res).length ? res : params));
        },
        method: 'DELETE',
        schema: new schema.Delete(this),
      });
    });
  }
}
