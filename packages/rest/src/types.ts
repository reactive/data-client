import { Schema } from '@rest-hooks/normalizr';
import { EndpointInstance, FetchFunction } from '@rest-hooks/endpoint';

/** Endpoint from a Resource
 *
 * Includes additional properties provided by Resource.endpoint()
 */
export interface RestEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined
> extends EndpointInstance<F, S, M> {
  url: (urlParams: Readonly<Record<string, any>>) => string;
  fetchInit: RequestInit;
  useFetchInit: (this: any) => any;
  getFetchInit: (
    this: any,
    body?: RequestInit['body'] | Record<string, any>,
  ) => any;
  method: string;
  signal: AbortSignal | undefined;
}
