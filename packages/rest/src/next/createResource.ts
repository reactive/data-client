import {
  AbortOptimistic,
  SnapshotInterface,
  schema,
} from '@rest-hooks/endpoint';

import type {
  Resource,
  ResourceEndpointExtensions,
  ResourceGenerics,
  ResourceOptions,
  ExtendedResource,
} from './resourceTypes.js';
import RestEndpoint, {
  GetEndpoint,
  PartialRestGenerics,
  RestEndpointOptions,
  RestInstance,
} from './RestEndpoint.js';
import { shortenPath } from '../RestHelpers.js';

const { Invalidate, Collection } = schema;

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
export default function createResource<
  const O extends ResourceGenerics,
  const Get extends PartialRestGenerics = any,
  const GetList extends PartialRestGenerics = any,
  const Update extends PartialRestGenerics = any,
  const PartialUpdate extends PartialRestGenerics = any,
  const Create extends PartialRestGenerics = any,
  const Delete extends PartialRestGenerics = any,
  const E extends Record<
    string,
    PartialRestGenerics & RestEndpointOptions
  > = {},
>({
  path,
  schema,
  Endpoint = RestEndpoint,
  optimistic,
  get: getOpt,
  getList: getListOpt,
  update: updateOpt,
  partialUpdate: partialOpt,
  delete: delOpt,
  create: createOpt,
  endpoints,
  ...extraOptions
}: Readonly<O> &
  ResourceOptions &
  ResourceEndpointExtensions<
    Resource<O>,
    Get,
    GetList,
    Update,
    PartialUpdate,
    Create,
    Delete
  > & {
    endpoints?: E;
  }): ExtendedResource<
  Resource<O>,
  Get,
  GetList,
  Update,
  PartialUpdate,
  Create,
  Delete,
  E
> {
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
      ...(getOpt as any),
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
    ...(getListOpt as any),
  });
  const extraEndpoints: Record<string, RestInstance> = {};
  for (const key in endpoints) {
    extraEndpoints[key] = get.extend(endpoints[key]);
  }
  return {
    ...extraEndpoints,
    get,
    getList,
    create: getList.push.extend({
      name: getName('create'),
      ...(createOpt as any),
    }),
    update: new Endpoint({
      ...extraMutateOptions,
      path,
      schema,
      method: 'PUT',
      name: getName('update'),
      ...(updateOpt as any),
    }),
    partialUpdate: new Endpoint({
      ...extraPartialOptions,
      path,
      schema,
      method: 'PATCH',
      name: getName('partialUpdate'),
      ...(partialOpt as any),
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
      ...(delOpt as any),
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
