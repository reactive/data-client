import {
  AbortOptimistic,
  SnapshotInterface,
  schema,
} from '@data-client/endpoint';

import { ResourcePath } from './pathTypes.js';
import {
  ResourceGenerics,
  ResourceOptions,
  Resource,
  ResourceInterface,
} from './resourceTypes.js';
import RestEndpoint, {
  GetEndpoint,
  PartialRestGenerics,
  RestEndpointOptions,
  RestInstanceBase,
} from './RestEndpoint.js';
import { shortenPath } from './RestHelpers.js';

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
  // this accounts for derivative endpoints
  function extendMember(extended: any, key: string, options: any) {
    extended[key] = extended[key].extend(options);
  }

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
  const ret = {
    get,
    getList,
    // TODO(deprecated): remove this once we remove creates
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
    extend(
      ...args:
        | [string, RestEndpointOptions & PartialRestGenerics]
        | [RestEndpointOptions & PartialRestGenerics]
        | [
            (
              baseResource: ResourceInterface,
            ) => Record<string, RestInstanceBase>,
          ]
    ) {
      if (typeof args[0] === 'string') {
        const [key, options] = args;
        if (key in this) {
          const extended = { ...this };
          extendMember(extended, key, options);
          return extended;
        } else {
          return {
            ...this,
            [key]: this.get.extend(options),
          };
        }
      } else if (typeof args[0] === 'function') {
        const extended = args[0](this);
        return {
          ...this,
          ...extended,
        };
      }
      const overrides = args[0];
      const extended = { ...this };
      for (const key in overrides) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        extendMember(extended, key, overrides[key]);
      }
      return extended;
    },
  } as any;
  return ret;
}

function optimisticUpdate(snap: SnapshotInterface, params: any, body: any) {
  return {
    ...params,
    ...body,
  };
}
function optimisticPartial(
  getEndpoint: GetEndpoint<{ path: ResourcePath; schema: any }>,
) {
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
