import { orderedNow } from './orderedNow.js';
import { RESET } from '../../actionTypes.js';
import type { ResetAction } from '../../types.js';

export function createReset(): ResetAction {
  return {
    type: RESET,
    date: orderedNow(),
  };
}
