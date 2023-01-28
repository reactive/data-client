import {
  DenormalizeNullable,
  ResolveType,
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';

export type SuspenseReturn<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
> = Args extends [null]
  ? E['schema'] extends undefined | null
    ? undefined
    : DenormalizeNullable<E['schema']>
  : E['schema'] extends undefined | null
  ? ResolveType<E>
  : Denormalize<E['schema']>;
