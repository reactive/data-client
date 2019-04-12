import { useContext, useEffect } from 'react';

import { DispatchContext } from '../context';
import { ReadShape, Schema } from '../../resource';

/** Keeps a resource fresh by subscribing to updates. */
export default function useSubscription<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(requestShape: ReadShape<S, Params, Body>, params: Params, body?: Body) {
  const { fetch, schema, getUrl, options } = requestShape;
  const url = getUrl(params);
  const dispatch = useContext(DispatchContext);

  useEffect(() => {
    dispatch({
      type: 'subscribe',
      meta: {
        schema,
        fetch: () => fetch(url, body as Body),
        url,
        frequency: options && options.pollFrequency,
      },
    });
    return () => {
      dispatch({
        type: 'unsubscribe',
        meta: {
          url,
          frequency: options && options.pollFrequency,
        },
      });
    };
  }, [dispatch, fetch, schema, url, options, body]);
}
