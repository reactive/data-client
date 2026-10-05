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
import { summarizeNumbers } from '../../gc-shared/stats.js';

export { summarizeNumbers };

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
    uiDroppedFrameMetrics: summarizeNumbers(
      samples.map(s => s.uiDroppedFrameMetrics),
    ),
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
  uiDroppedFrameMetrics:
    'count (FrameMetrics dropCountSinceLastInvocation; not missed frames)',
  uiFrameMetricsDropped:
    'boolean (true when uiDroppedFrameMetrics is non-zero)',
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
