/**
 * Local schemaVersion 1 types mirroring the documented GC measurement protocol.
 * No shared runtime package — semantic compatibility only.
 */

export type CandidateKind = 'entity' | 'endpoint' | 'mixed';
export type Pattern = 'unique' | 'duplicate';
export type Control = 'gc' | 'no-gc';
export type Mode = 'interaction';
export type UiCaptureSource = 'FrameMetrics' | 'Choreographer';

/** Canonical scenario counts. */
export const CANONICAL_COUNTS = [1_000, 10_000, 100_000] as const;
export type CanonicalCount = (typeof CANONICAL_COUNTS)[number];

/** Axes for Android GC scenarios. */
export interface GCScenarioConfig {
  candidateKind: CandidateKind;
  /** `duplicate` is entity-only (one path released `count` times). */
  pattern: Pattern;
  count: number;
  control: Control;
}

export interface GCPreparedSummary {
  queueEntries: number;
  uniqueTargets: number;
}

/**
 * JS-side interaction measurement (schemaVersion 1).
 * Native UI-frame and process-memory fields are attached by the runner.
 */
export interface GCAndroidMeasurement {
  schemaVersion: 1;
  totalMs: number;
  /** Monolithic baseline: exactly `[totalMs]` when control is `gc`; empty for `no-gc`. */
  sliceDurationsMs: number[];
  actionCount: number;
  queueEntries: number;
  uniqueTargets: number;
  actionTargetCount: number;
  deletionCount: number;
  timerDelayMs: number;
  frameIntervalsMs: number[];
  displayPeriodMs: number;
  missedFrames: number;
  maxInputDelayMs: number;
  /** Native UI capture source — required when UI metrics are present. */
  uiCaptureSource: UiCaptureSource;
  uiFrameCount: number;
  /** Aggregate max single-frame duration/interval (ms). */
  uiMaxFrameDurationMs: number;
  /** Aggregate sum of frame durations/intervals (ms). */
  uiTotalFrameDurationMs: number;
  uiMissedFrames: number;
  uiRefreshPeriodMs: number;
  uiRefreshRateHz: number;
  processPssBeforeKb?: number;
  processPssAfterKb?: number;
  processPssDeltaKb?: number;
  processRssBeforeKb?: number;
  processRssAfterKb?: number;
  processRssDeltaKb?: number;
  jsHeapBeforeBytes?: number;
  jsHeapAfterBytes?: number;
  jsHeapDeltaBytes?: number;
}

export interface NumberSummary {
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface GCScenarioReport {
  id: string;
  platform: 'android';
  candidateKind: CandidateKind;
  pattern: Pattern;
  count: number;
  mode: Mode;
  control: Control;
  samples: GCAndroidMeasurement[];
  summary: Record<string, NumberSummary | null>;
}

export interface AndroidEnvironment {
  platform: 'android';
  apiLevel: number;
  release: string;
  manufacturer: string;
  model: string;
  device: string;
  brand: string;
  buildType: string;
  applicationId: string;
  hermesEnabled: boolean;
  hermesRuntimeProperties?: Record<string, string>;
  refreshRateHz: number;
  refreshPeriodMs: number;
}

/** Embedded BuildManifest v1 (baked into APK assets at prepare time). */
export interface BuildManifestV1 {
  schemaVersion: 1;
  /**
   * Source-build identity: deterministic sha256 over
   * schemaVersion, gitCommit, gitDirty, sourceDigest (not APK bytes).
   */
  buildId: string;
  gitCommit: string;
  gitDirty: boolean;
  /** Content digest of sorted app + packages/core/src inputs. */
  sourceDigest: string;
  createdAt: string;
}

/** Host sidecar written after APK assemble (authority for collection). */
export interface BuildSidecarV1 {
  schemaVersion: 1;
  /** Same source-build identity as the embedded BuildManifest. */
  buildId: string;
  sourceDigest: string;
  gitCommit: string;
  gitDirty: boolean;
  apkPath: string;
  /** Artifact identity: sha256 of the single release APK bytes. */
  apkSha256: string;
  apkSizeBytes: number;
  /** Artifact-aware id: sha256(buildId ∥ apkSha256). */
  sidecarId: string;
  builtAt: string;
}

export interface GCMeasurementReport {
  schemaVersion: 1;
  units: Record<string, string>;
  memorySemantics: {
    model: 'keep-store-drop-observer';
    description: string;
  };
  build: {
    /**
     * Source-build identity from the embedded BuildManifest
     * (deterministic over schemaVersion/gitCommit/gitDirty/sourceDigest).
     * Matched to sidecar.buildId at collection — not live checkout authority.
     */
    buildId: string;
    sourceDigest: string;
    gitCommit: string;
    gitDirty: boolean;
    label?: string;
    apkSizeBytes?: number;
    hermesBytecodeBytes?: number;
    hermesAssetsBytes?: number;
    /** Host sidecar fields attached at collection — not live checkout. */
    sidecar?: {
      buildId: string;
      sourceDigest: string;
      /** Artifact identity of the release APK. */
      apkSha256: string;
      apkPath: string;
      sidecarId: string;
    };
    /** sha256 of the APK actually installed on device (must equal sidecar.apkSha256). */
    installedApkSha256?: string;
  };
  environment: AndroidEnvironment;
  config: {
    samplesPerScenario: number;
    filter: string | null;
    scenarioId: string;
  };
  scenarios: GCScenarioReport[];
}

export interface LaunchConfig {
  autoRun: boolean;
  candidateKind: CandidateKind;
  pattern: Pattern;
  count: number;
  control: Control;
  samples: number;
  /** Optional human label only — not provenance authority. */
  label?: string;
}
