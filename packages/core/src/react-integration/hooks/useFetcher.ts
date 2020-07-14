import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import createFetch from '@rest-hooks/core/state/actions/createFetch';
import { useContext, useRef, useCallback } from 'react';
import {
  EndpointInterface,
  OptimisticUpdateParams,
  FetchFunction,
} from '@rest-hooks/endpoint';

type IfExact<T, Cond, A, B> = Cond extends T ? (T extends Cond ? A : B) : B;

type UserFetcherFunction<
  E extends EndpointInterface<FetchFunction, any, any>
> = IfExact<
  Parameters<E>[1],
  undefined,
  (params: Parameters<E>[0]) => ReturnType<E>,
  E['schema'] extends undefined
    ? (params: Parameters<E>[0], body: Parameters<E>[1]) => ReturnType<E>
    : <
        UpdateParams extends OptimisticUpdateParams<
          E['schema'],
          EndpointInterface<any, any, any>
        >[]
      >(
        params: Parameters<E>[0],
        body: Parameters<E>[1],
        updateParams?: UpdateParams | undefined,
      ) => ReturnType<E>
>;

/** Build an imperative dispatcher to issue network requests. */
export default function useFetcher<E extends EndpointInterface>(
  endpoint: E,
  throttle = false,
): UserFetcherFunction<E> {
  const dispatch = useContext(DispatchContext);

  // we just want the current values when we dispatch, so
  // box the shape in a ref to make react-hooks/exhaustive-deps happy
  const shapeRef = useRef(endpoint);
  shapeRef.current = endpoint;

  const fetchDispatcher = useCallback(
    (
      params: Parameters<E>[0],
      body: Parameters<E>[1],
      updateParams?: E['schema'] extends undefined
        ? undefined
        :
            | OptimisticUpdateParams<
                E['schema'],
                EndpointInterface<any, any, any>
              >[]
            | undefined,
    ) => {
      const action = createFetch(shapeRef.current, {
        params,
        body,
        throttle,
        updateParams,
      });
      dispatch(action as any);
      return action.meta.promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
