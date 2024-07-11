import { INVALIDATEALL_TYPE } from '../../actionTypes.js';
import type { InvalidateAllAction } from '../../types.js';

export function createInvalidateAll(
  testKey: (key: string) => boolean,
): InvalidateAllAction {
  return {
    type: INVALIDATEALL_TYPE,
    testKey,
  };
}
