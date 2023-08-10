import { EXPIREALL_TYPE } from '../actionTypes.js';
import type { ExpireAllAction } from '../types.js';

export default function createExpireAll(
  testKey: (key: string) => boolean,
): ExpireAllAction {
  return {
    type: EXPIREALL_TYPE,
    testKey,
  };
}
