import { FetchShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { StateContext } from '@rest-hooks/core/react-integration/context';
import { selectMeta } from '@rest-hooks/core/state/selectors/index';
import { useContext, useMemo } from 'react';
import { EndpointInterface, FetchFunction } from '@rest-hooks/endpoint';

/**
 * Gets meta for a fetch key.
 * @see https://resthooks.io/docs/api/useMeta
 */
export default function useMeta<
  E extends
    | Pick<EndpointInterface<FetchFunction>, 'key'>
    | Pick<FetchShape<any, any>, 'getFetchKey'>,
  Args extends
    | (E extends { key: any }
        ? readonly [...Parameters<E['key']>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(endpoint: E, ...args: Args) {
  const state = useContext(StateContext);
  const key = args[0]
    ? (endpoint as any).key
      ? (endpoint as any).key(...args)
      : (endpoint as any).getFetchKey(args[0])
    : '';

  return useMemo(() => {
    if (!key) return null;
    return selectMeta(state, key);
  }, [key, state]);
}
