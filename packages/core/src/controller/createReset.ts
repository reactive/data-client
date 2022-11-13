import { RESET_TYPE } from '../actionTypes.js';
import type { ResetAction } from '../types.js';

export default function createReset(): ResetAction {
  return {
    type: RESET_TYPE,
    date: Date.now(),
  };
}
