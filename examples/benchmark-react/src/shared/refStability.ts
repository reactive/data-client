import type { Author, Item, RefStabilityReport } from './types';

const currentRefs: Record<string, { item: Item; author: Author }> = {};
let snapshotRefs: Record<string, { item: Item; author: Author }> | null = null;

/**
 * Register current (item, author) refs for a row. Call from each row on render.
 */
export function registerRefs(id: string, item: Item, author: Author): void {
  currentRefs[id] = { item, author };
}

/**
 * Copy current refs into snapshot. Call after mount, before running an update.
 */
export function captureSnapshot(): void {
  snapshotRefs = { ...currentRefs };
}

/**
 * Compare current refs to snapshot and return counts. Call after update completes.
 */
export function getReport(): RefStabilityReport {
  let itemRefUnchanged = 0;
  let itemRefChanged = 0;
  let authorRefUnchanged = 0;
  let authorRefChanged = 0;

  if (!snapshotRefs) {
    return {
      itemRefUnchanged: 0,
      itemRefChanged: 0,
      authorRefUnchanged: 0,
      authorRefChanged: 0,
    };
  }

  for (const id of Object.keys(currentRefs)) {
    const current = currentRefs[id];
    const snap = snapshotRefs[id];
    if (!current || !snap) continue;

    if (current.item === snap.item) {
      itemRefUnchanged++;
    } else {
      itemRefChanged++;
    }
    if (current.author === snap.author) {
      authorRefUnchanged++;
    } else {
      authorRefChanged++;
    }
  }

  return {
    itemRefUnchanged,
    itemRefChanged,
    authorRefUnchanged,
    authorRefChanged,
  };
}
