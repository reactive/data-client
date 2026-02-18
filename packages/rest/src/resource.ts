import { schema } from '@data-client/endpoint';
import type { SnapshotInterface, Queryable } from '@data-client/endpoint';

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

const { Invalidate, Collection: BaseCollection } = schema;

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://dataclient.io/rest/api/resource
 */
export default function resource<O extends ResourceGenerics>({
  path,
  schema,
  Endpoint = RestEndpoint,
  Collection = BaseCollection,
  optimistic,
  paginationField,
  ...extraOptions
}: Readonly<O> & ResourceOptions): Resource<O> {
  if (process.env.NODE_ENV !== 'production') {
    // if they lowercase and it looks like they meant to use upper-case version
    if (
      'endpoint' in extraOptions &&
      Endpoint === RestEndpoint &&
      typeof extraOptions['endpoint'] === 'function' &&
      extraOptions['endpoint'] &&
      Object.prototype.isPrototypeOf.call(
        RestEndpoint.prototype,
        (extraOptions['endpoint'] as any).prototype,
      )
    ) {
      console.warn(
        `You passed 'endpoint' option; did you mean to use Endpoint?
https://dataclient.io/rest/api/resource#endpoint
This parameter must be capitalized.

This warning will not show in production.`,
      );
    }
    // if they lowercase and it looks like they meant to use upper-case version
    if (
      'collection' in extraOptions &&
      Collection === BaseCollection &&
      typeof extraOptions['collection'] === 'function' &&
      extraOptions['collection'] &&
      Object.prototype.isPrototypeOf.call(
        BaseCollection.prototype,
        (extraOptions['collection'] as any).prototype,
      )
    ) {
      console.warn(
        `You passed 'collection' option; did you mean to use Collection?
https://dataclient.io/rest/api/resource#collection
This parameter must be capitalized.

This warning will not show in production.`,
      );
    }
  }
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
    // TODO: Check that schema is a queryable, otherwise this doesn't make sense
    (extraPartialOptions as any).getOptimisticResponse = optimisticPartial(
      schema as any,
    );
  }
  const getList = new Endpoint({
    ...extraMutateOptions,
    paginationField: paginationField as string,
    movePath: path,
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
    // TODO(breaking): Move to getList.move
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
      schema:
        // Entity || Union
        (schema as any).process || (schema as any)._hoistable ?
          new Invalidate(schema as any)
        : schema,
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
    ...ensurePojo(body),
  };
}
function optimisticPartial(schema: Queryable) {
  return function (snap: SnapshotInterface, params: any, body: any) {
    const data = snap.get(schema, params);
    if (!data) throw snap.abort;
    return {
      ...params,
      ...data,
      // even tho we don't always have two arguments, the extra one will simply be undefined which spreads fine
      ...ensurePojo(body),
    };
  };
}
function optimisticDelete(snap: SnapshotInterface, params: any) {
  return params;
}
function ensurePojo(body: any) {
  return body instanceof FormData ?
      Object.fromEntries((body as any).entries())
    : body;
}
