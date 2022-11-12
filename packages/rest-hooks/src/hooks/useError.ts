import type {
  Schema,
  NetworkError,
  EndpointInterface,
  UnknownError,
  FetchFunction,
} from '@rest-hooks/react';
import { useMemo } from 'react';
import { useError as useErrorNew } from '@rest-hooks/react';

import { ReadShape, ParamsFromShape } from '../endpoint/index.js';
import shapeToEndpoint from '../endpoint/adapter.js';

export type ErrorTypes = NetworkError | UnknownError;

type UseErrorReturn<P> = P extends [null] ? undefined : ErrorTypes | undefined;

/**
 * Get any errors for a given request
 * @see https://resthooks.io/docs/api/useError
 */
export default function useError<
  E extends
    | Pick<
        EndpointInterface<FetchFunction, Schema | undefined, undefined>,
        'key' | 'schema' | 'invalidIfStale'
      >
    | Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>,
  Args extends
    | (E extends { key: any }
        ? readonly [...Parameters<E['key']>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(endpoint: E, ...args: Args): UseErrorReturn<typeof args> {
  const adaptedEndpoint: any = useMemo(() => {
    return shapeToEndpoint(endpoint);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useErrorNew(adaptedEndpoint, ...args);
}
