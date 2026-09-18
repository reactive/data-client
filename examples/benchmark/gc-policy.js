/**
 * Isolated Node GC measurement harness (monolithic baseline).
 *
 * Timing windows (see plans/garbage-collection.md):
 *   1. Prepare — fixture + queue outside the timed window
 *   2. Timed cache-GC work — sweep / reducer / no-op control
 *   3. Optional retained-heap path — validate, drop observer refs (captured
 *      action / prebuilt action / seed clone), keep live store, then settle +
 *      forced V8 GC. Engine GC is never inside the timed cache-GC section.
 *
 * JSON report (schemaVersion 1) → stdout
 * Optional human table → stderr (--table / default when stderr is a TTY)
 *
 * Usage:
 *   yarn build:benchmark
 *   yarn workspace example-benchmark start:gc [filter] [--samples=N] [--memory] [--table|--no-table]
 *   yarn workspace example-benchmark start:gc --verify-manifest
 */
import os from 'node:os';
import process from 'node:process';
import { setImmediate } from 'node:timers';
import v8 from 'node:v8';
import vm from 'node:vm';

import { verifyManifestOrThrow, runSelfTest } from './gc-build-manifest.js';
import {
  listScenarios,
  createHarness,
  validateSample,
  countRemaining,
  GC,
} from './gc-policy-scenarios.js';

const DEFAULT_SAMPLES = 11;

function parseArgs(argv) {
  let filter;
  let samples = DEFAULT_SAMPLES;
  let memory = false;
  let table;
  let verifyManifestOnly = false;
  for (const arg of argv) {
    if (arg === '--memory') {
      memory = true;
    } else if (arg === '--table') {
      table = true;
    } else if (arg === '--no-table') {
      table = false;
    } else if (arg === '--verify-manifest') {
      verifyManifestOnly = true;
    } else if (arg.startsWith('--samples=')) {
      samples = Number(arg.slice('--samples='.length));
      if (!Number.isFinite(samples) || samples < 1) {
        throw new Error(`invalid --samples value: ${arg}`);
      }
      samples = Math.floor(samples);
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown flag: ${arg}`);
    } else if (filter === undefined) {
      filter = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  if (table === undefined) table = Boolean(process.stderr.isTTY);
  return { filter, samples, memory, table, verifyManifestOnly };
}

function cpuModel() {
  return os.cpus()[0]?.model ?? 'unknown';
}

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

function summarizeScenario(samples) {
  const summary = {
    totalMs: summarizeNumbers(samples.map(s => s.totalMs)),
    actionCount: summarizeNumbers(samples.map(s => s.actionCount)),
    queueEntries: summarizeNumbers(samples.map(s => s.queueEntries)),
    uniqueTargets: summarizeNumbers(samples.map(s => s.uniqueTargets)),
    actionTargetCount: summarizeNumbers(samples.map(s => s.actionTargetCount)),
    deletionCount: summarizeNumbers(samples.map(s => s.deletionCount)),
  };
  const slices = samples.flatMap(s => s.sliceDurationsMs ?? []);
  if (slices.length) {
    summary.sliceDurationsMs = summarizeNumbers(slices);
  }
  const heaps = samples.filter(s => s.heapBeforeBytes != null);
  if (heaps.length) {
    summary.heapBeforeBytes = summarizeNumbers(
      heaps.map(s => s.heapBeforeBytes),
    );
    summary.heapAfterBytes = summarizeNumbers(heaps.map(s => s.heapAfterBytes));
    summary.heapDeltaBytes = summarizeNumbers(heaps.map(s => s.heapDeltaBytes));
  }
  return summary;
}

function maybeExposeGc() {
  try {
    v8.setFlagsFromString('--expose_gc');
    return vm.runInNewContext('gc');
  } catch {
    return undefined;
  }
}

function fullGC(gc) {
  if (!gc) return;
  gc();
  gc();
}

function heapUsed() {
  return v8.getHeapStatistics().used_heap_size;
}

async function settleEventLoop() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

/**
 * Run one sample. Setup/queue are outside the timed section.
 * Destructive modes rebuild a fresh harness each sample.
 *
 * Memory lifecycle (--memory), keep-store / drop-observer:
 *   prepare → (reducer: take clone, drop seed) → V8 GC → heapBefore
 *   → timed cache-GC → validate → releaseObserverRefs (action/seed only)
 *   → settle + V8 GC → heapAfter (live store still retained)
 *   → dispose harness for the next sample
 *
 * heapDelta therefore reflects cache contents still held by the store, not
 * harness/action observer arrays. Compare gc vs no-gc end-to-end/reducer.
 */
async function runSample(scenario, { memory, gc }) {
  const { mode, control } = scenario;
  const harness = createHarness(scenario, mode);
  const { policy, reducer, expected } = harness;

  const queueEntries = expected.queueEntries;
  const uniqueTargets = expected.uniqueTargets;
  const actionTargetCount =
    expected.expectedEntitiesInAction + expected.expectedEndpointsInAction;

  // Reducer: clone into working state and drop the full-size seed before baseline
  let reducerState;
  if (mode === 'reducer') {
    reducerState = harness.takeReducerState();
  }

  let heapBeforeBytes;
  if (memory) {
    fullGC(gc);
    await settleEventLoop();
    heapBeforeBytes = heapUsed();
  }

  harness.clearCapturedAction();

  const t0 = performance.now();
  let actionCount = 0;
  let deletionCount = 0;

  if (control === 'no-gc') {
    // Harness / no-op overhead only — intentionally empty
  } else if (mode === 'scan') {
    policy.sweep();
    actionCount = harness.getCapturedAction() ? 1 : 0;
  } else if (mode === 'reducer') {
    reducer(reducerState, harness.prebuiltAction);
    actionCount = 1;
  } else if (mode === 'end-to-end') {
    policy.sweep();
    const action = harness.getCapturedAction();
    actionCount = action && action.type === GC ? 1 : 0;
  } else {
    throw new Error(`unknown mode: ${mode}`);
  }

  const totalMs = performance.now() - t0;

  // Deletion accounting is outside the timed window
  if (control === 'gc' && (mode === 'reducer' || mode === 'end-to-end')) {
    const remaining = countRemaining(harness.getState(), scenario, expected);
    deletionCount = remaining.entityDeleted + remaining.endpointDeleted;
  }

  // Monolithic GC: report one slice only (honest representation of current behavior)
  const sliceDurationsMs = control === 'gc' ? [totalMs] : [];

  const sample = {
    totalMs,
    sliceDurationsMs,
    actionCount,
    queueEntries,
    uniqueTargets,
    actionTargetCount: control === 'gc' ? actionTargetCount : 0,
    deletionCount,
  };

  // Validate while harness/action refs still exist
  validateSample(scenario, harness, sample, mode, control);

  if (memory) {
    // Drop captured GC action (holds target arrays) and prebuilt action; keep store
    harness.releaseObserverRefs();
    reducerState = undefined;
    await settleEventLoop();
    fullGC(gc);
    const heapAfterBytes = heapUsed();
    sample.heapBeforeBytes = heapBeforeBytes;
    sample.heapAfterBytes = heapAfterBytes;
    sample.heapDeltaBytes = heapAfterBytes - heapBeforeBytes;
  }

  harness.dispose();

  return sample;
}

function formatMs(n) {
  if (n == null) return '—';
  if (n < 1) return `${(n * 1000).toFixed(1)} µs`;
  if (n < 1000) return `${n.toFixed(2)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}

function formatBytes(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1024 * 1024)
    return `${sign}${(abs / (1024 * 1024)).toFixed(2)} MB`;
  if (abs >= 1024) return `${sign}${(abs / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function printTable(scenarioResults) {
  const rows = scenarioResults.map(({ id, summary }) => {
    const row = {
      scenario: id,
      'median total': formatMs(summary.totalMs?.median),
      min: formatMs(summary.totalMs?.min),
      max: formatMs(summary.totalMs?.max),
      p95: formatMs(summary.totalMs?.p95),
      actions: summary.actionCount?.median ?? '—',
      queue: summary.queueEntries?.median ?? '—',
      targets: summary.actionTargetCount?.median ?? '—',
      deleted: summary.deletionCount?.median ?? '—',
    };
    if (summary.heapDeltaBytes) {
      row['heap Δ'] = formatBytes(summary.heapDeltaBytes.median);
    }
    return row;
  });
  const err = new console.Console(process.stderr, process.stderr);
  err.log('\nGC policy benchmark (cache GC — not V8 engine GC)\n');
  err.table(rows);
}

async function main() {
  const {
    filter,
    samples: sampleCount,
    memory,
    table,
    verifyManifestOnly,
  } = parseArgs(process.argv.slice(2));

  // Provenance check is outside timing and runs before any scenario work
  if (verifyManifestOnly) {
    const result = runSelfTest();
    for (const step of result.steps) {
      console.error(`  ${step}`);
    }
    console.error('gc-build-manifest self-test passed');
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          buildId: result.manifest.buildId,
          commit: result.manifest.commit,
          dirty: result.manifest.dirty,
          sourceDigest: result.manifest.sourceDigest,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  const buildManifest = verifyManifestOrThrow();

  const scenarios = listScenarios(filter);
  if (scenarios.length === 0) {
    throw new Error(`no scenarios matched filter: ${filter ?? '(none)'}`);
  }

  const gc = memory ? maybeExposeGc() : undefined;
  if (memory && !gc) {
    console.error(
      'warning: --memory requested but V8 gc() is unavailable; heap metrics omitted',
    );
  }

  const scenarioResults = [];
  for (const scenario of scenarios) {
    const samples = [];
    for (let i = 0; i < sampleCount; i++) {
      samples.push(await runSample(scenario, { memory: Boolean(gc), gc }));
    }
    scenarioResults.push({
      id: scenario.id,
      platform: scenario.platform,
      candidateKind: scenario.candidateKind,
      pattern: scenario.pattern,
      count: scenario.count,
      mode: scenario.mode,
      control: scenario.control,
      samples,
      summary: summarizeScenario(samples),
    });
  }

  const report = {
    schemaVersion: 1,
    units: {
      totalMs: 'milliseconds',
      sliceDurationsMs: 'milliseconds',
      heapBeforeBytes: 'bytes',
      heapAfterBytes: 'bytes',
      heapDeltaBytes: 'bytes',
    },
    memorySemantics:
      memory ?
        {
          model: 'keep-store-drop-observer',
          description:
            'heapBefore is taken after fixture/queue prepare (and reducer seed drop) with a forced V8 GC. After timed cache-GC and validation, observer refs (captured GC action target arrays, prebuilt reducer action, reducer seed) are released; the live store remains. heapAfter follows settle + forced V8 GC. heapDeltaBytes ≈ retained store cache change, not harness retention. Compare gc vs no-gc for reducer/end-to-end; scan does not delete store entries so its delta is not a retained-cache signal.',
        }
      : undefined,
    build: {
      schemaVersion: buildManifest.schemaVersion,
      buildId: buildManifest.buildId,
      commit: buildManifest.commit,
      dirty: buildManifest.dirty,
      sourceDigest: buildManifest.sourceDigest,
      artifacts: buildManifest.artifacts,
      label: 'examples/benchmark GC monolithic baseline',
      manifest: 'dist/gc-build-manifest.json',
    },
    environment: {
      runtime: 'node',
      nodeVersion: process.version,
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpuModel: cpuModel(),
      cpus: os.cpus().length,
      platform: process.platform,
    },
    config: {
      samplesPerScenario: sampleCount,
      filter: filter ?? null,
      memoryMetrics: Boolean(gc),
    },
    scenarios: scenarioResults,
  };

  if (table) printTable(scenarioResults);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
