import type { EndpointInterface, ResolveType } from '@data-client/endpoint';

type Updater = (
  result: any,
  ...args: any
) => Record<string, (...args: any) => any>;

export interface SuccessFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  readonly endpoint: E;
  readonly args: Parameters<E>;
  readonly response:
    | ResolveType<E>
    | ((...args: Parameters<E>) => ResolveType<E>);
  readonly error?: false;
  /** Number of miliseconds to wait before resolving */
  readonly delay?: number;
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

export interface ResponseInterceptor<
  T = any,
  E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
  } = EndpointInterface & { testKey(key: string): boolean },
> {
  readonly endpoint: E;
  response(this: T, ...args: Parameters<E>): ResolveType<E>;
  /** Number of miliseconds (or function that returns) to wait before resolving */
  readonly delay?: number | ((...args: Parameters<E>) => number);
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}
export interface FetchInterceptor<
  T = any,
  E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
  } = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
  },
> {
  readonly endpoint: E;
  fetchResponse(this: T, input: RequestInfo, init: RequestInit): ResolveType<E>;
  /** Number of miliseconds (or function that returns) to wait before resolving */
  readonly delay?: number | ((...args: Parameters<E>) => number);
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}
/** Interceptors match and compute dynamic responses based on args
 *
 * @see https://dataclient.io/docs/api/Fixtures#interceptor
 */
export type Interceptor<
  T = any,
  E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse?(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend?(options: any): any;
  } = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
  },
> =
  | ResponseInterceptor<T, E>
  | (E extends (
      {
        fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
        extend(options: any): any;
      }
    ) ?
      FetchInterceptor<T, E>
    : never);

export interface ErrorFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  readonly endpoint: E;
  readonly args: Parameters<E>;
  readonly response: any;
  readonly error: true;
  /** Number of miliseconds to wait before resolving */
  readonly delay?: number;
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

export type FixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = SuccessFixtureEndpoint<E> | ErrorFixtureEndpoint<E>;

/** Represents a successful response
 *
 * @see https://dataclient.io/docs/api/Fixtures#successfixture
 */
export type SuccessFixture<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = SuccessFixtureEndpoint<E>;
/** Represents a failed/errored response
 *
 * @see https://dataclient.io/docs/api/Fixtures#errorfixtures
 */
export type ErrorFixture<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = ErrorFixtureEndpoint<E>;
/** Represents a static response
 *
 * @see https://dataclient.io/docs/api/Fixtures
 */
export type Fixture<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = FixtureEndpoint<E>;
