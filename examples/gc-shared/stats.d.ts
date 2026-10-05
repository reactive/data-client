export interface NumberSummary {
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

/** Linear-interpolated percentile over an ascending-sorted array. */
export declare function percentile(sorted: number[], p: number): number;
export declare function summarizeNumbers(
  values: number[],
): NumberSummary | null;
