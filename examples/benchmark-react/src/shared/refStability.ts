import type { Author, Item, RefStabilityReport } from './types';

let currentItems: Item[] = [];
let snapshotRefs: Map<string, { item: Item; author: Author }> | null = null;

/**
 * Store the current items array. Called from ListView during render.
 * Only stores the reference — negligible cost.
 */
export function setCurrentItems(items: Item[]): void {
  currentItems = items;
}

/**
 * Build a snapshot from current items. Call after mount, before running an update.
 */
export function captureSnapshot(): void {
  snapshotRefs = new Map();
  for (const item of currentItems) {
    snapshotRefs.set(item.id, { item, author: item.author });
  }
}

/**
 * Compare current items to snapshot and return counts. Call after update completes.
 */
export function getReport(): RefStabilityReport {
  if (!snapshotRefs) {
    return {
      itemRefUnchanged: 0,
      itemRefChanged: 0,
      authorRefUnchanged: 0,
      authorRefChanged: 0,
    };
  }

  let itemRefUnchanged = 0;
  let itemRefChanged = 0;
  let authorRefUnchanged = 0;
  let authorRefChanged = 0;

  for (const item of currentItems) {
    const snap = snapshotRefs.get(item.id);
    if (!snap) continue;

    if (item === snap.item) {
      itemRefUnchanged++;
    } else {
      itemRefChanged++;
    }
    if (item.author === snap.author) {
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
