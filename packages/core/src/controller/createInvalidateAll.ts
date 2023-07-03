import { INVALIDATEALL_TYPE } from '../actionTypes.js';
import type { InvalidateAllAction } from '../types.js';

export default function createInvalidateAll(
  testKey: (key: string) => boolean,
): InvalidateAllAction {
  return {
    type: INVALIDATEALL_TYPE,
    testKey,
  };
}
