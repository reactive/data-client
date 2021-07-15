import type {
  EndpointInstance,
  FetchFunction,
  Schema,
} from '@rest-hooks/endpoint';

export type RestFetch<P = any, B = any, R = any> = (
  this: RestEndpoint,
  params?: P,
  body?: B,
  ...rest: any
) => Promise<R>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type FetchMutate<P = any, B = {}, R = any> = (
  this: RestEndpoint,
  params: P,
  body: B,
) => Promise<R>;

export type FetchGet<P = any, R = any> = (
  this: RestEndpoint,
  params: P,
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
  paginated?: <T>(this: T, ...args: any) => T;
}

export type Paginatable<
  E extends EndpointInstance<
    FetchFunction,
    Schema | undefined,
    true | undefined
  >,
> = E & {
  paginated(
    this: E,
    removeCursor: (...args: Parameters<E>) => any,
  ): Paginatable<E>;
};
