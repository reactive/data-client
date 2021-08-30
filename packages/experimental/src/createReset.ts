import { actionTypes } from '@rest-hooks/core';
import type { ResetAction } from '@rest-hooks/core';

export default function createReset(): ResetAction {
  return {
    type: actionTypes.RESET_TYPE,
    date: new Date(),
  };
}
