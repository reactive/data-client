import {
  DenormalizeNullable,
  ResolveType,
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@data-client/core';

/* Inlining this on unions does not work for some reason, so make it a generic type to call */
export type CondNull<P, A, B> = P extends null ? A : B;

export type SuspenseReturn<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
> = CondNull<
  Args[0],
  E['schema'] extends undefined | null
    ? undefined
    : DenormalizeNullable<E['schema']>,
  E['schema'] extends undefined | null
    ? ResolveType<E>
    : Denormalize<E['schema']>
>;
