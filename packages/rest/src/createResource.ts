import {
  AbortOptimistic,
  schema,
  SnapshotInterface,
} from '@data-client/endpoint';
import type {
  Schema,
  Denormalize,
  EndpointExtraOptions,
} from '@data-client/endpoint';

import { PathArgs, ShortenPath } from './pathTypes.js';
import RestEndpoint, {
  NewGetEndpoint,
  NewMutateEndpoint,
  RestInstance,
  RestTypeNoBody,
} from './RestEndpoint.js';
import { shortenPath } from './RestHelpers.js';

const { Delete } = schema;

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
export default function createResource<U extends string, S extends Schema>({
  path,
  schema,
  Endpoint = RestEndpoint,
  optimistic,
  ...extraOptions
}: {
  readonly path: U;
  readonly schema: S;
  readonly Endpoint?: typeof RestEndpoint;
  urlPrefix?: string;
  optimistic?: boolean;
} & EndpointExtraOptions): Resource<U, S> {
  const shortenedPath = shortenPath(path);
  const getName = (name: string) => `${(schema as any)?.name}.${name}`;
  const extraMutateOptions = { ...extraOptions };
  const extraPartialOptions = { ...extraOptions };
  const get: NewGetEndpoint<{ path: U }, S> = new Endpoint({
    ...extraOptions,
    path,
    schema,
    name: getName('get'),
  });
  if (optimistic) {
    (extraMutateOptions as any).getOptimisticResponse = optimisticUpdate;
    (extraPartialOptions as any).getOptimisticResponse = optimisticPartial(get);
  }
  const getList = new Endpoint({
    ...extraOptions,
    path: shortenedPath,
    schema: [schema],
    name: getName('getList'),
  });
  return {
    get,
    getList,
    create: new Endpoint({
      ...extraMutateOptions,
      path: shortenedPath,
      schema,
      method: 'POST',
      name: getName('create'),
    }),
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
      schema: (schema as any).process ? new Delete(schema as any) : schema,
      method: 'DELETE',
      name: getName('delete'),
      process(res, params) {
        return res && Object.keys(res).length ? res : params;
      },
      getOptimisticResponse: optimistic ? (optimisticDelete as any) : undefined,
    }),
  } as any;
}

function optimisticUpdate(snap: SnapshotInterface, params: any, body: any) {
  return {
    ...params,
    // even tho we don't always have two arguments, the extra one will simply be undefined which spreads fine
    ...body,
  };
}
function optimisticPartial(getEndpoint: NewGetEndpoint<any, any>) {
  return function (snap: SnapshotInterface, params: any, body: any) {
    const { data } = snap.getResponse(getEndpoint, params);
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

export interface Resource<U extends string, S extends Schema> {
  /** Get a singular item
   *
   * @see https://resthooks.io/rest/api/createResource#get
   */
  get: NewGetEndpoint<{ path: U }, S>;
  /** Get a list of item
   *
   * @see https://resthooks.io/rest/api/createResource#getlist
   */
  getList: NewGetEndpoint<
    {
      path: ShortenPath<U>;
      searchParams: Record<string, number | string | boolean> | undefined;
    },
    S[]
  >;
  /** Create a new item (POST)
   *
   * @see https://resthooks.io/rest/api/createResource#create
   */
  create: NewMutateEndpoint<
    { path: ShortenPath<U>; body: Partial<Denormalize<S>> },
    S
  >;
  /** Update an item (PUT)
   *
   * @see https://resthooks.io/rest/api/createResource#update
   */
  update: NewMutateEndpoint<{ path: U; body: Partial<Denormalize<S>> }, S>;
  /** Update an item (PATCH)
   *
   * @see https://resthooks.io/rest/api/createResource#partialupdate
   */
  partialUpdate: NewMutateEndpoint<
    { path: U; body: Partial<Denormalize<S>> },
    S
  >;
  /** Delete an item (DELETE)
   *
   * @see https://resthooks.io/rest/api/createResource#delete
   */
  delete: RestTypeNoBody<
    PathArgs<U>,
    S extends schema.EntityInterface & { process: any } ? schema.Delete<S> : S,
    undefined,
    Partial<PathArgs<U>>,
    {
      path: U;
    }
  >;
}
