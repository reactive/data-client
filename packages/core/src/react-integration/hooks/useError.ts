import type { NetworkError, UnknownError } from '@rest-hooks/normalizr';
import { useMemo } from 'react';
import {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';

import { ReadShape, ParamsFromShape } from '../../endpoint/index.js';
import shapeToEndpoint from '../../endpoint/adapter.js';
import useErrorNew from '../newhooks/useError.js';

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
