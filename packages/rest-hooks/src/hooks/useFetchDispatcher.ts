import type { Schema } from '@rest-hooks/react';
import { DispatchContext, __INTERNAL__ } from '@rest-hooks/react';
import { useContext, useCallback } from 'react';

import {
  FetchShape,
  ParamsFromShape,
  BodyFromShape,
  ReturnFromShape,
} from '../endpoint/index.js';

const { createFetch } = __INTERNAL__;

/** Build an imperative dispatcher to issue network requests.
 * @deprecated use https://resthooks.io/docs/api/Controller#fetch
 */
export default function useFetchDispatcher(throttle = false): <
  Shape extends FetchShape<Schema, Readonly<object>, any>,
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
  params: ParamsFromShape<Shape>,
  body: BodyFromShape<Shape>,
) => ReturnFromShape<typeof fetchShape> {
  const dispatch = useContext(DispatchContext);

  const fetchDispatcher = useCallback(
    <Shape extends FetchShape<Schema, Readonly<object>, any>>(
      fetchShape: Shape,
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
    ) => {
      const action = createFetch(fetchShape, {
        params,
        body,
        throttle,
      });
      dispatch(action);
      return action.meta.promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
