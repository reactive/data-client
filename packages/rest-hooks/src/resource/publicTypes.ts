import { FetchShape } from './shapes';

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

/** Get the Params type for a given Shape */
export type ParamsFromShape<S> = S extends {
  fetch: (first: infer A, ...rest: any) => any;
}
  ? A
  : S extends { getFetchKey: (first: infer A, ...rest: any) => any }
  ? A
  : never;
