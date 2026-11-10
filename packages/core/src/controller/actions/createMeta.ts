import { orderedNow } from './orderedNow.js';
import type { ActionMeta } from '../../actions.js';

export function createMeta(
  expiryLength: number,
  fetchedAt?: number,
): ActionMeta {
  const now = Date.now();
  return {
    fetchedAt: fetchedAt ?? orderedNow(),
    date: now,
    expiresAt: now + expiryLength,
  };
}
