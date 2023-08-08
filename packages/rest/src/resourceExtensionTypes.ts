import type {
  EndpointInterface,
  EndpointToFunction,
} from '@data-client/endpoint';

import { OptionsToFunction } from './OptionsToFunction.js';
import type { ResourcePath } from './pathTypes.js';
import { Extendable } from './resourceExtendable.js';
import { ResourceGenerics, ResourceInterface } from './resourceTypes.js';
import type {
  PartialRestGenerics,
  RestExtendedEndpoint,
  RestInstanceBase,
  RestEndpointOptions,
} from './RestEndpoint.js';

export type ResourceExtension<
  R extends { [K in ExtendKey]: RestInstanceBase },
  ExtendKey extends Exclude<Extract<keyof R, string>, 'extend'>,
  O extends PartialRestGenerics | {},
> = {
  [K in keyof R]: K extends ExtendKey ? RestExtendedEndpoint<O, R[K]> : R[K];
};

/** Resource with individual endpoints customized
 *
 */
export interface CustomResource<
  R extends ResourceInterface,
  O extends ResourceGenerics = { path: ResourcePath; schema: any },
  Get extends PartialRestGenerics | {} = any,
  GetList extends PartialRestGenerics | {} = any,
  Update extends PartialRestGenerics | {} = any,
  PartialUpdate extends PartialRestGenerics | {} = any,
  Delete extends PartialRestGenerics | {} = any,
> extends Extendable<O> {
  // unknown only extends any. this allows us to match exclusively on members not set
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
  delete: unknown extends Delete
    ? R['delete']
    : RestExtendedEndpoint<Delete, R['delete']>;
}

export type ExtendedResource<
  R extends ResourceInterface,
  T extends Record<string, EndpointInterface>,
> = Omit<R, keyof T> & T;

export interface ResourceEndpointExtensions<
  R extends ResourceInterface,
  Get extends PartialRestGenerics = any,
  GetList extends PartialRestGenerics = any,
  Update extends PartialRestGenerics = any,
  PartialUpdate extends PartialRestGenerics = any,
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
  readonly delete?: RestEndpointOptions<
    unknown extends Delete
      ? EndpointToFunction<R['delete']>
      : OptionsToFunction<Delete, R['delete'], EndpointToFunction<R['delete']>>,
    R['delete']['schema']
  > &
    Readonly<Delete>;
}
