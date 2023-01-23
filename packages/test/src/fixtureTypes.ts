import type { EndpointInterface, ResolveType } from '@rest-hooks/react';

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

export interface Interceptor<
  E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
  } = EndpointInterface & { testKey(key: string): boolean },
> {
  readonly endpoint: E;
  readonly response: (...args: Parameters<E>) => ResolveType<E>;
  /** Number of miliseconds (or function that returns) to wait before resolving */
  readonly delay?: number | ((...args: Parameters<E>) => number);
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

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
export type SuccessFixture<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = SuccessFixtureEndpoint<E>;
export type ErrorFixture<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = ErrorFixtureEndpoint<E>;
export type Fixture<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> = FixtureEndpoint<E>;
