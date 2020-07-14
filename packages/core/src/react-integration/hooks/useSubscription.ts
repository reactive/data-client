import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/normalizr';
import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '@rest-hooks/core/actionTypes';
import { useContext, useEffect, useRef } from 'react';
import { EndpointParam, EndpointInterface } from '@rest-hooks/endpoint';

/** Keeps a resource fresh by subscribing to updates. */
export default function useSubscription<E extends EndpointInterface>(
  endpoint: E,
  params: EndpointParam<E> | null,
) {
  const dispatch = useContext(DispatchContext);
  /*
  we just want the current values when we dispatch, so
  box the shape in a ref to make react-hooks/exhaustive-deps happy

  "Although useEffect is deferred until after the browser has painted, it’s guaranteed to fire before any new renders.
  React will always flush a previous render’s effects before starting a new update." - https://reactjs.org/docs/hooks-reference.html#useeffect
  */
  const shapeRef = useRef(endpoint);
  shapeRef.current = endpoint;

  useEffect(() => {
    if (!params) return;
    const { schema, key, options } = shapeRef.current;

    dispatch({
      type: SUBSCRIBE_TYPE,
      meta: {
        schema,
        fetch: () => endpoint(params),
        key: key(params),
        options,
      },
    });
    return () => {
      dispatch({
        type: UNSUBSCRIBE_TYPE,
        meta: {
          key: key(params),
          options,
        },
      });
    };
    // serialize params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, params && endpoint.key(params)]);
}
