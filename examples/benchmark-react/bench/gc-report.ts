/**
 * Aggregate schemaVersion 1 detailed GC measurement report for the browser harness.
 * Raw Chromium traces (BENCH_TRACE) remain separate diagnostic artifacts.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { BuildManifestV1 } from './build-manifest.js';
import { browserGCScenarioId } from '../src/data-client/gcInteractionMetrics.ts';
import type {
  GCBrowserMeasurement,
  GCScenarioConfig,
} from '../src/shared/types.js';

export interface GCSampleResult extends GCBrowserMeasurement {
  heapBeforeBytes?: number;
  heapAfterBytes?: number;
  heapDeltaBytes?: number;
}

export interface NumberSummary {
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface GCScenarioReport {
  /** Stable id: browser/{kind}/{pattern}/{count}/end-to-end/{control} */
  id: string;
  platform: 'browser';
  candidateKind: GCScenarioConfig['candidateKind'];
  pattern: GCScenarioConfig['pattern'];
  count: number;
  mode: 'end-to-end';
  control: GCScenarioConfig['control'];
  samples: GCSampleResult[];
  summary: Record<string, NumberSummary | null>;
}

export interface GCFailureRecord {
  scenarioId: string;
  sampleIndex?: number;
  error: string;
}

export interface GCMeasurementReport {
  schemaVersion: 1;
  /** false when any requested sample/scenario failed */
  complete: boolean;
  requestedScenarios: number;
  requestedSamples: number;
  completedScenarios: number;
  completedSamples: number;
  failures: GCFailureRecord[];
  units: Record<string, string>;
  memorySemantics: {
    model: 'keep-store-drop-observer';
    description: string;
  };
  /** Verified BuildManifest provenance — never live HEAD */
  provenance: {
    buildId: string;
    commit: string;
    dirty: boolean;
    sourceDigest: string;
    servedManifestBuildId: string;
  };
  build: {
    commit: string;
    label: string;
  };
  environment: {
    runtime: 'chromium';
    browserVersion: string;
    headless: boolean;
    os: string;
    arch: string;
    cpuModel: string;
    cpus: number;
    platform: NodeJS.Platform;
    nodeVersion: string;
  };
  config: {
    samplesPerScenario: number;
    filter: string | null;
  };
  scenarios: GCScenarioReport[];
}

/** Caller must pass a non-empty sorted array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0]!;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

export function summarizeNumbers(values: number[]): NumberSummary | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ?
      (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
  return {
    median,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

export function summarizeGCSamples(
  samples: GCSampleResult[],
): Record<string, NumberSummary | null> {
  const summary: Record<string, NumberSummary | null> = {
    totalMs: summarizeNumbers(samples.map(s => s.totalMs)),
    actionCount: summarizeNumbers(samples.map(s => s.actionCount)),
    queueEntries: summarizeNumbers(samples.map(s => s.queueEntries)),
    uniqueTargets: summarizeNumbers(samples.map(s => s.uniqueTargets)),
    actionTargetCount: summarizeNumbers(samples.map(s => s.actionTargetCount)),
    deletionCount: summarizeNumbers(samples.map(s => s.deletionCount)),
    timerDelayMs: summarizeNumbers(samples.map(s => s.timerDelayMs)),
    displayPeriodMs: summarizeNumbers(samples.map(s => s.displayPeriodMs)),
    missedFrames: summarizeNumbers(samples.map(s => s.missedFrames)),
    maxInputDelayMs: summarizeNumbers(samples.map(s => s.maxInputDelayMs)),
    longTaskCount: summarizeNumbers(samples.map(s => s.longTaskCount)),
    longTaskTotalMs: summarizeNumbers(samples.map(s => s.longTaskTotalMs)),
  };
  const slices = samples.flatMap(s => s.sliceDurationsMs ?? []);
  if (slices.length) {
    summary.sliceDurationsMs = summarizeNumbers(slices);
  }
  const frameIntervals = samples.flatMap(s => s.frameIntervalsMs ?? []);
  if (frameIntervals.length) {
    summary.frameIntervalsMs = summarizeNumbers(frameIntervals);
  }
  const heaps = samples.filter(s => s.heapBeforeBytes != null);
  if (heaps.length) {
    summary.heapBeforeBytes = summarizeNumbers(
      heaps.map(s => s.heapBeforeBytes!),
    );
    summary.heapAfterBytes = summarizeNumbers(
      heaps.map(s => s.heapAfterBytes!),
    );
    summary.heapDeltaBytes = summarizeNumbers(
      heaps.map(s => s.heapDeltaBytes!),
    );
  }
  return summary;
}

export function cpuModel(): string {
  return os.cpus()[0]?.model ?? 'unknown';
}

export function defaultGCReportPath(): string {
  return path.resolve(
    process.env.BENCH_GC_OUTPUT ?? 'gc-measurement-output.json',
  );
}

export function writeGCReport(
  report: GCMeasurementReport,
  outputPath: string = defaultGCReportPath(),
): void {
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stderr.write(
    `GC detailed report → ${outputPath} (complete=${report.complete})\n`,
  );
}

export function scenarioReportFromConfig(
  config: GCScenarioConfig,
  samples: GCSampleResult[],
): GCScenarioReport {
  const id = browserGCScenarioId(config);
  return {
    id,
    platform: 'browser',
    candidateKind: config.candidateKind,
    pattern: config.pattern,
    count: config.count,
    mode: 'end-to-end',
    control: config.control,
    samples,
    summary: summarizeGCSamples(samples),
  };
}

export function buildGCReport(opts: {
  scenarios: GCScenarioReport[];
  samplesPerScenario: number;
  filter: string | null;
  browserVersion: string;
  headless: boolean;
  requestedScenarios: number;
  requestedSamples: number;
  completedScenarios: number;
  completedSamples: number;
  failures: GCFailureRecord[];
  provenance: BuildManifestV1 & { servedManifestBuildId: string };
}): GCMeasurementReport {
  const complete =
    opts.failures.length === 0 &&
    opts.completedScenarios === opts.requestedScenarios &&
    opts.completedSamples === opts.requestedSamples;

  return {
    schemaVersion: 1,
    complete,
    requestedScenarios: opts.requestedScenarios,
    requestedSamples: opts.requestedSamples,
    completedScenarios: opts.completedScenarios,
    completedSamples: opts.completedSamples,
    failures: opts.failures,
    units: {
      totalMs: 'milliseconds',
      sliceDurationsMs: 'milliseconds',
      timerDelayMs: 'milliseconds',
      frameIntervalsMs: 'milliseconds',
      displayPeriodMs: 'milliseconds',
      maxInputDelayMs: 'milliseconds',
      longTaskTotalMs: 'milliseconds',
      missedFrames: 'frames',
      heapBeforeBytes: 'bytes',
      heapAfterBytes: 'bytes',
      heapDeltaBytes: 'bytes',
    },
    memorySemantics: {
      model: 'keep-store-drop-observer',
      description:
        'heapBefore is taken after prepareGCScenario with forced Chromium engine GC. After runGCScenario (which validates and releases captured GC action arrays), settle + forced engine GC yields heapAfter while the live store remains. Engine GC is never inside interaction timing. Compare gc vs no-gc for retained-cache signal.',
    },
    provenance: {
      buildId: opts.provenance.buildId,
      commit: opts.provenance.commit,
      dirty: opts.provenance.dirty,
      sourceDigest: opts.provenance.sourceDigest,
      servedManifestBuildId: opts.provenance.servedManifestBuildId,
    },
    build: {
      commit: opts.provenance.commit,
      label: 'examples/benchmark-react GC monolithic browser baseline',
    },
    environment: {
      runtime: 'chromium',
      browserVersion: opts.browserVersion,
      headless: opts.headless,
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpuModel: cpuModel(),
      cpus: os.cpus().length,
      platform: process.platform,
      nodeVersion: process.version,
    },
    config: {
      samplesPerScenario: opts.samplesPerScenario,
      filter: opts.filter,
    },
    scenarios: opts.scenarios,
  };
}

export { browserGCScenarioId };
