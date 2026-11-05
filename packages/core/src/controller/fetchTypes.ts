import type {
  Denormalize,
  EndpointInterface,
  ResolveType,
} from '@data-client/normalizr';

import type { EndpointUpdateFunction } from './types.js';

// not exported from the package: users call Controller.fetch, never name its type
//
// Workaround: the result depends on the args (a list body resolves a list), but a type can't
// compute a function's result from given argument types, or pick one of an endpoint's overloads
// by them (Parameters/ReturnType only see the last one). Only a call's own overloads can, so the
// list signatures live here instead of on the endpoint or schema. Each fetch call tries them first,
// which costs a few instantiations per call. Revisit if TypeScript adds such a type operator:
// https://github.com/microsoft/TypeScript/issues/26043
// https://github.com/microsoft/TypeScript/issues/40179

/** Body members that are lists (ListBody true) or not (false) */
type BodyPart<B, ListBody extends boolean> =
  ListBody extends true ? Extract<B, readonly any[]>
  : Exclude<B, readonly any[]>;

/** Each args member ending in a body, (body) or (params, body) like RestEndpoint's, with the body
 * narrowed to its list or non-list members; never when it has none. Other args are kept as the
 * non-list signatures.
 *
 * Fixed lengths since TS < 4.2 has no leading-rest tuples. Indexes instead of `infer`, which
 * TS < 4.2 fails to resolve here while inferring a call, losing the list signatures */
type BodyArgs<A, ListBody extends boolean> =
  A extends readonly [any] ?
    [BodyPart<A[0], ListBody>] extends [never] ?
      never
    : readonly [BodyPart<A[0], ListBody>]
  : A extends readonly [any, any] ?
    [BodyPart<A[1], ListBody>] extends [never] ?
      never
    : readonly [A[0], BodyPart<A[1], ListBody>]
  : ListBody extends true ? never
  : A;

/** Rest args longer than any endpoint call's, so a signature using them is skipped by arity instead of reporting errors */
type NoCall = readonly [
  never,
  never,
  never,
  never,
  never,
  never,
  never,
  never,
  never,
  never,
];

/** Adds an all-never twin of each args member, so a union that would collapse to one member
 * still reports errors over all args, like the endpoint's own union of signatures does */
type KeepUnion<A> = A | { readonly [K in keyof A]: never };

/** Args of an endpoint whose schema adds to a list (like Collection.push) and whose
 * body can be a list (like RestEndpoint.push); NoCall for every other endpoint
 *
 * ListBody: true for the signatures with a list body, false for the rest */
type AdderArgs<E extends (...args: any) => any, ListBody extends boolean> =
  E extends { schema: { _denormalizeList(): any } } ?
    [BodyArgs<Parameters<E>, true>] extends [never] ?
      NoCall
    : KeepUnion<BodyArgs<Parameters<E>, ListBody>>
  : NoCall;

/** Resolved value of a (union member) endpoint: its schema's, or its own when it has none */
type SchemaResult<E extends (...args: any) => any> =
  E extends { schema: infer S } ?
    [S] extends [undefined | null] ?
      ResolveType<E>
    : Denormalize<S>
  : ResolveType<E>;

export interface ControllerFetch {
  /**
   * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
   * @see https://dataclient.io/docs/api/Controller#fetch
   */
  <E extends (...args: any) => any>(
    endpoint: E,
    // a single (or `any`) body on an endpoint that adds to a list;
    // other endpoints skip this signature by arity, so their errors stay those of the last one
    ...args: AdderArgs<E, false>
  ): Promise<SchemaResult<E>>;
  /**
   * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
   *
   * A list body on a schema that adds to a list (like Collection.push) resolves a list.
   * The body is the last argument, after at most one params argument.
   * @see https://dataclient.io/docs/api/Controller#fetch
   */
  <E extends (...args: any) => any>(
    endpoint: E,
    ...args: AdderArgs<E, true>
  ): Promise<
    E extends { schema: { _denormalizeList(): infer L } } ? L : SchemaResult<E>
  >;
  /**
   * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
   * @see https://dataclient.io/docs/api/Controller#fetch
   */
  <E extends EndpointInterface & { update?: EndpointUpdateFunction<E> }>(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): E['schema'] extends undefined | null ? ReturnType<E>
  : Promise<Denormalize<E['schema']>>;
}
