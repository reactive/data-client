import {
  CANONICAL_COUNTS,
  type CandidateKind,
  type Control,
  type GCScenarioConfig,
  type LaunchConfig,
  type Pattern,
} from './types';

export const CANDIDATE_KINDS: readonly CandidateKind[] = [
  'entity',
  'endpoint',
  'mixed',
] as const;

export const PATTERNS: readonly Pattern[] = ['unique', 'duplicate'] as const;

export const CONTROLS: readonly Control[] = ['gc', 'no-gc'] as const;

/** Positive sample counts capped to keep accidental huge runs from launching. */
export const MAX_SAMPLES = 50;

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

function isCanonicalCount(count: number): boolean {
  return (CANONICAL_COUNTS as readonly number[]).includes(count);
}

/**
 * Validate scenario axes. Throws ConfigValidationError on invalid input.
 * Does not coerce — callers must pass already-parsed values or use parseLaunchConfig.
 */
export function validateScenarioConfig(config: GCScenarioConfig): void {
  if (!CANDIDATE_KINDS.includes(config.candidateKind)) {
    throw new ConfigValidationError(
      `invalid candidateKind=${String(config.candidateKind)}; expected one of ${CANDIDATE_KINDS.join('|')}`,
    );
  }
  if (!PATTERNS.includes(config.pattern)) {
    throw new ConfigValidationError(
      `invalid pattern=${String(config.pattern)}; expected one of ${PATTERNS.join('|')}`,
    );
  }
  if (!CONTROLS.includes(config.control)) {
    throw new ConfigValidationError(
      `invalid control=${String(config.control)}; expected one of ${CONTROLS.join('|')}`,
    );
  }
  if (!Number.isInteger(config.count) || !isCanonicalCount(config.count)) {
    throw new ConfigValidationError(
      `invalid count=${String(config.count)}; expected one of ${CANONICAL_COUNTS.join('|')}`,
    );
  }
  if (config.pattern === 'duplicate' && config.candidateKind !== 'entity') {
    throw new ConfigValidationError(
      `duplicate pattern only supports candidateKind=entity (got ${config.candidateKind})`,
    );
  }
}

export function validateSampleCount(samples: number): void {
  if (
    !Number.isInteger(samples) ||
    samples < 1 ||
    samples > MAX_SAMPLES ||
    !Number.isFinite(samples)
  ) {
    throw new ConfigValidationError(
      `invalid samples=${String(samples)}; expected integer 1..${MAX_SAMPLES}`,
    );
  }
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

/** Host-env shape used by collect-report / matrix (strings from the shell). */
export function parseHostEnvConfig(env: {
  candidateKind?: string;
  pattern?: string;
  count?: string | number;
  control?: string;
  samples?: string | number;
}): GCScenarioConfig & { samples: number } {
  const parsed = parseLaunchConfig({
    autoRun: false,
    candidateKind: env.candidateKind,
    pattern: env.pattern,
    count: env.count,
    control: env.control,
    samples: env.samples,
  });
  return {
    candidateKind: parsed.candidateKind,
    pattern: parsed.pattern,
    count: parsed.count,
    control: parsed.control,
    samples: parsed.samples,
  };
}
