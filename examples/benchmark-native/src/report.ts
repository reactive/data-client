import { scenarioId } from './scenario';
import type {
  AndroidEnvironment,
  BuildManifestV1,
  BuildSidecarV1,
  GCAndroidMeasurement,
  GCMeasurementReport,
  GCScenarioConfig,
  GCScenarioReport,
  NumberSummary,
} from './types';

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
    sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;
  return {
    median,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

function optionalField(
  samples: GCAndroidMeasurement[],
  key: keyof GCAndroidMeasurement,
): number[] {
  return samples
    .map(s => s[key])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}

function putOptionalSummary(
  summary: Record<string, NumberSummary | null>,
  key: string,
  values: number[],
) {
  if (values.length) {
    summary[key] = summarizeNumbers(values);
  }
}

export function summarizeGCSamples(
  samples: GCAndroidMeasurement[],
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
    uiFrameCount: summarizeNumbers(samples.map(s => s.uiFrameCount)),
    uiMaxFrameDurationMs: summarizeNumbers(
      samples.map(s => s.uiMaxFrameDurationMs),
    ),
    uiTotalFrameDurationMs: summarizeNumbers(
      samples.map(s => s.uiTotalFrameDurationMs),
    ),
    uiMissedFrames: summarizeNumbers(samples.map(s => s.uiMissedFrames)),
    uiRefreshPeriodMs: summarizeNumbers(samples.map(s => s.uiRefreshPeriodMs)),
  };

  const slices = samples.flatMap(s => s.sliceDurationsMs ?? []);
  if (slices.length) {
    summary.sliceDurationsMs = summarizeNumbers(slices);
  }
  const frameIntervals = samples.flatMap(s => s.frameIntervalsMs ?? []);
  if (frameIntervals.length) {
    summary.frameIntervalsMs = summarizeNumbers(frameIntervals);
  }

  putOptionalSummary(
    summary,
    'processPssBeforeKb',
    optionalField(samples, 'processPssBeforeKb'),
  );
  putOptionalSummary(
    summary,
    'processPssAfterKb',
    optionalField(samples, 'processPssAfterKb'),
  );
  putOptionalSummary(
    summary,
    'processPssDeltaKb',
    optionalField(samples, 'processPssDeltaKb'),
  );
  putOptionalSummary(
    summary,
    'processRssBeforeKb',
    optionalField(samples, 'processRssBeforeKb'),
  );
  putOptionalSummary(
    summary,
    'processRssAfterKb',
    optionalField(samples, 'processRssAfterKb'),
  );
  putOptionalSummary(
    summary,
    'processRssDeltaKb',
    optionalField(samples, 'processRssDeltaKb'),
  );
  putOptionalSummary(
    summary,
    'jsHeapBeforeBytes',
    optionalField(samples, 'jsHeapBeforeBytes'),
  );
  putOptionalSummary(
    summary,
    'jsHeapAfterBytes',
    optionalField(samples, 'jsHeapAfterBytes'),
  );
  putOptionalSummary(
    summary,
    'jsHeapDeltaBytes',
    optionalField(samples, 'jsHeapDeltaBytes'),
  );

  return summary;
}

export const REPORT_UNITS: Record<string, string> = {
  totalMs: 'milliseconds',
  sliceDurationsMs: 'milliseconds',
  timerDelayMs: 'milliseconds',
  frameIntervalsMs: 'milliseconds',
  displayPeriodMs: 'milliseconds',
  maxInputDelayMs: 'milliseconds (proxy; not pointer latency)',
  missedFrames: 'count (JS rAF interval nearest-period excess)',
  uiCaptureSource:
    'FrameMetrics (duration/ceil) | Choreographer (interval/round)',
  uiFrameCount: 'count',
  uiMaxFrameDurationMs:
    'milliseconds (FrameMetrics duration or Choreographer interval)',
  uiTotalFrameDurationMs:
    'milliseconds (sum of FrameMetrics durations or Choreographer intervals)',
  uiMissedFrames:
    'count (FrameMetrics: ceil(duration/period)−1; Choreographer: round(interval/period)−1)',
  uiRefreshPeriodMs: 'milliseconds',
  uiRefreshRateHz: 'hertz',
  processPssBeforeKb: 'kilobytes (Android Debug.MemoryInfo totalPss)',
  processPssAfterKb: 'kilobytes (Android Debug.MemoryInfo totalPss)',
  processPssDeltaKb: 'kilobytes (after − before)',
  processRssBeforeKb: 'kilobytes (when API exposes RSS)',
  processRssAfterKb: 'kilobytes (when API exposes RSS)',
  processRssDeltaKb: 'kilobytes (after − before; when RSS available)',
  jsHeapBeforeBytes: 'bytes (performance.memory.usedJSHeapSize when exposed)',
  jsHeapAfterBytes: 'bytes (performance.memory.usedJSHeapSize when exposed)',
  jsHeapDeltaBytes: 'bytes (after − before; when JS heap available)',
  actionCount: 'count',
  queueEntries: 'count',
  uniqueTargets: 'count',
  actionTargetCount: 'count',
  deletionCount: 'count',
};

export const MEMORY_SEMANTICS_DESCRIPTION =
  'After interaction timing, release captured GC action arrays, keep the live store until dispose, then snapshot process/JS memory. System.gc() is not used — it does not force Hermes collection. Engine GC must not run inside interaction timing. Without a forced Hermes GC, before/after JS heap and process PSS/RSS are observational and noisy: they are not sufficient alone for a memory gate. Compare repeated gc vs no-gc controls on the same device/build series; treat deltas as supporting evidence beside interaction/frame metrics.';

export function buildScenarioReport(
  config: GCScenarioConfig,
  samples: GCAndroidMeasurement[],
): GCScenarioReport {
  return {
    id: scenarioId(config),
    platform: 'android',
    candidateKind: config.candidateKind,
    pattern: config.pattern,
    count: config.count,
    mode: 'interaction',
    control: config.control,
    samples,
    summary: summarizeGCSamples(samples),
  };
}

export function buildMeasurementReport(args: {
  environment: AndroidEnvironment;
  config: GCScenarioConfig;
  samples: GCAndroidMeasurement[];
  manifest: BuildManifestV1;
  label?: string;
  apkSizeBytes?: number;
  hermesBytecodeBytes?: number;
  hermesAssetsBytes?: number;
  sidecar?: BuildSidecarV1;
  installedApkSha256?: string;
}): GCMeasurementReport {
  const scenario = buildScenarioReport(args.config, args.samples);
  return {
    schemaVersion: 1,
    units: { ...REPORT_UNITS },
    memorySemantics: {
      model: 'keep-store-drop-observer',
      description: MEMORY_SEMANTICS_DESCRIPTION,
    },
    build: {
      buildId: args.manifest.buildId,
      sourceDigest: args.manifest.sourceDigest,
      gitCommit: args.manifest.gitCommit,
      gitDirty: args.manifest.gitDirty,
      label: args.label,
      apkSizeBytes: args.apkSizeBytes,
      hermesBytecodeBytes: args.hermesBytecodeBytes,
      hermesAssetsBytes: args.hermesAssetsBytes,
      sidecar: args.sidecar
        ? {
            buildId: args.sidecar.buildId,
            sourceDigest: args.sidecar.sourceDigest,
            apkSha256: args.sidecar.apkSha256,
            apkPath: args.sidecar.apkPath,
            sidecarId: args.sidecar.sidecarId,
          }
        : undefined,
      installedApkSha256: args.installedApkSha256,
    },
    environment: args.environment,
    config: {
      samplesPerScenario: args.samples.length,
      filter: null,
      scenarioId: scenario.id,
    },
    scenarios: [scenario],
  };
}
