import type {
  EndpointInterface,
  EndpointToFunction,
} from '@data-client/endpoint';

import type { ResourcePath } from './pathTypes.js';
import type {
  ResourceExtension,
  ResourceEndpointExtensions,
  CustomResource,
  ExtendedResource,
} from './resourceExtensionTypes.js';
import type {
  Resource,
  ResourceGenerics,
  ResourceInterface,
} from './resourceTypes.js';
import type {
  PartialRestGenerics,
  RestEndpointExtendOptions,
  RestExtendedEndpoint,
  RestInstanceBase,
} from './RestEndpoint.js';

export interface Extendable<
  O extends ResourceGenerics = { path: ResourcePath; schema: any },
> {
  /** Allows customizing individual endpoints
   *
   * @see https://dataclient.io/rest/api/resource#extend
   */
  extend<
    R extends {
      [K in ExtendKey]: RestInstanceBase;
    },
    const ExtendKey extends Exclude<Extract<keyof R, string>, 'extend'>,
    // TODO: see RestEndpoint.extend TODO
    ExtendOptions extends PartialRestGenerics | {},
  >(
    this: R,
    key: ExtendKey,
    options: Readonly<
      RestEndpointExtendOptions<
        ExtendOptions,
        R[ExtendKey],
        EndpointToFunction<R[ExtendKey]>
      > &
        ExtendOptions
    >,
  ): ResourceExtension<R, ExtendKey, ExtendOptions>;
  extend<
    R extends { get: RestInstanceBase },
    const ExtendKey extends string,
    // TODO: see RestEndpoint.extend TODO
    ExtendOptions extends PartialRestGenerics | {},
  >(
    this: R,
    key: ExtendKey,
    options: Readonly<
      RestEndpointExtendOptions<
        ExtendOptions,
        R['get'],
        EndpointToFunction<R['get']>
      > &
        ExtendOptions
    >,
  ): R & {
    [key in ExtendKey]: RestExtendedEndpoint<ExtendOptions, R['get']>;
  };
  extend<
    R extends ResourceInterface,
    Get extends PartialRestGenerics = {},
    GetList extends PartialRestGenerics = {},
    Update extends PartialRestGenerics = {},
    PartialUpdate extends PartialRestGenerics = {},
    Delete extends PartialRestGenerics = {},
  >(
    this: R,
    options: ResourceEndpointExtensions<
      R,
      Get,
      GetList,
      Update,
      PartialUpdate,
      Delete
    >,
  ): CustomResource<R, O, Get, GetList, Update, PartialUpdate, Delete>;
  extend<
    R extends ResourceInterface,
    T extends Record<string, EndpointInterface>,
  >(
    this: R,
    extender: (baseResource: R) => T,
  ): ExtendedResource<R, T>;
}
