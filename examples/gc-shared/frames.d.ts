export declare function median(values: number[]): number;
/** Adjacent differences of rAF timestamps (ms). */
export declare function frameIntervalsFromTimestamps(
  timestamps: number[],
): number[];
/** max(timerDelayMs, largest frame-interval excess over one display period). */
export declare function computeMaxInputDelayMs(
  timerDelayMs: number,
  frameIntervalsMs: number[],
  displayPeriodMs: number,
): number;
/** Median of quiet rAF intervals (uses global requestAnimationFrame). */
export declare function measureDisplayPeriodMs(
  samples?: number,
): Promise<number>;
