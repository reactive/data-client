import { Schema } from '@rest-hooks/normalizr';
import type { Denormalize } from '@rest-hooks/normalizr';

import { UpdateFunction } from '../types.js';
import { FetchShape } from './shapes.js';

export type ResultShape<RS> = RS extends { schema: infer U } ? U : never;
export type SelectReturn<RS> = RS extends {
  select: (...args: any[]) => infer U;
}
  ? U
  : never;
export type AlwaysSelect<RS> = NonNullable<SelectReturn<RS>>;
export type ParamArg<RS> = RS extends {
  getFetchKey: (params: infer U) => any;
}
  ? U
  : never;
export type BodyArg<RS> = RS extends {
  fetch: (url: any, body: infer U) => any;
}
  ? U
  : never;

/** Sets a FetchShape's Param type.
 * Useful to constrain acceptable params (second arg) in hooks like useResource().
 *
 * @param [Shape] FetchShape to act upon
 * @param [Params] what to set the Params to
 */
export type SetShapeParams<
  Shape extends FetchShape<any, any, any>,
  Params extends Readonly<object>,
> = {
  [K in keyof Shape]: Shape[K];
} & (Shape['fetch'] extends (first: any, ...rest: infer Args) => infer Return
  ? { fetch: (first: Params, ...rest: Args) => Return }
  : never);

/** Get the Params type for a given Shape */
export type ParamsFromShape<S> = S extends {
  fetch: (first: infer A, ...rest: any) => any;
}
  ? A
  : S extends { getFetchKey: (first: infer A, ...rest: any) => any }
  ? A
  : never;

/** Get the Schema type for a given Shape */
export type SchemaFromShape<
  F extends FetchShape<Schema | undefined, any, any>,
> = F['schema'];

/** Get the Body type for a given Shape */
export type BodyFromShape<F extends FetchShape<any, any, any>> = Parameters<
  F['fetch']
>[1];

export type OptimisticUpdateParams<
  SourceSchema extends Schema | undefined,
  DestShape extends FetchShape<any, any, any>,
> = [
  DestShape,
  ParamsFromShape<DestShape>,
  UpdateFunction<SourceSchema, SchemaFromShape<DestShape>>,
];

export type ReturnFromShape<S extends FetchShape<any, any, any>> = ReturnType<
  S['fetch']
> extends unknown
  ? Promise<Denormalize<S['schema']>>
  : ReturnType<S['fetch']>;
