import {
  FlatEntity,
  schema,
  ReadShape,
  MutateShape,
  Endpoint,
} from '@rest-hooks/core';
import type {
  AbstractInstanceType,
  EndpointExtraOptions,
} from '@rest-hooks/core';

import { SchemaDetail, SchemaList } from './types';
import { NotImplementedError } from './errors';
import paramsToString from './paramsToString';

/** Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 *
 * This can be a useful organization for many REST-like API patterns.
 */
export default abstract class SimpleResource extends FlatEntity {
  // typescript todo: require subclasses to implement
  /** Used as base of url construction */
  static readonly urlRoot: string;

  static toString() {
    return `${this.name}::${this.urlRoot}`;
  }

  /** Returns the globally unique identifier for this SimpleResource */
  static get key(): string {
    return this.urlRoot;
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
    searchParams: Readonly<Record<string, string | number | boolean>> = {},
  ): string {
    if (Object.keys(searchParams).length) {
      return `${this.urlRoot}?${paramsToString(searchParams)}`;
    }
    return this.urlRoot;
  }

  /** Perform network request and resolve with json body */
  static fetch(input: RequestInfo, init: RequestInit): Promise<any> {
    // typescript currently doesn't allow abstract static methods
    throw new NotImplementedError();
  }

  /** Perform network request and resolve with HTTP Response */
  static fetchResponse(
    input: RequestInfo,
    init: RequestInit,
  ): Promise<Response> {
    // typescript currently doesn't allow abstract static methods
    throw new NotImplementedError();
  }

  /** Init options for fetch */
  static getFetchInit(init: RequestInit): RequestInit {
    return init;
  }

  /** Get the request options for this SimpleResource  */
  static getEndpointExtra(): EndpointExtraOptions | undefined {
    return;
  }

  /** @deprecated */
  static getFetchOptions() {
    return this.getEndpointExtra();
  }

  // TODO: memoize these so they can be referentially compared
  /** Endpoint to get a single entity */
  static detail<T extends typeof SimpleResource>(this: T) {
    const init = this.getFetchInit({ method: 'GET' });

    return new Endpoint(
      (params: Readonly<object>) => {
        return this.fetch(this.url(params), init);
      },
      {
        ...this.getEndpointExtra(),
        key: (params: Readonly<object>) => {
          return 'GET ' + this.url(params);
        },
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
      },
    );
  }

  /** @deprecated */
  static detailShape<T extends typeof SimpleResource>(
    this: T,
  ): ReadShape<SchemaDetail<Readonly<AbstractInstanceType<T>>>> {
    return this.detail();
  }

  /** Endpoint to get a list of entities */
  static list<T extends typeof SimpleResource>(this: T) {
    const init = this.getFetchInit({ method: 'GET' });

    return new Endpoint(
      (params: Readonly<Record<string, string | number | boolean>>) => {
        return this.fetch(this.listUrl(params), init);
      },
      {
        ...this.getEndpointExtra(),
        key: (params: Readonly<Record<string, string | number | boolean>>) => {
          return 'GET ' + this.listUrl(params);
        },
        schema: [this] as SchemaList<Readonly<AbstractInstanceType<T>>>,
      },
    );
  }

  /** @deprecated */
  static listShape<T extends typeof SimpleResource>(
    this: T,
  ): ReadShape<SchemaList<Readonly<AbstractInstanceType<T>>>> {
    return this.list();
  }

  /** Endpoint to create a new entity (post) */
  static create<T extends typeof SimpleResource>(this: T) {
    const init = this.getFetchInit({ method: 'POST' });

    return new Endpoint(
      (
        params: Readonly<Record<string, string | number | boolean>>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch(this.listUrl(params), {
          ...init,
          body: JSON.stringify(body),
        });
      },
      {
        ...this.getEndpointExtra(),
        key: (params: Readonly<Record<string, string | number | boolean>>) => {
          return 'POST ' + this.listUrl(params);
        },
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
        sideEffect: true,
      },
    );
  }

  /** @deprecated */
  static createShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    return this.create();
  }

  /** Endpoint to update an existing entity (put) */
  static update<T extends typeof SimpleResource>(this: T) {
    const init = this.getFetchInit({ method: 'PUT' });

    return new Endpoint(
      (params: Readonly<object>, body: Partial<AbstractInstanceType<T>>) => {
        return this.fetch(this.url(params), {
          ...init,
          body: JSON.stringify(body),
        });
      },
      {
        ...this.getEndpointExtra(),
        key: (params: Readonly<object>) => {
          return 'PUT ' + this.url(params);
        },
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
        sideEffect: true,
      },
    );
  }

  /** @deprecated */
  static updateShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    return this.update();
  }

  /** Endpoint to update a subset of fields of an existing entity (patch) */
  static partialUpdate<T extends typeof SimpleResource>(this: T) {
    const init = this.getFetchInit({ method: 'PATCH' });

    return new Endpoint(
      (params: Readonly<object>, body: Partial<AbstractInstanceType<T>>) => {
        return this.fetch(this.url(params), {
          ...init,
          body: JSON.stringify(body),
        });
      },
      {
        ...this.getEndpointExtra(),
        key: (params: Readonly<object>) => {
          return 'PATCH ' + this.url(params);
        },
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
        sideEffect: true,
      },
    );
  }

  /** @deprecated */
  static partialUpdateShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    return this.partialUpdate();
  }

  /** Endpoint to delete an entity (delete) */
  static delete<T extends typeof SimpleResource>(this: T) {
    const init = this.getFetchInit({ method: 'DELETE' });

    return new Endpoint(
      (params: Readonly<object>) => {
        return this.fetch(this.url(params), init).then(() => params);
      },
      {
        ...this.getEndpointExtra(),
        key: (params: Readonly<object>) => {
          return 'DELETE ' + this.url(params);
        },
        schema: new schema.Delete(this),
        sideEffect: true,
      },
    );
  }

  /** @deprecated */
  static deleteShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<schema.Delete<T>, Readonly<object>, undefined> {
    return this.delete();
  }
}

// We're only allowing this to get set for descendants but
// by default we want Typescript to treat it as readonly.
Object.defineProperty(SimpleResource.prototype, 'url', {
  set(url: string) {
    this.__url = url;
  },
});
