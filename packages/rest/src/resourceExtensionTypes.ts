import type {
  EndpointInterface,
  EndpointToFunction,
  FetchFunction,
  Schema,
} from '@data-client/endpoint';

import type { IsUnion } from './isUnion.js';
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
  get: unknown extends Get ? R['get']
  : PartialRestGenerics extends Get ? R['get']
  : RestExtendedEndpoint<Get, R['get']>;
  getList: unknown extends GetList ? R['getList']
  : PartialRestGenerics extends GetList ? R['getList']
  : RestExtendedEndpoint<GetList, R['getList']>;
  update: unknown extends Update ? R['update']
  : PartialRestGenerics extends Update ? R['update']
  : RestExtendedEndpoint<Update, R['update']>;
  partialUpdate: unknown extends PartialUpdate ? R['partialUpdate']
  : PartialRestGenerics extends PartialUpdate ? R['partialUpdate']
  : RestExtendedEndpoint<PartialUpdate, R['partialUpdate']>;
  delete: unknown extends Delete ? R['delete']
  : PartialRestGenerics extends Delete ? R['delete']
  : RestExtendedEndpoint<Delete, R['delete']>;
}

export type ExtendedResource<
  R extends ResourceInterface,
  T extends Record<string, EndpointInterface>,
> = Omit<R, keyof T> & T;

export interface ResourceEndpointExtensions<
  R extends ResourceInterface,
  Get extends PartialRestGenerics = {},
  GetList extends PartialRestGenerics = {},
  Update extends PartialRestGenerics = {},
  PartialUpdate extends PartialRestGenerics = {},
  Delete extends PartialRestGenerics = {},
> {
  readonly get?: EndpointExtensionOptions<R['get'], Get>;
  readonly getList?: EndpointExtensionOptions<R['getList'], GetList>;
  readonly update?: EndpointExtensionOptions<R['update'], Update>;
  readonly partialUpdate?: EndpointExtensionOptions<
    R['partialUpdate'],
    PartialUpdate
  >;
  readonly delete?: EndpointExtensionOptions<R['delete'], Delete>;
}

/** Options extending endpoint `E`. `O` is PartialRestGenerics when TypeScript couldn't infer it:
 * options without any of its members (like only getOptimisticResponse) fail its weak type check.
 * Then callbacks take `E`'s args, or `any` when those are a union of tuples, which TypeScript
 * can't infer callback parameters from.
 */
type EndpointExtensionOptions<
  E extends RestInstanceBase,
  O extends PartialRestGenerics,
> = RestEndpointOptions<
  unknown extends O ? EndpointToFunction<E>
  : PartialRestGenerics extends O ? SingleArgsFunction<EndpointToFunction<E>>
  : OptionsToFunction<O, E, EndpointToFunction<E>>,
  PartialRestGenerics extends O ? E['schema']
  : 'schema' extends keyof O ? Extract<O['schema'], Schema | undefined>
  : E['schema']
> &
  Readonly<O> &
  O;

type SingleArgsFunction<F extends FetchFunction> = (
  ...args: IsUnion<Parameters<F>> extends false ? Parameters<F> : any
) => ReturnType<F>;
