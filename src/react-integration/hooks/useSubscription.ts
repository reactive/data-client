import { useContext, useEffect, useRef } from 'react';

import { DispatchContext } from '~/react-integration/context';
import { ReadShape, Schema } from '~/resource';

/** Keeps a resource fresh by subscribing to updates. */
export default function useSubscription<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params, Body>,
  params: Params,
  body?: Body,
  active = true,
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
    if (!active) return;
    const { fetch, schema, getFetchKey, options } = shapeRef.current;
    const url = getFetchKey(params);

    dispatch({
      type: 'rest-hooks/subscribe',
      meta: {
        schema,
        fetch: () => fetch(params, body as Body),
        url,
        frequency: options && options.pollFrequency,
      },
    });
    return () => {
      dispatch({
        type: 'rest-hooks/unsubscribe',
        meta: {
          url,
          frequency: options && options.pollFrequency,
        },
      });
    };
    // serialize params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, body, active, params && fetchShape.getFetchKey(params)]);
}
