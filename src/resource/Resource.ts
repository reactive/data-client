import request from 'superagent';
import { memoize } from 'lodash';
import { AbstractInstanceType, Method } from '../types';

import { ReadShape, MutateShape, DeleteShape } from './types'
import { schemas, SchemaBase, SchemaArray } from './normal'

const getEntitySchema: <T extends typeof Resource>(M: T) => schemas.Entity<AbstractInstanceType<T>> = memoize(
  <T extends typeof Resource>(M: T) => {
    const e =  new schemas.Entity(
      M.getKey(),
      {},
      {
        idAttribute: (value, parent, key) => {
          return (M.pk(value) || key).toString();
        },
        processStrategy: (value) => {
          return M.fromJS(value);
        },
        mergeStrategy: (a, b) => b,
      },
    );
    // TODO: long term figure out a plan to actually denormalize
    (e as any).denormalize = function denormalize(entity: any) {
      return entity;
    }
    return e;
  },
) as any;
/** Represents an entity to be retrieved from a server. Typically 1:1 with a url endpoint. */
export default abstract class Resource {
  // typescript todo: require subclasses to implement
  /** Used as base of url construction */
  static readonly urlRoot: string;
  /** A function to mutate all requests for fetch */
  static fetchPlugin?: request.Plugin;
  /** A unique identifier for this Resource */
  abstract pk(): string | number | null;

  /** Resource factory. Takes an object of properties to assign to Resource. */
  static fromJS<T extends typeof Resource>(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ) {
    if (this === Resource)
      throw new Error('cannot construct on abstract types');
    // we type guarded abstract case above, so ok to force typescript to allow constructor call
    const instance = new (this as any)(props) as AbstractInstanceType<T>;
    Object.assign(instance, props);
    // to trick normalizr into thinking we're Immutable.js does it doesn't copy
    Object.defineProperty(instance, '__ownerID', {
      value: 1337,
      writable: false,
    })
    return instance;
  }

  static toString<T extends typeof Resource>(this: T) {
    return `this.name::${this.urlRoot}`;
  }

  /** Returns the globally unique identifier for this Resource */
  static getKey<T extends typeof Resource>(this: T) {
    return this.urlRoot;
  }

  /** A unique identifier for this Resource */
  static pk<T extends typeof Resource>(
    this: T,
    params: Partial<AbstractInstanceType<T>>,
  ): string | number | null {
    return this.prototype.pk.call(params);
  }

  /** URL to find this Resource */
  get url(): string {
    // typescript thinks constructor is just a function
    const S = this.constructor as typeof Resource;
    return S.url(this);
  }

  /** Get the url for a Resource
   *
   * Default implementation conforms to commoon REST patterns
  */
  static url<T extends typeof Resource>(
    this: T,
    urlParams?: Partial<AbstractInstanceType<T>>,
  ): string {
    if (urlParams) {
      if (
        urlParams.hasOwnProperty('url') &&
        urlParams.url &&
        typeof urlParams.url === 'string'
      ) {
        return urlParams.url;
      }
      if (this.pk(urlParams) !== null) {
        return `${this.urlRoot}${this.pk(urlParams)}`;
      }
    }
    return this.urlRoot;
  }

  /** Get the url for many Resources
   *
   * Default implementation conforms to common REST patterns
  */
  static listUrl<T extends typeof Resource>(
    this: T,
    searchParams?: Readonly<Record<string, string | number>>,
  ): string {
    if (searchParams && Object.keys(searchParams).length) {
      const params = new URLSearchParams(searchParams as any);
      params.sort();
      return `${this.urlRoot}?${params.toString()}`;
    }
    return this.urlRoot;
  }

  /** Perform network request and resolve with json body */
  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>,
  ) {
    let req = request[method](url).on('error', () => {});
    if (this.fetchPlugin) req = req.use(this.fetchPlugin);
    if (body) req = req.send(body);
    const json = (await req).body;
    return json;
  }

  /** Get the entity schema defining  */
  static getEntitySchema<T extends typeof Resource>(this: T) {
    return getEntitySchema(this);
  }

  // TODO: memoize these so they can be referentially compared
  /** Shape to get a single entity */
  static singleRequest<T extends typeof Resource>(this: T): ReadShape<SchemaBase<AbstractInstanceType<T>>> {
    const self = this;
    const getUrl = (params: Readonly<object>) => {
      return this.url(params);
    };
    const schema: SchemaBase<AbstractInstanceType<T>> = this.getEntitySchema();
    return {
      type: 'read',
      schema,
      getUrl,
      fetch(url: string, body?: Readonly<object>) {
        return self.fetch('get', url, body);
      },
    };
  }

  /** Shape to get a list of entities */
  static listRequest<T extends typeof Resource>(this: T): ReadShape<SchemaArray<AbstractInstanceType<T>>> {
    const self = this;
    const getUrl = (params: Readonly<Record<string, string>>) => {
      return this.listUrl(params);
    };
    const schema: SchemaArray<AbstractInstanceType<T>> = [this.getEntitySchema()];
    return {
      type: 'read',
      schema,
      getUrl,
      fetch(url: string, body?: Readonly<object>) {
        return self.fetch('get', url, body);
      },
    };
  }
  /** Shape to create a new entity (post) */
  static createRequest<T extends typeof Resource>(this: T): MutateShape<SchemaBase<AbstractInstanceType<T>>, Readonly<object>, Partial<AbstractInstanceType<T>>> {
    const self = this;
    return {
      type: 'mutate',
      schema: self.getEntitySchema(),
      getUrl(params: Readonly<Record<string, string>>) {
        return self.listUrl(params);
      },
      fetch(url: string, body: Partial<AbstractInstanceType<T>>) {
        return self.fetch('post', url, body);
      },
    };
  }
  /** Shape to update an existing entity (put) */
  static updateRequest<T extends typeof Resource>(this: T): MutateShape<SchemaBase<AbstractInstanceType<T>>, Readonly<object>, Partial<AbstractInstanceType<T>>> {
    const self = this;
    return {
      type: 'mutate',
      schema: self.getEntitySchema(),
      getUrl(params: object) {
        return self.url(params);
      },
      fetch(url: string, body: Partial<AbstractInstanceType<T>>) {
        return self.fetch('put', url, body);
      },
    };
  }
  /** Shape to update a subset of fields of an existing entity (patch) */
  static partialUpdateRequest<T extends typeof Resource>(this: T): MutateShape<SchemaBase<AbstractInstanceType<T>>, Readonly<object>, Partial<AbstractInstanceType<T>>> {
    const self = this;
    return {
      type: 'mutate',
      schema: self.getEntitySchema(), //TODO: change merge strategy in case we want to handle partial returns
      getUrl(params: Readonly<object>) {
        return self.url(params);
      },
      fetch(url: string, body: Partial<AbstractInstanceType<T>>) {
        return self.fetch('patch', url, body);
      },
    };
  }
  /** Shape to delete an entity (delete) */
  static deleteRequest<T extends typeof Resource>(this: T): DeleteShape<schemas.Entity<AbstractInstanceType<T>>, Readonly<object>> {
    const self = this;
    return {
      type: 'delete',
      schema: self.getEntitySchema(),
      getUrl(params: object) {
        return self.url(params);
      },
      fetch(url: string) {
        return self.fetch('delete', url);
      },
    };
  }
}
