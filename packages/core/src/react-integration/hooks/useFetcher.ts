import {
  FetchShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
  ReturnFromShape,
} from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/endpoint';
import { useRef, useCallback } from 'react';

import useFetchDispatcher from './useFetchDispatcher';

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IfExact<T, Cond, A, B> = IfAny<
  T,
  B,
  Cond extends T ? (T extends Cond ? A : B) : B
>;

/** Build an imperative dispatcher to issue network requests. */
export default function useFetcher<
  Shape extends FetchShape<Schema, Readonly<object>, any>
>(
  fetchShape: Shape,
  throttle = false,
): IfExact<
  BodyFromShape<Shape>,
  unknown,
  <
    UpdateParams extends OptimisticUpdateParams<
      SchemaFromShape<Shape>,
      FetchShape<any, any, any>
    >[]
  >(
    params: ParamsFromShape<Shape>,
    body?: undefined,
    updateParams?: UpdateParams | undefined,
  ) => ReturnFromShape<typeof fetchShape>,
  <
    UpdateParams extends OptimisticUpdateParams<
      SchemaFromShape<Shape>,
      FetchShape<any, any, any>
    >[]
  >(
    params: ParamsFromShape<Shape>,
    body: BodyFromShape<Shape>,
    updateParams?: UpdateParams | undefined,
  ) => ReturnFromShape<typeof fetchShape>
> {
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
