/**
 * Memory-pressure measurement for the degenerate-case spread scenarios.
 *
 * The spread copies in the write path are transient (they die young), so the
 * symptom is allocation rate and GC churn rather than retained heap. For each
 * scenario this reports:
 *
 * - allocated/op: approximate bytes allocated per operation, from summing
 *   positive used-heap deltas between samples (every SAMPLE_INTERVAL ops, to
 *   reduce the sampler's own contribution). Undercounts when a scavenge lands
 *   mid-window, so treat as a lower bound.
 * - GC minor/major/other + pause: count and total pause time of GC events
 *   during the measured loop (PerformanceObserver 'gc' entries).
 * - retained: used-heap delta vs. baseline after full GC — should be ~0;
 *   nonzero flags actual retention.
 *
 * Local-only; not part of CI benchmark tracking. Run with:
 *   yarn workspace example-benchmark start:memory [filter]
 */
import { PerformanceObserver, constants } from 'node:perf_hooks';
import vm from 'node:vm';
import v8 from 'v8';

import { buildScenarios } from './spread-scenarios.js';

v8.setFlagsFromString('--expose_gc');
const gc = vm.runInNewContext('gc');

// v8.getHeapStatistics() avoids the /proc rss read that process.memoryUsage() does
const heapUsed = () => v8.getHeapStatistics().used_heap_size;

// heapUsed() itself allocates; sample less often to reduce its effect on
// allocated/op and GC counts for cheap scenarios.
const SAMPLE_INTERVAL = 10;

function fullGC() {
  gc();
  gc();
}

async function measure(name, fn, iterations, warmup = 25) {
  for (let i = 0; i < warmup; i++) fn();
  fullGC();
  const baseline = heapUsed();

  let gcMinor = 0;
  let gcMajor = 0;
  let gcOther = 0;
  let gcPauseMs = 0;
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      gcPauseMs += entry.duration;
      switch (entry.detail?.kind) {
        case constants.NODE_PERFORMANCE_GC_MINOR:
          gcMinor++;
          break;
        case constants.NODE_PERFORMANCE_GC_MAJOR:
          gcMajor++;
          break;
        default:
          gcOther++;
      }
    }
  });
  observer.observe({ entryTypes: ['gc'] });

  let allocated = 0;
  let prev = baseline;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
    if (i % SAMPLE_INTERVAL === SAMPLE_INTERVAL - 1 || i === iterations - 1) {
      const used = heapUsed();
      if (used > prev) allocated += used - prev;
      prev = used;
    }
  }
  const elapsedMs = performance.now() - start;

  // GC performance entries are delivered asynchronously
  await new Promise(resolve => setTimeout(resolve, 100));
  observer.disconnect();

  fullGC();
  const retained = heapUsed() - baseline;

  return {
    name,
    iterations,
    elapsedMs,
    allocated,
    gcMinor,
    gcMajor,
    gcOther,
    gcPauseMs,
    retained,
  };
}

function formatBytes(bytes) {
  const abs = Math.abs(bytes);
  if (abs >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (abs >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${Math.round(bytes)} B`;
}

const scenarios = buildScenarios(process.argv[2]);

console.log(
  `Measuring ${scenarios.length} scenario(s); heap sampling adds overhead so time/op is indicative only\n`,
);

const rows = [];
for (const { name, fn, iterations } of scenarios) {
  const result = await measure(name, fn, iterations);
  rows.push({
    scenario: result.name,
    ops: result.iterations,
    'time/op': `${((result.elapsedMs / result.iterations) * 1000).toFixed(1)} µs`,
    'allocated/op': formatBytes(result.allocated / result.iterations),
    'GC minor': result.gcMinor,
    'GC major': result.gcMajor,
    'GC other': result.gcOther,
    'GC pause': `${result.gcPauseMs.toFixed(1)} ms`,
    retained: formatBytes(result.retained),
  });
}

console.table(rows);
