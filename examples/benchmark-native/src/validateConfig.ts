import type {
  CandidateKind,
  Control,
  GCScenarioConfig,
  LaunchConfig,
  Pattern,
} from './types';
import {
  MAX_SAMPLES,
  validateAxes,
  validateSampleCount as sharedValidateSampleCount,
} from '../../gc-shared/protocol.js';

export {
  CANDIDATE_KINDS,
  CONTROLS,
  MAX_SAMPLES,
  PATTERNS,
} from '../../gc-shared/protocol.js';

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/** Rethrow shared-protocol validation failures as ConfigValidationError. */
function asConfigError(validate: () => void): void {
  try {
    validate();
  } catch (err) {
    throw new ConfigValidationError((err as Error).message);
  }
}

/**
 * Validate scenario axes. Throws ConfigValidationError on invalid input.
 * Does not coerce — callers must pass already-parsed values or use parseLaunchConfig.
 */
export function validateScenarioConfig(config: GCScenarioConfig): void {
  asConfigError(() => validateAxes(config));
}

export function validateSampleCount(samples: number): void {
  asConfigError(() => sharedValidateSampleCount(samples));
}

export function validateLaunchConfig(config: LaunchConfig): void {
  validateScenarioConfig({
    candidateKind: config.candidateKind,
    pattern: config.pattern,
    count: config.count,
    control: config.control,
  });
  validateSampleCount(config.samples);
}

/**
 * Parse raw launch/intent/env fields into a LaunchConfig.
 * Missing optional fields get safe defaults; invalid values throw.
 */
export function parseLaunchConfig(raw: {
  autoRun?: unknown;
  candidateKind?: unknown;
  pattern?: unknown;
  count?: unknown;
  control?: unknown;
  samples?: unknown;
  label?: unknown;
}): LaunchConfig {
  const autoRun = Boolean(raw.autoRun);

  const candidateKindRaw =
    raw.candidateKind === undefined || raw.candidateKind === null
      ? 'entity'
      : String(raw.candidateKind);
  const patternRaw =
    raw.pattern === undefined || raw.pattern === null
      ? 'unique'
      : String(raw.pattern);
  const controlRaw =
    raw.control === undefined || raw.control === null
      ? 'gc'
      : String(raw.control);

  if (raw.count !== undefined && raw.count !== null && raw.count !== '') {
    const countNum = Number(raw.count);
    if (!Number.isInteger(countNum)) {
      throw new ConfigValidationError(
        `invalid count=${String(raw.count)}; expected integer canonical count`,
      );
    }
  }
  const count =
    raw.count === undefined || raw.count === null || raw.count === ''
      ? 1000
      : Number(raw.count);

  const samplesRaw =
    raw.samples === undefined || raw.samples === null || raw.samples === ''
      ? 1
      : Number(raw.samples);
  if (!Number.isFinite(samplesRaw)) {
    throw new ConfigValidationError(
      `invalid samples=${String(raw.samples)}; expected integer 1..${MAX_SAMPLES}`,
    );
  }
  const samples = Math.floor(samplesRaw);

  const label =
    typeof raw.label === 'string' && raw.label.length > 0
      ? raw.label
      : undefined;

  const config: LaunchConfig = {
    autoRun,
    candidateKind: candidateKindRaw as CandidateKind,
    pattern: patternRaw as Pattern,
    count,
    control: controlRaw as Control,
    samples,
    label,
  };
  validateLaunchConfig(config);
  return config;
}
