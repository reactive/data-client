import {
  type Schema,
  type Denormalize,
  schema,
  type EndpointExtraOptions,
} from '@rest-hooks/endpoint';

import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
  RestTypeNoBody,
} from './RestEndpoint.js';
import { shortenPath } from './RestHelpers.js';
import { PathArgs, PathArgsAndSearch, ShortenPath } from './pathTypes.js';

const { Delete } = schema;

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
export default function createResource<U extends string, S extends Schema>({
  path,
  schema,
  Endpoint = RestEndpoint,
  ...extraOptions
}: {
  readonly path: U;
  readonly schema: S;
  readonly Endpoint?: typeof RestEndpoint;
  urlPrefix?: string;
} & EndpointExtraOptions): Resource<U, S> {
  const shortenedPath = shortenPath(path);
  const getName = (name: string) => `${(schema as any)?.name}.${name}`;
  const getList = new Endpoint({
    ...extraOptions,
    path: shortenedPath,
    schema: [schema],
    name: getName('getList'),
  });
  return {
    get: new Endpoint({ ...extraOptions, path, schema, name: getName('get') }),
    getList,
    create: new Endpoint({
      ...extraOptions,
      path: shortenedPath,
      schema,
      method: 'POST',
      name: getName('create'),
    }),
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
      process(res, params) {
        return res && Object.keys(res).length ? res : params;
      },
    }),
  } as any;
}

export interface Resource<U extends string, S extends Schema> {
  /** Get a singular item
   *
   * @see https://resthooks.io/rest/api/createResource#get
   */
  get: GetEndpoint<PathArgs<U>, S>;
  /** Get a list of item
   *
   * @see https://resthooks.io/rest/api/createResource#getlist
   */
  getList: GetEndpoint<PathArgsAndSearch<ShortenPath<U>>, S[]>;
  /** Create a new item (POST)
   *
   * @see https://resthooks.io/rest/api/createResource#create
   */
  create: MutateEndpoint<PathArgs<ShortenPath<U>>, Partial<Denormalize<S>>, S>;
  /** Update an item (PUT)
   *
   * @see https://resthooks.io/rest/api/createResource#update
   */
  update: MutateEndpoint<PathArgs<U>, Partial<Denormalize<S>>, S>;
  /** Update an item (PATCH)
   *
   * @see https://resthooks.io/rest/api/createResource#partialupdate
   */
  partialUpdate: MutateEndpoint<PathArgs<U>, Partial<Denormalize<S>>, S>;
  /** Delete an item (DELETE)
   *
   * @see https://resthooks.io/rest/api/createResource#delete
   */
  delete: RestTypeNoBody<
    PathArgs<U>,
    S extends schema.EntityInterface & { process: any } ? schema.Delete<S> : S,
    undefined,
    Partial<PathArgs<U>>
  >;
}
