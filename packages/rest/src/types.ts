import type {
  EndpointInstance,
  FetchFunction,
  Schema,
} from '@rest-hooks/endpoint';

export type RestFetch<A extends readonly any[] = any[], R = any> = (
  this: RestEndpoint,
  ...args: A
) => Promise<R>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type FetchMutate<A extends readonly any[] = [any, {}], R = any> = (
  this: RestEndpoint,
  ...args: A
) => Promise<R>;

export type FetchGet<A extends readonly any[] = [any], R = any> = (
  this: RestEndpoint,
  ...args: A
) => Promise<R>;

/** Endpoint from a Resource
 *
 * Includes additional properties provided by Resource.endpoint()
 */
export interface RestEndpoint<
  F extends FetchFunction = RestFetch,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  U extends any[] = any,
> extends EndpointInstance<F, S, M> {
  url: (...args: U) => string;
  fetchInit: RequestInit;
  useFetchInit: (this: any) => any;
  getFetchInit: (
    this: any,
    body?: RequestInit['body'] | Record<string, any>,
  ) => any;
  method: string;
  signal: AbortSignal | undefined;
}
