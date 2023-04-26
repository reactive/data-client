import { schema } from '@rest-hooks/endpoint';
import type {
  Schema,
  Denormalize,
  EndpointExtraOptions,
} from '@rest-hooks/endpoint';

import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
  ResourceGenerics,
  RestTypeNoBody,
  ResourceOptions,
} from './RestEndpoint.js';
import { PathArgs, ShortenPath } from '../pathTypes.js';
import { shortenPath } from '../RestHelpers.js';

const { Delete, Collection } = schema;

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
export default function createResource<O extends ResourceGenerics>({
  path,
  schema,
  Endpoint = RestEndpoint,
  ...extraOptions
}: Readonly<
  ResourceOptions & {
    readonly Endpoint?: typeof RestEndpoint;
  } & O
>): Resource<O> {
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
      schema: (schema as any).process ? new Delete(schema as any) : schema,
      method: 'DELETE',
      name: getName('delete'),
      process(res: any, params: any) {
        return res && Object.keys(res).length ? res : params;
      },
    }),
  } as any;
}

export interface Resource<
  O extends ResourceGenerics = { path: string; schema: Schema },
> {
  /** Get a singular item
   *
   * @see https://resthooks.io/rest/api/createResource#get
   */
  get: GetEndpoint<Omit<O, 'searchParams' | 'body'>>;
  /** Get a list of item
   *
   * @see https://resthooks.io/rest/api/createResource#getlist
   */
  getList: GetEndpoint<
    Omit<O, 'schema' | 'body' | 'path'> & {
      readonly path: ShortenPath<O['path']>;
      readonly schema: schema.CollectionType<O['schema'][]>;
    }
  >;
  /** Create a new item (POST)
   *
   * @see https://resthooks.io/rest/api/createResource#create
   */
  create: MutateEndpoint<
    {
      readonly path: ShortenPath<O['path']>;
      readonly body: 'body' extends keyof O
        ? O['body']
        : Partial<Denormalize<O['schema']>>;
      readonly schema: schema.CollectionType<schema.Array<O['schema']>>['push'];
    } & Omit<O, 'path' | 'body' | 'schema'>
  >;
  /** Update an item (PUT)
   *
   * @see https://resthooks.io/rest/api/createResource#update
   */
  update: MutateEndpoint<
    {
      readonly body: 'body' extends keyof O
        ? O['body']
        : Partial<Denormalize<O['schema']>>;
    } & O
  >;
  /** Update an item (PATCH)
   *
   * @see https://resthooks.io/rest/api/createResource#partialupdate
   */
  partialUpdate: MutateEndpoint<
    {
      readonly body: 'body' extends keyof O
        ? O['body']
        : Partial<Denormalize<O['schema']>>;
    } & O
  >;
  /** Delete an item (DELETE)
   *
   * @see https://resthooks.io/rest/api/createResource#delete
   */
  delete: RestTypeNoBody<
    PathArgs<O['path']>,
    O['schema'] extends schema.EntityInterface & { process: any }
      ? schema.Delete<O['schema']>
      : O['schema'],
    undefined,
    Partial<PathArgs<O['path']>>,
    {
      path: O['path'];
    }
  >;
}
