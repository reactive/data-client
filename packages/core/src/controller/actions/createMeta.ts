import type { ActionMeta } from '../../actions.js';

export function createMeta(
  expiryLength: number,
  fetchedAt?: number,
): ActionMeta {
  const now = Date.now();
  return {
    fetchedAt: fetchedAt ?? now,
    date: now,
    expiresAt: now + expiryLength,
  };
}
