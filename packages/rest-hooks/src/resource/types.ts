import { Entity } from '@rest-hooks/normalizr';

import { Schema } from './normal';
import { FetchShape, DeleteShape } from './shapes';

export type SchemaFromShape<
  F extends FetchShape<any, any, any>
> = F extends FetchShape<infer S, any, any> ? S : never;

export type BodyFromShape<
  F extends FetchShape<any, any, any>
> = F extends FetchShape<any, any, infer B> ? B : never;

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
