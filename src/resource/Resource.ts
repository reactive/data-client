import request from 'superagent';
import { schema, Schema } from 'normalizr';
import { memoize, isEmpty } from 'lodash';
import qs from 'qs';
import { AbstractInstanceType, Method } from '../types';
import { makeSingle, makeList } from '../state/selectors';

const getSchema: <T extends typeof Resource>(M: T) => schema.Entity = memoize(
  <T extends typeof Resource>(M: T) => {
    return new schema.Entity(
      M.getKey(),
      {},
      {
        idAttribute: (value, parent, key) => {
          return (M.pk(value) || key).toString();
        },
        processStrategy: value => {
          return M.fromJS(value);
        },
        mergeStrategy: (a, b) => b,
      },
    );
  },
);

/** Represents an entity to be retrieved from a server. Typically 1:1 with a url endpoint. */
export default abstract class Resource {
  // typescript todo: require subclasses to implement
  /** Used as base of url construction */
  static readonly urlRoot: string;
  /** A function to mutate all requests for fetch */
  static fetchPlugin?: request.Plugin;
  /** A unique identifier for this Resource */
  abstract pk(): string | number | null;

  // to trick normalizr into thinking we're Immutable.js does it doesn't copy
  private __ownerID = 1337;

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
    searchParams?: Readonly<object>,
  ): string {
    const queryString =
      searchParams && !isEmpty(searchParams)
        ? `?${qs.stringify(searchParams, {
            indices: false,
            sort: a => a,
            strictNullHandling: true,
          })}`
        : '';
    return `${this.urlRoot}${queryString}`;
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
  static getSchema<T extends typeof Resource>(this: T) {
    return getSchema(this);
  }

  // TODO: memoize these so they can be referentially compared
  /** Shape to get a single entity */
  static singleRequest<T extends typeof Resource>(this: T) {
    const self = this;
    return {
      select: makeSingle(self),
      schema: self.getSchema(),
      getUrl(params: Readonly<object>) {
        return self.url(params);
      },
      fetch(url: string, body?: object) {
        return self.fetch('get', url, body);
      },
      mutate: false,
    };
  }

  /** Shape to get a list of entities */
  static listRequest<T extends typeof Resource>(this: T) {
    const self = this;
    return {
      select: makeList(self),
      schema: [self.getSchema()] as Schema,
      getUrl(params: object) {
        return self.listUrl(params);
      },
      fetch(url: string, body?: object) {
        return self.fetch('get', url, body);
      },
      mutate: false,
    };
  }
  /** Shape to create a new entity (post) */
  static createRequest<T extends typeof Resource>(this: T) {
    const self = this;
    return {
      select: makeSingle(self),
      schema: self.getSchema(),
      getUrl(p: object | void) {
        return self.listUrl();
      },
      fetch(url: string, body: Partial<AbstractInstanceType<T>>) {
        return self.fetch('post', url, body);
      },
      mutate: true,
    };
  }
  /** Shape to update an existing entity (put) */
  static updateRequest<T extends typeof Resource>(this: T) {
    const self = this;
    return {
      select: makeSingle(self),
      schema: self.getSchema(),
      getUrl(params: object) {
        return self.url(params);
      },
      fetch(url: string, body: Partial<AbstractInstanceType<T>>) {
        return self.fetch('put', url, body);
      },
      mutate: true,
    };
  }
  /** Shape to update a subset of fields of an existing entity (patch) */
  static partialUpdateRequest<T extends typeof Resource>(this: T) {
    const self = this;
    return {
      select: makeSingle(self),
      schema: self.getSchema(), //TODO: change merge strategy in case we want to handle partial returns
      getUrl(params: Readonly<object>) {
        return self.url(params);
      },
      fetch(url: string, body: Partial<AbstractInstanceType<T>>) {
        return self.fetch('patch', url, body);
      },
      mutate: true,
    };
  }
  /** Shape to delete an entity (delete) */
  static deleteRequest<T extends typeof Resource>(this: T) {
    const self = this;
    return {
      select: () => null,
      schema: {},
      getUrl(params: object) {
        return self.url(params);
      },
      fetch(url: string) {
        return self.fetch('delete', url);
      },
      mutate: true,
    };
  }
}
