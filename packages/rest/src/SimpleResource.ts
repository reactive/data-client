import { FlatEntity, schema } from '@rest-hooks/normalizr';
import type { AbstractInstanceType } from '@rest-hooks/normalizr';
import { Endpoint } from '@rest-hooks/endpoint';
import type {
  EndpointExtraOptions,
  SchemaDetail,
  SchemaList,
} from '@rest-hooks/endpoint';

import { ReadShape, MutateShape } from './legacy';
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

  protected static endpoint() {
    const init = this.getFetchInit({ method: 'GET' });
    const instanceFetch = this.fetch.bind(this);
    const url = this.url.bind(this);

    return memoThis(
      '#endpoint',
      () =>
        new Endpoint(
          function (params: Readonly<object>) {
            return instanceFetch(this.url(params), this.init);
          },
          {
            ...this.getEndpointExtra(),
            key: function (this: any, params: Readonly<object>) {
              return `${this.init.method} ${this.url(params)}`;
            },
            url,
            init,
          },
        ),
    );
  }

  protected static endpointMutate() {
    const instanceFetch = this.fetch.bind(this);
    return memoThis('#endpointMutate', () =>
      this.endpoint().extend({
        fetch(
          this: any,
          params: Readonly<object>,
          body?: RequestInit['body'] | Record<string, any>,
        ) {
          if (isPojo(body)) {
            body = JSON.stringify(body);
          }
          const init = body ? { ...this.init, body } : this.init;
          return instanceFetch(this.url(params), init);
        },
        sideEffect: true,
      }),
    );
  }

  // TODO: memoize these so they can be referentially compared
  /** Endpoint to get a single entity */
  static detail<T extends typeof SimpleResource>(this: T) {
    return memoThis('#detail', () =>
      this.endpoint().extend({
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
      }),
    );
  }

  /** Endpoint to get a list of entities */
  static list<T extends typeof SimpleResource>(this: T) {
    return memoThis('#list', () =>
      this.endpoint().extend({
        schema: [this] as SchemaList<Readonly<AbstractInstanceType<T>>>,
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to create a new entity (post) */
  static create<T extends typeof SimpleResource>(this: T) {
    //Partial<AbstractInstanceType<T>>
    return memoThis('#create', () =>
      this.endpointMutate().extend({
        init: this.getFetchInit({ method: 'POST' }),
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
        url: this.listUrl.bind(this),
      }),
    );
  }

  /** Endpoint to update an existing entity (put) */
  static update<T extends typeof SimpleResource>(this: T) {
    return memoThis('#update', () =>
      this.endpointMutate().extend({
        init: this.getFetchInit({ method: 'PUT' }),
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
      }),
    );
  }

  /** Endpoint to update a subset of fields of an existing entity (patch) */
  static partialUpdate<T extends typeof SimpleResource>(this: T) {
    return memoThis('#partialUpdate', () =>
      this.endpointMutate().extend({
        init: this.getFetchInit({ method: 'PATCH' }),
        schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
      }),
    );
  }

  /** Endpoint to delete an entity (delete) */
  static delete<T extends typeof SimpleResource>(this: T) {
    const endpoint = this.endpointMutate();
    return memoThis('#delete', () =>
      endpoint.extend({
        fetch(params: Readonly<object>) {
          return endpoint.fetch.call(this, params).then(() => params);
        },
        init: this.getFetchInit({ method: 'DELETE' }),
        schema: new schema.Delete(this),
      }),
    );
  }

  /** @deprecated */
  static getFetchOptions() {
    /* istanbul ignore next */
    return this.getEndpointExtra();
  }

  /** @deprecated */
  static detailShape<T extends typeof SimpleResource>(
    this: T,
  ): ReadShape<SchemaDetail<Readonly<AbstractInstanceType<T>>>> {
    const endpoint = this.detail();
    const fetch = endpoint.fetch.bind(endpoint as any);
    return { ...endpoint, fetch };
  }

  /** @deprecated */
  static listShape<T extends typeof SimpleResource>(
    this: T,
  ): ReadShape<SchemaList<Readonly<AbstractInstanceType<T>>>> {
    const endpoint = this.list();
    const fetch = endpoint.fetch.bind(endpoint as any);
    return { ...endpoint, fetch };
  }

  /** @deprecated */
  static createShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    const endpoint = this.create();
    const fetch = endpoint.fetch.bind(endpoint as any);
    return { ...endpoint, fetch };
  }

  /** @deprecated */
  static updateShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    const endpoint = this.update();
    const fetch = endpoint.fetch.bind(endpoint as any);
    return { ...endpoint, fetch };
  }

  /** @deprecated */
  static partialUpdateShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    const endpoint = this.partialUpdate();
    const fetch = endpoint.fetch.bind(endpoint as any);
    return { ...endpoint, fetch };
  }

  /** @deprecated */
  static deleteShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<schema.Delete<T>, Readonly<object>, unknown> {
    const endpoint = this.delete();
    const fetch = endpoint.fetch.bind(endpoint as any);
    return { ...endpoint, fetch };
  }
}

// We're only allowing this to get set for descendants but
// by default we want Typescript to treat it as readonly.
Object.defineProperty(SimpleResource.prototype, 'url', {
  set(url: string) {
    this.__url = url;
  },
});

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

function isPojo(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}

function memoThis<T>(name: string, value: () => T): T {
  if (!(name in self)) {
    (SimpleResource as any)[name] = value();
  }
  return (SimpleResource as any)[name] as T;
}
