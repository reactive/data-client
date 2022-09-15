import { Schema } from '@rest-hooks/normalizr';
import { useRef, useCallback } from 'react';

import {
  FetchShape,
  SchemaFromShape,
  OptimisticUpdateParams,
  ReturnFromShape,
} from '../../endpoint/index.js';
import useFetchDispatcher from './useFetchDispatcher.js';

/**
 * Build an imperative dispatcher to issue network requests.
 * @deprecated use https://resthooks.io/docs/api/Controller#fetch
 */
export default function useFetcher<
  Shape extends FetchShape<Schema, Readonly<object>, any>,
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
  throttle = false,
): <
  UpdateParams extends OptimisticUpdateParams<
    SchemaFromShape<Shape>,
    FetchShape<any, any, any>
  >[],
>(
  a: Parameters<Shape['fetch']>[0],
  b?: Parameters<Shape['fetch']>[1],
  updateParams?: UpdateParams | undefined,
) => ReturnFromShape<typeof fetchShape> {
  const dispatchFetcher: any = useFetchDispatcher(throttle);

  // we just want the current values when we dispatch, so
  // box the shape in a ref to make react-hooks/exhaustive-deps happy
  const shapeRef = useRef(fetchShape);
  shapeRef.current = fetchShape;

  const fetchDispatcher = useCallback(
    (...args: any) => dispatchFetcher(shapeRef.current, ...args),
    [dispatchFetcher],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
