'use strict';
/**
 * Report summaries shared by the Node, browser, and Android GC reports.
 * CommonJS on purpose (see ./README.md).
 */

/** Linear-interpolated percentile over an ascending-sorted array. */
function percentile(sorted, p) {
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function summarizeNumbers(values) {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

module.exports = { percentile, summarizeNumbers };
