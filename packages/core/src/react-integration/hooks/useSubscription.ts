import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/normalizr';
import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '@rest-hooks/core/actionTypes';
import { useContext, useEffect, useRef } from 'react';

/** Keeps a resource fresh by subscribing to updates. */
export default function useSubscription<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
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
    const { fetch, schema, getFetchKey, options } = shapeRef.current;
    const key = getFetchKey(params);

    dispatch({
      type: SUBSCRIBE_TYPE,
      meta: {
        schema,
        fetch: () => fetch(params),
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
