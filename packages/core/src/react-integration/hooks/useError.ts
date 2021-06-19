import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint';
import { NetworkError, UnknownError } from '@rest-hooks/core/types';

import useMeta from './useMeta';

export interface SyntheticError extends Error {
  status: number;
  response?: undefined;
  synthetic: true;
}

interface NSNetworkError extends NetworkError {
  synthetic?: undefined | false;
}

interface NSUnknownError extends UnknownError {
  synthetic?: undefined | false;
}

export type ErrorTypes = (NSNetworkError | NSUnknownError) | SyntheticError;

type UseErrorReturn<P> = P extends null ? undefined : ErrorTypes | undefined;

/** Access a resource or error if failed to get it */
export default function useError<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>,
>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
): UseErrorReturn<typeof params> {
  const meta = useMeta(fetchShape, params);
  if (!params) return;
  return meta?.error as any;
}
