import { INVALIDATEALL } from '../../actionTypes.js';
import type { InvalidateAllAction } from '../../types.js';

export function createInvalidateAll(
  testKey: (key: string) => boolean,
): InvalidateAllAction {
  return {
    type: INVALIDATEALL,
    testKey,
  };
}
