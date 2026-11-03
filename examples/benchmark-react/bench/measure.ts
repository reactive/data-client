import type { Page } from 'playwright';

import { sortedP95 } from './stats.js';
import type { MeasureAggregate } from '../src/shared/types.js';

export interface PerformanceMeasure {
  name: string;
  duration: number;
}

/**
 * Collect performance.measure() entries from the page.
 */
export async function collectMeasures(
  page: Page,
): Promise<PerformanceMeasure[]> {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType('measure');
    return entries.map(e => ({
      name: e.name,
      duration: e.duration,
    }));
  });
}

/**
 * Get the duration for a specific measure name (e.g. 'mount-duration', 'update-duration').
 */
export function getMeasureDuration(
  measures: PerformanceMeasure[],
  name: string,
): number {
  const m = measures.findLast(x => x.name === name);
  return m?.duration ?? 0;
}

/** Combine the durations of every measure named `name` (0 when there are none). */
export function aggregateMeasures(
  measures: PerformanceMeasure[],
  name: string,
  aggregate: MeasureAggregate,
): number {
  const durations = measures.filter(m => m.name === name).map(m => m.duration);
  if (durations.length === 0) return 0;
  switch (aggregate) {
    case 'sum':
      return durations.reduce((a, b) => a + b, 0);
    case 'max':
      return Math.max(...durations);
    case 'p95':
      return sortedP95(durations.sort((a, b) => a - b));
  }
}
