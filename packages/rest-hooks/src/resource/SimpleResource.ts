import { FlatEntity } from '@rest-hooks/core';
import type {
  FetchOptions,
  AbstractInstanceType,
  ReadShape,
  MutateShape,
} from '@rest-hooks/core';

import { SchemaDetail, SchemaList } from './types';
import { NotImplementedError } from './errors';
import paramsToString from './paramsToString';
import { schemas } from '..';

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
    searchParams: Readonly<Record<string, string | number>> = {},
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
    const init = this.getFetchInit({ method: 'GET' });
    return {
      type: 'read',
      schema: this,
      options,
      getFetchKey,
      fetch: (params: Readonly<object>) => {
        return this.fetch(this.url(params), init);
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
    const init = this.getFetchInit({ method: 'GET' });
    return {
      type: 'read',
      schema: [this],
      options,
      getFetchKey,
      fetch: (params: Readonly<Record<string, string | number>>) => {
        return this.fetch(this.listUrl(params), init);
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
    const init = this.getFetchInit({ method: 'POST' });
    return {
      type: 'mutate',
      schema: this,
      options,
      getFetchKey: (params: Readonly<Record<string, string>>) => {
        return 'POST ' + this.listUrl(params);
      },
      fetch: (
        params: Readonly<Record<string, string | number>>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch(this.listUrl(params), {
          ...init,
          body: JSON.stringify(body),
        });
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
    const init = this.getFetchInit({ method: 'PUT' });
    return {
      type: 'mutate',
      schema: this,
      options,
      getFetchKey: (params: object) => {
        return 'PUT ' + this.url(params);
      },
      fetch: (
        params: Readonly<object>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch(this.url(params), {
          ...init,
          body: JSON.stringify(body),
        });
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
    const init = this.getFetchInit({ method: 'PATCH' });
    return {
      type: 'mutate',
      schema: this,
      options,
      getFetchKey: (params: Readonly<object>) => {
        return 'PATCH ' + this.url(params);
      },
      fetch: (
        params: Readonly<object>,
        body: Partial<AbstractInstanceType<T>>,
      ) => {
        return this.fetch(this.url(params), {
          ...init,
          body: JSON.stringify(body),
        });
      },
    };
  }

  /** Shape to delete an entity (delete) */
  static deleteShape<T extends typeof SimpleResource>(
    this: T,
  ): MutateShape<schemas.Delete<T>, Readonly<object>, undefined> {
    const options = this.getFetchOptions();
    const init = this.getFetchInit({ method: 'DELETE' });
    return {
      type: 'mutate',
      schema: new schemas.Delete(this),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch(this.url(params), init).then(() => params);
      },
    };
  }
}

// We're only allowing this to get set for descendants but
// by default we want Typescript to treat it as readonly.
Object.defineProperty(SimpleResource.prototype, 'url', {
  set(url: string) {
    this.__url = url;
  },
});
