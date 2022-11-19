/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DenormalizeNullable, ResolveType } from '@rest-hooks/normalizr';
import {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';

import useSubscription from './useSubscription.js';
import useSuspense from './useSuspense.js';

/**
 * Ensure an endpoint is available. Keeps it fresh once it is.
 *
 * useSuspense() + useSubscription()
 * @see https://resthooks.io/docs/api/useLive
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
export default function useLive<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): Args extends [null]
  ? E['schema'] extends Exclude<Schema, null>
    ? DenormalizeNullable<E['schema']>
    : undefined
  : E['schema'] extends Exclude<Schema, null>
  ? Denormalize<E['schema']>
  : ResolveType<E> {
  useSubscription(endpoint, ...args);
  return useSuspense(endpoint, ...args);
}
