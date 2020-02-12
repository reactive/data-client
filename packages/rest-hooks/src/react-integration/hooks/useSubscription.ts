import { useContext, useEffect, useRef } from 'react';

import { DispatchContext } from '~/react-integration/context';
import { ReadShape, Schema } from '~/resource';
import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '~/actionTypes';

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
    const url = getFetchKey(params);

    dispatch({
      type: SUBSCRIBE_TYPE,
      meta: {
        schema,
        fetch: () => fetch(params),
        url,
        options,
      },
    });
    return () => {
      dispatch({
        type: UNSUBSCRIBE_TYPE,
        meta: {
          url,
          options,
        },
      });
    };
    // serialize params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, params && fetchShape.getFetchKey(params)]);
}
