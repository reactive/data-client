import { useDenormalized } from '@rest-hooks/core/state/selectors';
import { useContext, useMemo } from 'react';
import { StateContext } from '@rest-hooks/core/react-integration/context';
import {
  hasUsableData,
  useMeta,
  useError,
} from '@rest-hooks/core/react-integration/hooks';
import { denormalize } from '@rest-hooks/normalizr';
import buildInferredResults from '@rest-hooks/core/state/selectors/buildInferredResults';
import { EndpointInterface, EndpointParam } from '@rest-hooks/endpoint';

import useExpiresAt from './useExpiresAt';

/** Access a resource if it is available. */
export default function useCache<E extends Omit<EndpointInterface, 'fetch'>>(
  endpoint: E,
  params: EndpointParam<E>,
) {
  const expiresAt = useExpiresAt(endpoint, params);

  const state = useContext(StateContext);
  const [denormalized, ready, deleted] = useDenormalized(
    endpoint,
    params,
    state,
  );
  const error = useError(endpoint, params, ready);
  const trigger = deleted && !error;

  /*********** This block is to ensure results are only filled when they would not suspend **************/
  // This computation reflects the behavior of useResource/useRetrive
  // It only changes the value when expiry or params change.
  // This way, random unrelated re-renders don't cause the concept of expiry
  // to change
  const expired = useMemo(() => {
    if ((Date.now() <= expiresAt && !trigger) || !params) return false;
    return true;
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, params && endpoint.key(params), trigger]);

  // if useResource() would suspend, don't include entities from cache
  if (
    !hasUsableData(
      endpoint,
      ready,
      deleted,
      useMeta(endpoint, params)?.invalidated,
    ) &&
    expired &&
    endpoint.schema
  ) {
    return denormalize(
      buildInferredResults(endpoint.schema, params, state.indexes),
      endpoint.schema,
      {},
    )[0];
  }
  /*********************** end block *****************************/

  return denormalized;
}
