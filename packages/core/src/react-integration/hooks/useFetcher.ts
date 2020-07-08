import {
  FetchShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
  ReturnFromShape,
} from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/normalizr';
import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import createFetch from '@rest-hooks/core/state/actions/createFetch';
import { useContext, useRef, useCallback } from 'react';

type IfExact<T, Cond, A, B> = Cond extends T ? (T extends Cond ? A : B) : B;

/** Build an imperative dispatcher to issue network requests. */
export default function useFetcher<
  Shape extends FetchShape<
    Schema,
    Readonly<object>,
    Readonly<object | string> | void
  >
>(
  fetchShape: Shape,
  throttle = false,
): IfExact<
  BodyFromShape<Shape>,
  undefined,
  (params: ParamsFromShape<Shape>) => ReturnFromShape<typeof fetchShape>,
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
  const dispatch = useContext(DispatchContext);

  // we just want the current values when we dispatch, so
  // box the shape in a ref to make react-hooks/exhaustive-deps happy
  const shapeRef = useRef(fetchShape);
  shapeRef.current = fetchShape;

  const fetchDispatcher = useCallback(
    (
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
      updateParams?:
        | OptimisticUpdateParams<
            SchemaFromShape<Shape>,
            FetchShape<any, any, any>
          >[]
        | undefined,
    ) => {
      const action = createFetch(shapeRef.current, {
        params,
        body,
        throttle,
        updateParams,
      });
      dispatch(action);
      return action.meta.promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
