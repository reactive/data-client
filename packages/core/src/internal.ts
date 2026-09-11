export { MemoCache, INVALID } from '@data-client/normalizr';
export { initialState } from './state/reducer/initialState.js';
export {
  diffState,
  applyStateDelta,
  selectBaseline,
  createHydrate,
  overlayState,
} from './state/stream/index.js';
