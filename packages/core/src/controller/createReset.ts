import type { ResetAction } from '../types.js';
import { RESET_TYPE } from '../actionTypes.js';

export default function createReset(): ResetAction {
  return {
    type: RESET_TYPE,
    date: Date.now(),
  };
}
