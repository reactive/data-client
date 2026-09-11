export { MemoCache, INVALID } from '@data-client/normalizr';
export { initialState } from './state/reducer/initialState.js';
export {
  diffState,
  applyStateDelta,
  selectBaseline,
  createHydrate,
} from './state/stream/index.js';
