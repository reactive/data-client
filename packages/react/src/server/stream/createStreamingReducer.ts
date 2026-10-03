import { createReducer, __INTERNAL__ } from '@data-client/core';
import type { ActionTypes, Controller, State } from '@data-client/core';

const { hydrateReducer, HYDRATE, initialState } = __INTERNAL__;

type MasterReducer = ReturnType<typeof createReducer>;
type HydrateAction = ReturnType<typeof __INTERNAL__.createHydrate>;
export type StreamingAction = ActionTypes | HydrateAction;
export type StreamingReducer = (
  state: State<unknown> | undefined,
  action: StreamingAction,
) => State<unknown>;
export type StreamingDispatch = (action: StreamingAction) => Promise<void>;

/**
 * Closed master-plus-HYDRATE reducer for streaming adapters.
 *
 * Public DataProvider uses core createReducer. Only ./nextjs and the
 * generic streaming wrapper compose this factory.
 */
export default function createStreamingReducer(
  controller: Controller,
): StreamingReducer {
  const master: MasterReducer = createReducer(controller);
  return (state, action) =>
    action.type === HYDRATE ?
      hydrateReducer(state ?? initialState, action)
    : master(state, action);
}
