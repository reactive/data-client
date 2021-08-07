import {
  FetchShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
  ReturnFromShape,
} from '@rest-hooks/core/endpoint/index';
import { Schema } from '@rest-hooks/endpoint';
import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import createFetch from '@rest-hooks/core/state/actions/createFetch';
import { useContext, useCallback } from 'react';

/** Build an imperative dispatcher to issue network requests. */
export default function useFetchDispatcher(throttle = false): <
  Shape extends FetchShape<Schema, Readonly<object>, any>,
  UpdateParams extends OptimisticUpdateParams<
    SchemaFromShape<Shape>,
    FetchShape<any, any, any>
  >[],
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
  params: ParamsFromShape<Shape>,
  body: BodyFromShape<Shape>,
  updateParams?: UpdateParams | undefined,
) => ReturnFromShape<typeof fetchShape> {
  const dispatch = useContext(DispatchContext);

  const fetchDispatcher = useCallback(
    <Shape extends FetchShape<Schema, Readonly<object>, any>>(
      fetchShape: Shape,
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
      updateParams?:
        | OptimisticUpdateParams<
            SchemaFromShape<Shape>,
            FetchShape<any, any, any>
          >[]
        | undefined,
    ) => {
      const action = createFetch(fetchShape, {
        params,
        body,
        throttle,
        updateParams,
      });
      console.log('dispatching', action);
      dispatch(action);
      return action.meta.promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
