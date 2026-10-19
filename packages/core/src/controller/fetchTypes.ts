import type { Denormalize, EndpointInterface } from '@data-client/normalizr';

import type { EndpointUpdateFunction } from './types.js';

// not exported from the package: users call Controller.fetch, never name its type

/** Args ending in a list body: (body) or (params, body), like RestEndpoint's.
 * Fixed lengths since TS < 4.2 has no leading-rest tuples */
type ListBodyArgs = readonly [readonly any[]] | readonly [any, readonly any[]];

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
 * still reports errors over all args, like the endpoint's own (split by body) union does */
type KeepUnion<A> = A | { readonly [K in keyof A]: never };

/** Args of an endpoint whose schema adds to a list (like Collection.push) and has
 * call signatures with list bodies (like RestEndpoint.push); NoCall for every other endpoint */
type AdderArgs<E extends (...args: any) => any, A> =
  E extends { schema: { _denormalizeList(): any } } ?
    [Extract<Parameters<E>, ListBodyArgs>] extends [never] ?
      NoCall
    : KeepUnion<A>
  : NoCall;

type SchemaResult<E> = E extends { schema: infer S } ? Denormalize<S> : never;

export interface ControllerFetch {
  /**
   * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
   * @see https://dataclient.io/docs/api/Controller#fetch
   */
  <E extends (...args: any) => any>(
    endpoint: E,
    // a single (or `any`) body on an endpoint that adds to a list;
    // other endpoints skip this signature by arity, so their errors stay those of the last one
    ...args: AdderArgs<E, Exclude<Parameters<E>, ListBodyArgs>>
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
    ...args: AdderArgs<E, Extract<Parameters<E>, ListBodyArgs>>
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
