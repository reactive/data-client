import { memoize } from 'lodash';

import { ReadShape, MutateShape, DeleteShape } from './shapes';
import { schemas, SchemaDetail, SchemaList } from './normal';
import SimpleRecord from './SimpleRecord';

import { AbstractInstanceType, Method, FetchOptions } from '~/types';

/** Represents an entity to be retrieved from a server. Typically 1:1 with a url endpoint. */
export default abstract class SimpleResource extends SimpleRecord {
  // typescript todo: require subclasses to implement
  /** Used as base of url construction */
  static readonly urlRoot: string;
  /** A unique identifier for this SimpleResource */
  abstract pk(): string | number | undefined;

  static toString<T extends typeof SimpleResource>(this: T) {
    return `${this.name}::${this.urlRoot}`;
  }

  /** Returns the globally unique identifier for this SimpleResource */
  static getKey<T extends typeof SimpleResource>(this: T) {
    return this.urlRoot;
  }

  /** A unique identifier for this SimpleResource */
  static pk<T extends typeof SimpleResource>(
    this: T,
    params: Partial<AbstractInstanceType<T>>,
  ): string | number | undefined {
    return this.prototype.pk.call(params);
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
    urlParams?: Partial<AbstractInstanceType<T>>,
  ): string {
    if (urlParams) {
      if (
        Object.prototype.hasOwnProperty.call(urlParams, 'url') &&
        urlParams.url &&
        typeof urlParams.url === 'string'
      ) {
        return urlParams.url;
      }
      if (this.pk(urlParams) !== null) {
        if (this.urlRoot.endsWith('/')) {
          return `${this.urlRoot}${this.pk(urlParams)}`;
        }
        return `${this.urlRoot}/${this.pk(urlParams)}`;
      }
    }
    return this.urlRoot;
  }

  /** Get the url for many SimpleResources
   *
   * Default implementation conforms to common REST patterns
   */
  static listUrl<T extends typeof SimpleResource>(
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
  static fetch(
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ): Promise<any> {
    // typescript currently doesn't allow abstract static methods
    throw new Error('not implemented');
  }

  static resolveFetchData(response: Response): Promise<any> {
    throw new Error('not implemented');
  }

  /** Get the entity schema defining  */
  static getEntitySchema<T extends typeof SimpleResource>(this: T) {
    return getEntitySchema(this);
  }

  /** Get the request options for this SimpleResource  */
  static getFetchOptions<T extends typeof SimpleResource>(
    this: T,
  ): FetchOptions | undefined {
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
    const schema = this.getEntitySchema();
    const options = this.getFetchOptions();
    return {
      type: 'read',
      schema,
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
    const schema = [this.getEntitySchema()];
    const options = this.getFetchOptions();
    return {
      type: 'read',
      schema,
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
      schema: this.getEntitySchema(),
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
      schema: this.getEntitySchema(),
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
      schema: this.getEntitySchema(), //TODO: change merge strategy in case we want to handle partial returns
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
      schema: this.getEntitySchema(),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch('delete', this.url(params));
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

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
  // for those not using TypeScript this is a good catch to ensure they are defining
  // the abstract members
  SimpleResource.fromJS = function fromJS<T extends typeof SimpleRecord>(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ): Readonly<AbstractInstanceType<T>> {
    if ((this as any).prototype.pk === undefined)
      throw new Error('cannot construct on abstract types');
    return SimpleRecord.fromJS.call(this, props) as any;
  };
}

type GetEntitySchema = <T extends typeof SimpleResource>(
  ResourceClass: T,
) => schemas.Entity<Readonly<AbstractInstanceType<T>>>;

const getEntitySchema: GetEntitySchema = memoize(
  <T extends typeof SimpleResource>(ResourceClass: T) => {
    const e = new schemas.Entity(
      ResourceClass.getKey(),
      {},
      {
        idAttribute: (value, parent, key) => {
          const id = ResourceClass.pk(value) || key;
          /* istanbul ignore next */
          if (process.env.NODE_ENV !== 'production' && id === null) {
            throw new Error(
              `Missing usable resource key when normalizing response.

This is likely due to a malformed response.
Try inspecting the network response or fetch() return value.

Resource: ${ResourceClass}
Value: ${value && JSON.stringify(value, null, 2)}
`,
            );
          }
          return id.toString();
        },
        processStrategy: value => {
          return ResourceClass.fromJS(value);
        },
        mergeStrategy: (
          a: AbstractInstanceType<T>,
          b: AbstractInstanceType<T>,
        ) => (a.constructor as T).merge(a, b),
      },
    );
    // TODO: long term figure out a plan to actually denormalize
    (e as any).denormalize = function denormalize(entity: any) {
      return [entity, true];
    };
    return e;
  },
) as any;
