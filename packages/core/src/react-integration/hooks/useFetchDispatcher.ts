import { Schema } from '@rest-hooks/normalizr';
import { useContext, useCallback } from 'react';

import {
  FetchShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
  ReturnFromShape,
} from '../../endpoint/index.js';
import { DispatchContext } from '../context.js';
import createFetch from '../../state/actions/createFetch.js';

/** Build an imperative dispatcher to issue network requests.
 * @deprecated use https://resthooks.io/docs/api/Controller#fetch
 */
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
      dispatch(action);
      return action.meta.promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
