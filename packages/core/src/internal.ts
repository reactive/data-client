export { MemoCache, INVALID } from '@data-client/normalizr';
export { initialState } from './state/reducer/initialState.js';
export {
  diffState,
  applyStateDelta,
  selectBaseline,
  HYDRATE,
  createHydrate,
  hydrateReducer,
  overlayState,
} from './state/stream/index.js';
export type { HydrateAction } from './state/stream/index.js';
