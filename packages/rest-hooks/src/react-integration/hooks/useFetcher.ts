import {
  FetchShape,
  DeleteShape,
  Schema,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
} from 'rest-hooks/resource';
import { DispatchContext } from 'rest-hooks/react-integration/context';
import createFetch, {
  OptimisticUpdateParams,
} from 'rest-hooks/state/actions/createFetch';
import { useContext, useRef, useCallback } from 'react';

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
): Shape extends DeleteShape<any, any, any>
  ? (
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
    ) => ReturnType<typeof fetchShape['fetch']>
  : <
      UpdateParams extends OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<any, any, any>
      >[]
    >(
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
      updateParams?: UpdateParams | undefined,
    ) => ReturnType<typeof fetchShape['fetch']> {
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
      const action = createFetch(
        shapeRef.current,
        params,
        body,
        throttle,
        updateParams,
      );
      dispatch(action);
      return action.meta.promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
