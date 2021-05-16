import { useContext, useMemo } from 'react';
import { StateContext, State } from '@rest-hooks/core';

/** Use selector to access part of state */
export default function useSelectionUnstable<
  Params extends Readonly<object> | Readonly<object>[],
  F extends (state: State<unknown>, params: Params) => any,
>(
  select: F,
  params: Params | null,
  paramSerializer: (p: Params) => string = p => JSON.stringify(p),
): ReturnType<F> | null {
  const state = useContext(StateContext);
  // TODO: if this is identical to before and render was triggered by state update,
  // we should short-circuit entire rest of render

  // params must be serialized in check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selection = useMemo(
    () => params && select(state, params),
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      params && paramSerializer(params),
      select,
      state,
    ],
  );
  return selection;
}
