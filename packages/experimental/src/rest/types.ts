import type {
  EndpointInstance,
  EndpointInterface,
  FetchFunction,
  Schema,
} from '@rest-hooks/endpoint';

export type RestFetch<A extends readonly any[] = any[], R = any> = (
  this: RestEndpoint,
  ...args: A
) => Promise<R>;

export type FetchMutate<
  A extends readonly any[] =  // eslint-disable-next-line @typescript-eslint/ban-types
    | [any, {}]
    // eslint-disable-next-line @typescript-eslint/ban-types
    | [{}],
  R = any,
> = (this: RestEndpoint, ...args: A) => Promise<R>;

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
> extends EndpointInstance<F, S, M> {
  url: (...args: Parameters<F>) => string;
  fetchInit: RequestInit;
  getFetchInit: (
    this: any,
    body?: RequestInit['body'] | Record<string, any>,
  ) => any;
  method: string;
  signal: AbortSignal | undefined;
}

export type Paginatable<
  E extends EndpointInterface<RestFetch, Schema | undefined, true | undefined>,
> = E & {
  paginated<T extends E>(
    this: T,
    removeCursor: (...args: Parameters<E>) => any[],
  ): T;
};
