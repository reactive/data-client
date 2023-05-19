import {
  AbortOptimistic,
  SnapshotInterface,
  schema,
} from '@rest-hooks/endpoint';
import type { Schema, Denormalize } from '@rest-hooks/endpoint';

import { ResourceGenerics, ResourceOptions } from './resourceTypes.js';
import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
  RestInstance,
  RestTypeNoBody,
} from './RestEndpoint.js';
import { PathArgs, ShortenPath } from '../pathTypes.js';
import { shortenPath } from '../RestHelpers.js';

const { Invalidate, Collection } = schema;

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
export default function createResource<O extends ResourceGenerics>({
  path,
  schema,
  Endpoint = RestEndpoint,
  optimistic,
  ...extraOptions
}: Readonly<O> & ResourceOptions): Resource<O> {
  const shortenedPath = shortenPath(path);
  const getName = (name: string) => `${(schema as any)?.name}.${name}`;
  const extraMutateOptions = { ...extraOptions };
  const extraPartialOptions = { ...extraOptions };
  const get: GetEndpoint<{ path: O['path']; schema: O['schema'] }> =
    new Endpoint({
      ...extraOptions,
      path,
      schema,
      name: getName('get'),
    }) as any;
  if (optimistic) {
    (extraMutateOptions as any).getOptimisticResponse = optimisticUpdate;
    (extraPartialOptions as any).getOptimisticResponse = optimisticPartial(get);
  }
  const getList = new Endpoint({
    ...extraMutateOptions,
    path: shortenedPath,
    schema: new Collection([schema as any]),
    name: getName('getList'),
  });
  return {
    get,
    getList,
    create: getList.push.extend({ name: getName('create') }),
    update: new Endpoint({
      ...extraMutateOptions,
      path,
      schema,
      method: 'PUT',
      name: getName('update'),
    }),
    partialUpdate: new Endpoint({
      ...extraPartialOptions,
      path,
      schema,
      method: 'PATCH',
      name: getName('partialUpdate'),
    }),
    delete: new Endpoint({
      ...extraMutateOptions,
      path,
      schema: (schema as any).process ? new Invalidate(schema as any) : schema,
      method: 'DELETE',
      name: getName('delete'),
      process(res: any, params: any) {
        return res && Object.keys(res).length ? res : params;
      },
      getOptimisticResponse: optimistic ? (optimisticDelete as any) : undefined,
    }),
  } as any;
}

function optimisticUpdate(snap: SnapshotInterface, params: any, body: any) {
  return {
    ...params,
    ...body,
  };
}
function optimisticPartial(getEndpoint: GetEndpoint) {
  return function (snap: SnapshotInterface, params: any, body: any) {
    const { data } = snap.getResponse(getEndpoint, params) as { data: any };
    if (!data) throw new AbortOptimistic();
    return {
      ...params,
      ...data,
      // even tho we don't always have two arguments, the extra one will simply be undefined which spreads fine
      ...body,
    };
  };
}
function optimisticDelete(snap: SnapshotInterface, params: any) {
  return params;
}

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
