import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/normalizr';
import {
  ReadEndpoint,
  EndpointParam,
  EndpointInterface,
} from '@rest-hooks/endpoint';

import useMeta from './useMeta';

type UseErrorReturn<P> = P extends null
  ? undefined
  : Error & { status?: number };

/** Access a resource or error if failed to get it */
export default function useError<E extends Omit<EndpointInterface, 'fetch'>>(
  endpoint: E,
  params: EndpointParam<E> | null,
  cacheReady: boolean,
): UseErrorReturn<typeof params> {
  const meta = useMeta(endpoint, params);
  if (!params) return;
  if (!cacheReady) {
    if (!meta) return;
    // this means the response is missing an expected entity
    if (!meta.error && !meta.invalidated) {
      let error: Error & { status?: number };
      if (process.env.NODE_ENV !== 'production') {
        error = new Error(
          `Entity from "${endpoint.key(params)}" not found in cache.

        This is likely due to a malformed response.
        Try inspecting the network response or fetch() return value.

        Schema: ${JSON.stringify(endpoint.schema, null, 2)}`,
        );
      } else {
        error = new Error(
          `Missing required entity in "${endpoint.key(
            params,
          )}" likely due to malformed response.`,
        );
      }
      error.status = 400;
      return error as any;
    } else {
      return meta.error as any;
    }
  }
}
