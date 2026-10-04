import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
  ResolveType,
} from '@data-client/core';
import { watch, ref, type Ref } from 'vue';

import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';
import refetchTriggers from './refetchTriggers.js';
import useResponseMeta, { isStale } from './useResponseMeta.js';

type FetchPromise<T = any> = Promise<T> & { resolved: boolean };

const RESOLVED = Object.assign(Promise.resolve(), {
  resolved: true,
}) as FetchPromise;

function trackPromise(promise: Promise<any>): FetchPromise {
  const p = promise as FetchPromise;
  p.resolved = false;
  const r = () => {
    p.resolved = true;
  };
  p.then(r, r);
  return p;
}

/**
 * Fetch an Endpoint if it is not in cache or stale.
 * @see https://dataclient.io/docs/api/useFetch
 */
export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): Readonly<
  Ref<
    FetchPromise<
      E['schema'] extends undefined | null ? ResolveType<E>
      : Denormalize<E['schema']>
    >
  >
>;

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): Readonly<
  Ref<
    | FetchPromise<
        E['schema'] extends undefined | null ? ResolveType<E>
        : DenormalizeNullable<E['schema']>
      >
    | undefined
  >
>;

export default function useFetch(
  endpoint: any,
  ...args: any[]
): Readonly<Ref<FetchPromise | undefined>> {
  const { controller, stateRef, resolvedArgs, argsKey, responseMeta } =
    useResponseMeta(endpoint, args);

  const lastPromise = ref<FetchPromise | undefined>(undefined);
  let lastKey = '';

  const maybeFetch = () => {
    const key = argsKey.value;
    if (!key) {
      lastPromise.value = undefined;
      lastKey = '';
      return;
    }
    if (isStale(responseMeta.value)) {
      lastPromise.value = trackPromise(
        controller.fetch(endpoint, ...resolvedArgs.value),
      );
      lastKey = key;
    } else if (!lastPromise.value || lastKey !== key) {
      lastPromise.value = RESOLVED;
      lastKey = key;
    }
  };

  // Trigger on initial call
  maybeFetch();

  // Also watch for store changes that might require refetch (e.g., invalidation)
  watch(refetchTriggers(responseMeta, stateRef, argsKey), () => {
    maybeFetch();
  });

  return lastPromise;
}
