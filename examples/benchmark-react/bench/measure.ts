import type { Page } from 'playwright';

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
  const m = measures.find(x => x.name === name);
  return m?.duration ?? 0;
}
