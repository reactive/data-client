import { schema } from '@rest-hooks/endpoint';
import type { Schema, Denormalize } from '@rest-hooks/endpoint';

import { ResourceGenerics, ResourceOptions } from './resourceTypes.js';
import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
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
  ...extraOptions
}: Readonly<O> & ResourceOptions): Resource<O> {
  const shortenedPath = shortenPath(path);
  const getName = (name: string) => `${(schema as any)?.name}.${name}`;
  const getList = new Endpoint({
    ...extraOptions,
    path: shortenedPath,
    schema: new Collection([schema as any], {
      argsKey: (urlParams, body) => ({
        ...urlParams,
      }),
    }),
    name: getName('getList'),
  });
  return {
    get: new Endpoint({ ...extraOptions, path, schema, name: getName('get') }),
    getList,
    create: getList.push.extend({ name: getName('create') }),
    update: new Endpoint({
      ...extraOptions,
      path,
      schema,
      method: 'PUT',
      name: getName('update'),
    }),
    partialUpdate: new Endpoint({
      ...extraOptions,
      path,
      schema,
      method: 'PATCH',
      name: getName('partialUpdate'),
    }),
    delete: new Endpoint({
      ...extraOptions,
      path,
      schema: (schema as any).process ? new Invalidate(schema as any) : schema,
      method: 'DELETE',
      name: getName('delete'),
      process(res: any, params: any) {
        return res && Object.keys(res).length ? res : params;
      },
    }),
  } as any;
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
        schema: schema.Collection<O['schema'][]>;
        searchParams: O['searchParams'];
      }>
    : GetEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<O['schema'][]>;
        searchParams: Record<string, number | string | boolean> | undefined;
      }>;
  /** Create a new item (POST)
   *
   * @see https://resthooks.io/rest/api/createResource#create
   */
  create: 'searchParams' extends keyof O
    ? MutateEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<schema.Array<O['schema']>>['push'];
        body: 'body' extends keyof O
          ? O['body']
          : Partial<Denormalize<O['schema']>>;
        searchParams: O['searchParams'];
      }>
    : MutateEndpoint<{
        path: ShortenPath<O['path']>;
        schema: schema.Collection<schema.Array<O['schema']>>['push'];
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
        body: O['body'];
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
