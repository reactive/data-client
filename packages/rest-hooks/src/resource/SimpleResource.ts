import { AbstractInstanceType, Method, FetchOptions } from 'rest-hooks/types';
import { NotImplementedError, Entity } from '@rest-hooks/normalizr';

import { ReadShape, MutateShape, DeleteShape } from './shapes';
import { SchemaDetail, SchemaList } from './normal';
import paramsToString from './paramsToString';

/** Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 *
 * This can be a useful organization for many REST-like API patterns.
 */
export default abstract class SimpleResource extends Entity {
  // typescript todo: require subclasses to implement
  /** Used as base of url construction */
  static readonly urlRoot: string;

  static toString() {
    return `${this.name}::${this.urlRoot}`;
  }

  /** Returns the globally unique identifier for this SimpleResource */
  static get key(): string {
    return this.getKey();
  }

  /** URL to find this SimpleResource */
  get url(): string {
    if (this.__url !== undefined) return this.__url;
    // typescript thinks constructor is just a function
    const Static = this.constructor as typeof SimpleResource;
    return Static.url(this);
  }

  private declare __url?: string;

  /** Get the url for a SimpleResource
   *
   * Default implementation conforms to common REST patterns
   */
  static url<T extends typeof SimpleResource>(
    this: T,
    urlParams: Readonly<Record<string, any>>,
  ): string {
    if (
      Object.prototype.hasOwnProperty.call(urlParams, 'url') &&
      urlParams.url &&
      typeof urlParams.url === 'string'
    ) {
      return urlParams.url;
    }
    if (this.pk(urlParams as any) !== undefined) {
      if (this.urlRoot.endsWith('/')) {
        return `${this.urlRoot}${this.pk(urlParams as any)}`;
      }
      return `${this.urlRoot}/${this.pk(urlParams as any)}`;
    }
    return this.urlRoot;
  }

  /** Get the url for many SimpleResources
   *
   * Default implementation conforms to common REST patterns
   */
  static listUrl(
    searchParams: Readonly<Record<string, string | number>> = {},
  ): string {
    if (Object.keys(searchParams).length) {
      return `${this.urlRoot}?${paramsToString(searchParams)}`;
    }
    return this.urlRoot;
  }

  /** Perform network request and resolve with json body */
  static fetch(
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ): Promise<any> {
    // typescript currently doesn't allow abstract static methods
    throw new NotImplementedError();
  }

  /** Perform network request and resolve with HTTP Response */
  static fetchResponse(
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ): Promise<Response> {
    // typescript currently doesn't allow abstract static methods
    throw new NotImplementedError();
  }

  /** Get the entity schema defining  */
  static getEntitySchema<T extends typeof SimpleResource>(this: T) {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'getEntitySchema() is deprecated - use asSchema() instead.',
      );
    }
    return this.asSchema();
  }

  /** Get the request options for this SimpleResource  */
  static getFetchOptions(): FetchOptions | undefined {
    return;
  }

  // TODO: memoize these so they can be referentially compared
  /** Shape to get a single entity */
  static detailShape<T extends typeof SimpleResource>(
    this: T,
  ): ReadShape<SchemaDetail<Readonly<AbstractInstanceType<T>>>> {
    const getFetchKey = (params: Readonly<object>) => {
      return 'GET ' + this.url(params);
    };
    const options = this.getFetchOptions();
    return {
      type: 'read',
      schema: this.asSchema(),
      options,
      getFetchKey,
      fetch: (params: Readonly<object>) => {
        return this.fetch('get', this.url(params));
      },
    };
  }

  /** Shape to get a list of entities */
  static listShape<T extends typeof SimpleResource>(
    this: T,
  ): ReadShape<SchemaList<Readonly<AbstractInstanceType<T>>>> {
    const getFetchKey = (params: Readonly<Record<string, string>>) => {
      return 'GET ' + this.listUrl(params);
    };
    const options = this.getFetchOptions();
    return {
      type: 'read',
      schema: [this.asSchema()],
      options,
      getFetchKey,
      fetch: (params: Readonly<Record<string, string | number>>) => {
        return this.fetch('get', this.listUrl(params));
      },
    };
  }

  /** Shape to create a new entity (post) */
  static createShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    const options = this.getFetchOptions();
    return {
      type: 'mutate',
      schema: this.asSchema(),
      options,
      getFetchKey: (params: Readonly<Record<string, string>>) => {
        return 'POST ' + this.listUrl(params);
      },
      fetch: (
        params: Readonly<Record<string, string | number>>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch('post', this.listUrl(params), body);
      },
    };
  }

  /** Shape to update an existing entity (put) */
  static updateShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    const options = this.getFetchOptions();
    return {
      type: 'mutate',
      schema: this.asSchema(),
      options,
      getFetchKey: (params: object) => {
        return 'PUT ' + this.url(params);
      },
      fetch: (
        params: Readonly<object>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch('put', this.url(params), body);
      },
    };
  }

  /** Shape to update a subset of fields of an existing entity (patch) */
  static partialUpdateShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    const options = this.getFetchOptions();
    return {
      type: 'mutate',
      schema: this.asSchema(),
      options,
      getFetchKey: (params: Readonly<object>) => {
        return 'PATCH ' + this.url(params);
      },
      fetch: (
        params: Readonly<object>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch('patch', this.url(params), body);
      },
    };
  }

  /** Shape to delete an entity (delete) */
  static deleteShape<T extends typeof SimpleResource>(
    this: T,
  ): DeleteShape<any, Readonly<object>> {
    const options = this.getFetchOptions();
    return {
      type: 'delete',
      schema: this.asSchema(),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch('delete', this.url(params));
      },
    };
  }

  /** Returns the globally unique identifier for this SimpleResource */
  static getKey() {
    return this.urlRoot;
  }
}

// We're only allowing this to get set for descendants but
// by default we want Typescript to treat it as readonly.
Object.defineProperty(SimpleResource.prototype, 'url', {
  set(url: string) {
    this.__url = url;
  },
});
