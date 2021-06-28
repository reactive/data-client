import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint';
import { NetworkError, UnknownError } from '@rest-hooks/core/types';
import { StateContext } from '@rest-hooks/core/react-integration/context';
import { useContext } from 'react';
import { selectMeta } from '@rest-hooks/core/state/selectors';

export type ErrorTypes = NetworkError | UnknownError;

type UseErrorReturn<P> = P extends null ? undefined : ErrorTypes | undefined;

/**
 * Get any errors for a given request
 * @see https://resthooks.io/docs/api/useError
 */
export default function useError<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>,
>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
): UseErrorReturn<typeof params> {
  const state = useContext(StateContext);
  const key = params ? fetchShape.getFetchKey(params) : '';

  if (!key) return;

  const meta = selectMeta(state, key);
  const results = state.results[key];

  if (results !== undefined && meta?.errorPolicy === 'soft') return;

  return meta?.error as any;
}
