import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { NetworkError, UnknownError } from '@rest-hooks/core/types';
import { StateContext } from '@rest-hooks/core/react-integration/context';
import { useContext, useMemo } from 'react';
import useController from '@rest-hooks/core/react-integration/hooks/useController';
import shapeToEndpoint from '@rest-hooks/core/endpoint/adapter';

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

  const controller = useController();

  const endpoint = useMemo(() => {
    return shapeToEndpoint(fetchShape);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return controller.getError(endpoint, params, state) as any;
}
