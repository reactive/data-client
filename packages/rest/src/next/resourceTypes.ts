import type {
  Schema,
  schema,
  Denormalize,
  FetchFunction,
  EndpointToFunction,
} from '@rest-hooks/endpoint';

import { OptionsToFunction } from './OptionsToFunction.js';
import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
  RestTypeNoBody,
  RestEndpointOptions,
  PartialRestGenerics,
  RestExtendedEndpoint,
  Defaults,
} from './RestEndpoint.js';
import type { PathArgs, ShortenPath } from '../pathTypes.js';

export interface ResourceGenerics {
  readonly path: string;
  readonly schema: Schema;
  /** Only used for types */
  readonly body?: any;
  /** Only used for types */
  readonly searchParams?: any;
}
export interface ResourceOptions {
  Endpoint?: typeof RestEndpoint;
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
  optimistic?: boolean;
}

export interface ResourceEndpointExtensions<
  R extends Resource<any>,
  Get extends PartialRestGenerics = any,
  GetList extends PartialRestGenerics = any,
  Update extends PartialRestGenerics = any,
  PartialUpdate extends PartialRestGenerics = any,
  Create extends PartialRestGenerics = any,
  Delete extends PartialRestGenerics = any,
> {
  readonly get?: RestEndpointOptions<
    unknown extends Get
      ? EndpointToFunction<R['get']>
      : OptionsToFunction<Get, R['get'], EndpointToFunction<R['get']>>,
    R['get']['schema']
  > &
    Readonly<Get>;
  readonly getList?: RestEndpointOptions<
    unknown extends GetList
      ? EndpointToFunction<R['getList']>
      : OptionsToFunction<
          GetList,
          R['getList'],
          EndpointToFunction<R['getList']>
        >,
    R['getList']['schema']
  > &
    Readonly<GetList>;
  readonly update?: RestEndpointOptions<
    unknown extends Update
      ? EndpointToFunction<R['update']>
      : OptionsToFunction<Update, R['update'], EndpointToFunction<R['update']>>,
    R['update']['schema']
  > &
    Readonly<Update>;
  readonly partialUpdate?: RestEndpointOptions<
    unknown extends PartialUpdate
      ? EndpointToFunction<R['partialUpdate']>
      : OptionsToFunction<
          PartialUpdate,
          R['partialUpdate'],
          EndpointToFunction<R['partialUpdate']>
        >,
    R['partialUpdate']['schema']
  > &
    Readonly<PartialUpdate>;
  readonly create?: RestEndpointOptions<
    unknown extends Create
      ? EndpointToFunction<R['create']>
      : OptionsToFunction<Create, R['create'], EndpointToFunction<R['create']>>,
    R['create']['schema']
  > &
    Readonly<Create>;
  readonly delete?: RestEndpointOptions<
    unknown extends Delete
      ? EndpointToFunction<R['delete']>
      : OptionsToFunction<Delete, R['delete'], EndpointToFunction<R['delete']>>,
    R['delete']['schema']
  > &
    Readonly<Delete>;
}

export type ExtendedResource<
  R extends Resource<any>,
  Get extends PartialRestGenerics | {} = any,
  GetList extends PartialRestGenerics | {} = any,
  Update extends PartialRestGenerics | {} = any,
  PartialUpdate extends PartialRestGenerics | {} = any,
  Create extends PartialRestGenerics | {} = any,
  Delete extends PartialRestGenerics | {} = any,
  E extends Record<string, PartialRestGenerics> = {},
> = {
  // unknown only extends any
  get: unknown extends Get ? R['get'] : RestExtendedEndpoint<Get, R['get']>;
  getList: unknown extends GetList
    ? R['getList']
    : RestExtendedEndpoint<GetList, R['getList']>;
  update: unknown extends Update
    ? R['update']
    : RestExtendedEndpoint<Update, R['update']>;
  partialUpdate: unknown extends PartialUpdate
    ? R['partialUpdate']
    : RestExtendedEndpoint<PartialUpdate, R['partialUpdate']>;
  create: unknown extends Create
    ? unknown extends GetList
      ? R['create']
      : RestExtendedEndpoint<GetList, R['create']>
    : unknown extends GetList
    ? RestExtendedEndpoint<Create, R['create']>
    : RestExtendedEndpoint<Defaults<Create, GetList>, R['create']>;
  delete: unknown extends Delete
    ? R['delete']
    : RestExtendedEndpoint<Delete, R['delete']>;
} & {
  [K in Exclude<keyof E, keyof Resource>]: RestExtendedEndpoint<E[K], R['get']>;
};

export interface Resource<
  O extends ResourceGenerics = { path: string; schema: any },
> {
  /** Get a singular item
   *
   * @see https://resthooks.io/rest/api/createResource#get
   */
  get: GetEndpoint<{ path: O['path']; schema: O['schema'] }>;
  /** Get a list of item
   *
   * @see https://resthooks.io/rest/api/createResource#getlist
   */
  getList: 'searchParams' extends keyof O
    ? GetEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<[O['schema']]>;
        searchParams: O['searchParams'];
      }>
    : GetEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<[O['schema']]>;
        searchParams: Record<string, number | string | boolean> | undefined;
      }>;
  /** Create a new item (POST)
   *
   * @see https://resthooks.io/rest/api/createResource#create
   */
  create: 'searchParams' extends keyof O
    ? MutateEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<[O['schema']]>['push'];
        body: 'body' extends keyof O
          ? O['body']
          : Partial<Denormalize<O['schema']>>;
        searchParams: O['searchParams'];
      }>
    : MutateEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<[O['schema']]>['push'];
        body: 'body' extends keyof O
          ? O['body']
          : Partial<Denormalize<O['schema']>>;
      }>;
  /** Update an item (PUT)
   *
   * @see https://resthooks.io/rest/api/createResource#update
   */
  update: 'body' extends keyof O
    ? MutateEndpoint<{
        path: O['path'];
        body: O['body'];
        schema: O['schema'];
      }>
    : MutateEndpoint<{
        path: O['path'];
        body: Partial<Denormalize<O['schema']>>;
        schema: O['schema'];
      }>;
  /** Update an item (PATCH)
   *
   * @see https://resthooks.io/rest/api/createResource#partialupdate
   */
  partialUpdate: 'body' extends keyof O
    ? MutateEndpoint<{
        path: O['path'];
        body: Partial<O['body']>;
        schema: O['schema'];
      }>
    : MutateEndpoint<{
        path: O['path'];
        body: Partial<Denormalize<O['schema']>>;
        schema: O['schema'];
      }>;
  /** Delete an item (DELETE)
   *
   * @see https://resthooks.io/rest/api/createResource#delete
   */
  delete: RestTypeNoBody<
    PathArgs<O['path']>,
    O['schema'] extends schema.EntityInterface & { process: any }
      ? schema.Invalidate<O['schema']>
      : O['schema'],
    undefined,
    Partial<PathArgs<O['path']>>,
    {
      path: O['path'];
    }
  >;
}
