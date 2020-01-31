import { Schema } from './normal';
import Entity from './Entity';
import { FetchShape, DeleteShape } from './shapes';

export type SchemaFromShape<
  F extends FetchShape<any, any, any>
> = F extends FetchShape<infer S, any, any> ? S : never;

/** Get the Params type for a given Shape */
export type ParamsFromShape<S> = S extends {
  fetch: (first: infer A, ...rest: any) => any;
}
  ? A
  : S extends { getFetchKey: (first: infer A, ...rest: any) => any }
  ? A
  : never;

export type BodyFromShape<
  F extends FetchShape<any, any, any>
> = F extends FetchShape<any, any, infer B> ? B : never;

/** Sets a FetchShape's Param type.
 * Useful to constrain acceptable params (second arg) in hooks like useResource().
 *
 * @param [Shape] FetchShape to act upon
 * @param [Params] what to set the Params to
 */
export type SetShapeParams<
  Shape extends FetchShape<any, any, any>,
  Params extends Readonly<object>
> = {
  [K in keyof Shape]: Shape[K];
} &
  (Shape['fetch'] extends (first: any, ...rest: infer Args) => infer Return
    ? { fetch: (first: Params, ...rest: Args) => Return }
    : never);

export function isDeleteShape(
  shape: FetchShape<any, any, any>,
): shape is DeleteShape<any, any> {
  return shape.type === 'delete';
}

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

export function isEntity(schema: Schema): schema is typeof Entity {
  return (schema as any).getId !== undefined;
}
