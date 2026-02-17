import type { Collection, schema } from '@data-client/endpoint';
import type { Schema } from '@data-client/endpoint';
import type { Denormalize } from '@data-client/endpoint';

import type {
  KeysToArgs,
  PathArgs,
  ResourcePath,
  ShortenPath,
} from './pathTypes.js';
import { Extendable } from './resourceExtendable.js';
import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
  ParamToArgs,
  RestInstanceBase,
  RestTypeNoBody,
} from './RestEndpoint.js';

/** The typed (generic) options for a Resource
 *
 * @see https://dataclient.io/rest/api/resource#function-inheritance-patterns
 */
export interface ResourceGenerics {
  /** @see https://dataclient.io/rest/api/resource#path */
  readonly path: ResourcePath;
  /** @see https://dataclient.io/rest/api/resource#schema */
  readonly schema: Schema;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/resource#body */
  readonly body?: any;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/resource#searchParams */
  readonly searchParams?: any;
  /** @see https://dataclient.io/rest/api/resource#paginationfield */
  readonly paginationField?: string;
}
/** The untyped options for resource() */
export interface ResourceOptions {
  /** @see https://dataclient.io/rest/api/resource#endpoint */
  Endpoint?: typeof RestEndpoint;
  /** @see https://dataclient.io/rest/api/resource#collection */
  Collection?: typeof Collection;
  /** @see https://dataclient.io/rest/api/resource#optimistic */
  optimistic?: boolean;
  /** @see https://dataclient.io/rest/api/resource#urlprefix */
  urlPrefix?: string;
  requestInit?: RequestInit;
  getHeaders?(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
  getRequestInit?(body: any): Promise<RequestInit> | RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Determines whether to throw or fallback to */
  errorPolicy?(error: any): 'hard' | 'soft' | undefined;
}

/** Resources are a collection of methods for a given data model.
 * @see https://dataclient.io/rest/api/resource
 */
export interface Resource<
  O extends ResourceGenerics = { path: ResourcePath; schema: any },
> extends Extendable<O> {
  /** Get one item (GET)
   *
   * @see https://dataclient.io/rest/api/resource#get
   */
  get: GetEndpoint<{ path: O['path']; schema: O['schema'] }>;
  /** Get an Array of items (GET)
   *
   * @see https://dataclient.io/rest/api/resource#getlist
   */
  getList: 'searchParams' extends keyof O ?
    GetEndpoint<
      {
        path: ShortenPath<O['path']>;
        schema: schema.Collection<
          [O['schema']],
          ParamToArgs<
            O['searchParams'] extends undefined ?
              KeysToArgs<ShortenPath<O['path']>>
            : O['searchParams'] & PathArgs<ShortenPath<O['path']>>
          >
        >;
        body: 'body' extends keyof O ? O['body']
        : Partial<Denormalize<O['schema']>>;
        searchParams: O['searchParams'];
        movePath: O['path'];
      } & Pick<O, 'paginationField'>
    >
  : GetEndpoint<
      {
        path: ShortenPath<O['path']>;
        schema: schema.Collection<
          [O['schema']],
          ParamToArgs<
            (Record<string, number | string | boolean> | undefined) &
              PathArgs<ShortenPath<O['path']>>
          >
        >;
        body: 'body' extends keyof O ? O['body']
        : Partial<Denormalize<O['schema']>>;
        searchParams: Record<string, number | string | boolean> | undefined;
        movePath: O['path'];
      } & Pick<O, 'paginationField'>
    >;
  /** Create a new item (POST)
   *
   * @deprecated use Resource.getList.push instead
   */
  create: 'searchParams' extends keyof O ?
    MutateEndpoint<{
      path: ShortenPath<O['path']>;
      schema: schema.Collection<[O['schema']]>['push'];
      body: 'body' extends keyof O ? O['body']
      : Partial<Denormalize<O['schema']>>;
      searchParams: O['searchParams'];
    }>
  : MutateEndpoint<{
      path: ShortenPath<O['path']>;
      schema: schema.Collection<[O['schema']]>['push'];
      body: 'body' extends keyof O ? O['body']
      : Partial<Denormalize<O['schema']>>;
    }>;
  /** Update an item (PUT)
   *
   * @see https://dataclient.io/rest/api/resource#update
   */
  update: 'body' extends keyof O ?
    MutateEndpoint<{
      path: O['path'];
      body: O['body'];
      schema: O['schema'];
    }>
  : MutateEndpoint<{
      path: O['path'];
      body: Partial<Denormalize<O['schema']>> | FormData;
      schema: O['schema'];
    }>;
  /** Update an item (PATCH)
   *
   * @see https://dataclient.io/rest/api/resource#partialupdate
   */
  partialUpdate: 'body' extends keyof O ?
    MutateEndpoint<{
      path: O['path'];
      body: Partial<O['body']>;
      schema: O['schema'];
    }>
  : MutateEndpoint<{
      path: O['path'];
      body: Partial<Denormalize<O['schema']>> | FormData;
      schema: O['schema'];
    }>;
  /** Delete an item (DELETE)
   *
   * @see https://dataclient.io/rest/api/resource#delete
   */
  delete: RestTypeNoBody<
    PathArgs<O['path']>,
    O['schema'] extends schema.EntityInterface & { process: any } ?
      schema.Invalidate<O['schema']>
    : O['schema'],
    undefined,
    Partial<PathArgs<O['path']>>,
    {
      path: O['path'];
    }
  >;
}

export interface ResourceInterface {
  get: RestInstanceBase;
  getList: RestInstanceBase;
  update: RestInstanceBase;
  partialUpdate: RestInstanceBase;
  delete: RestInstanceBase;
}
