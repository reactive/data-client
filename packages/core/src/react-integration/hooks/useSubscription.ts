import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '@rest-hooks/core/actionTypes';
import { useContext, useEffect, useRef } from 'react';

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
export default function useSubscription<Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
) {
  const dispatch = useContext(DispatchContext);
  /*
  we just want the current values when we dispatch, so
  box the shape in a ref to make react-hooks/exhaustive-deps happy

  "Although useEffect is deferred until after the browser has painted, it’s guaranteed to fire before any new renders.
  React will always flush a previous render’s effects before starting a new update." - https://reactjs.org/docs/hooks-reference.html#useeffect
  */
  const shapeRef = useRef(fetchShape);
  shapeRef.current = fetchShape;

  useEffect(() => {
    if (!params) return;
    const { schema, getFetchKey, options } = shapeRef.current;
    const key = getFetchKey(params);

    dispatch({
      type: SUBSCRIBE_TYPE,
      meta: {
        schema,
        fetch: () => shapeRef.current.fetch(params),
        key,
        options,
      },
    });
    return () => {
      dispatch({
        type: UNSUBSCRIBE_TYPE,
        meta: {
          key,
          options,
        },
      });
    };
    // serialize params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, params && fetchShape.getFetchKey(params)]);
}
