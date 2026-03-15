/**
 * Format results as customSmallerIsBetter JSON for rhysd/github-action-benchmark.
 */
export interface BenchmarkResult {
  name: string;
  unit: string;
  value: number;
  range: string;
}

export function formatReport(results: BenchmarkResult[]): string {
  return JSON.stringify(results, null, 2);
}
