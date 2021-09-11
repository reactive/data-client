import type { ResetAction } from '@rest-hooks/core/types';
import { RESET_TYPE } from '@rest-hooks/core/actionTypes';

export default function createReset(): ResetAction {
  return {
    type: RESET_TYPE,
    date: new Date(),
  };
}
