import { StateContext } from '@rest-hooks/core/react-integration/context';
import { selectMeta } from '@rest-hooks/core/state/selectors';
import { useContext, useMemo } from 'react';
import { EndpointInterface } from '@rest-hooks/endpoint';

/** Gets meta for a fetch key. */
export default function useMeta<Params extends Readonly<object>>(
  {
    key,
  }: Pick<EndpointInterface<(params: Params, ...rest: any) => any>, 'key'>,
  params: Params | null,
) {
  const state = useContext(StateContext);
  const responseKey = params ? key(params) : '';

  return useMemo(() => {
    if (!responseKey) return null;
    return selectMeta(state, responseKey);
  }, [responseKey, state]);
}
