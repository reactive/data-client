import Resource from './Resource';
import { State } from '../types';
import { Schema } from 'normalizr';

export interface RequestShape<
  Param extends Readonly<object>,
  Payload extends Readonly<object> | void
> {
  select(state: State<Resource>, params: Param): any;
  getUrl(params: Param): string;
  readonly schema: Schema;
  fetch(url: string, body: Payload): Promise<any>;
  readonly mutate: boolean;
}
export type ResultShape<T> = T extends { schema: infer U } ? U : never;
export type SelectReturn<T> = T extends { select: (...args: any[]) => infer U }
  ? U
  : never;
export type AlwaysSelect<T> = NonNullable<SelectReturn<T>>;
export type ParamArg<T> = T extends {
  select: (a: any, b: infer U) => any;
}
  ? U
  : never;
export type PayloadArg<T> = T extends {
  fetch: (a: any, c: infer U) => any;
}
  ? U
  : never;

export { Resource };
