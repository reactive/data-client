'use strict';
/**
 * GC measurement protocol shared by the Node, browser, and Android harnesses:
 * scenario axes, validation, stable scenario ids, and scenario filtering.
 *
 * Stable id: `{platform}/{candidateKind}/{pattern}/{count}/{mode}/{control}`.
 *
 * CommonJS on purpose (see ./README.md). Bundled into browser/Android apps, so
 * no Node globals here; the host CLI lives in ./protocol-cli.js.
 */

const CANONICAL_COUNTS = [1_000, 10_000, 100_000];
const CANDIDATE_KINDS = ['entity', 'endpoint', 'mixed'];
const PATTERNS = ['unique', 'duplicate'];
const CONTROLS = ['gc', 'no-gc'];
const MODES_BY_PLATFORM = {
  node: ['scan', 'reducer', 'end-to-end'],
  browser: ['end-to-end'],
  android: ['interaction'],
};
const PLATFORMS = Object.keys(MODES_BY_PLATFORM);

/** Positive sample counts capped to keep accidental huge runs from launching. */
const MAX_SAMPLES = 50;

/**
 * Wording of validation messages: field names plus the prefix before an
 * allowed-value list. Callers may pass their own (the host CLI uses env var
 * names like CANDIDATE_KIND and no `one of` prefix).
 */
const AXIS_LABELS = {
  candidateKind: 'candidateKind',
  pattern: 'pattern',
  count: 'count',
  control: 'control',
  samples: 'samples',
  oneOf: 'one of ',
};

function invalid(labels, field, value, expected) {
  return new Error(
    `invalid ${labels[field]}=${String(value)}; expected ${expected}`,
  );
}

/**
 * Validate scenario axes. Throws on invalid input; does not coerce.
 * `duplicate` is entity-only (one path released `count` times).
 */
function validateAxes(axes, labels = AXIS_LABELS) {
  const { candidateKind, pattern, count, control } = axes;
  if (!CANDIDATE_KINDS.includes(candidateKind)) {
    throw invalid(
      labels,
      'candidateKind',
      candidateKind,
      `${labels.oneOf}${CANDIDATE_KINDS.join('|')}`,
    );
  }
  if (!PATTERNS.includes(pattern)) {
    throw invalid(
      labels,
      'pattern',
      pattern,
      `${labels.oneOf}${PATTERNS.join('|')}`,
    );
  }
  if (!CONTROLS.includes(control)) {
    throw invalid(
      labels,
      'control',
      control,
      `${labels.oneOf}${CONTROLS.join('|')}`,
    );
  }
  if (!Number.isInteger(count) || !CANONICAL_COUNTS.includes(count)) {
    throw invalid(
      labels,
      'count',
      count,
      `${labels.oneOf}${CANONICAL_COUNTS.join('|')}`,
    );
  }
  if (pattern === 'duplicate' && candidateKind !== 'entity') {
    throw new Error(
      `duplicate pattern only supports ${labels.candidateKind}=entity (got ${candidateKind})`,
    );
  }
}

function validateSampleCount(samples, labels = AXIS_LABELS) {
  if (!Number.isInteger(samples) || samples < 1 || samples > MAX_SAMPLES) {
    throw invalid(labels, 'samples', samples, `integer 1..${MAX_SAMPLES}`);
  }
}

function validatePlatformMode(platform, mode) {
  const modes = MODES_BY_PLATFORM[platform];
  if (!modes) {
    throw new Error(
      `invalid platform=${String(platform)}; expected one of ${PLATFORMS.join('|')}`,
    );
  }
  if (!modes.includes(mode)) {
    throw new Error(
      `invalid mode=${String(mode)} for platform=${platform}; expected one of ${modes.join('|')}`,
    );
  }
}

/** Stable scenario id from validated axes (throws on invalid axes). */
function scenarioId(axes) {
  const { platform, candidateKind, pattern, count, mode, control } = axes;
  validatePlatformMode(platform, mode);
  validateAxes(axes);
  return [platform, candidateKind, pattern, String(count), mode, control].join(
    '/',
  );
}

/** Parse a stable id back to axes (throws on malformed or invalid ids). */
function parseScenarioId(id) {
  const parts = String(id).split('/');
  if (parts.length !== 6) {
    throw new Error(`malformed GC scenario id: ${id}`);
  }
  const axes = {
    platform: parts[0],
    candidateKind: parts[1],
    pattern: parts[2],
    count: Number(parts[3]),
    mode: parts[4],
    control: parts[5],
  };
  if (scenarioId(axes) !== id) {
    throw new Error(`GC scenario id failed revalidation: ${id}`);
  }
  return axes;
}

/**
 * Scenario filter against a stable id.
 * - empty: matches everything
 * - `^text`: id starts with `text`
 * - otherwise: contiguous slash-bounded segments. One leading and one
 *   trailing slash are removed, so `/100000/` matches the 100000 segment
 *   only, and `1000` does not match `10000` or `100000`.
 */
function matchScenarioId(id, filter) {
  if (!filter) return true;
  if (filter.startsWith('^')) return id.startsWith(filter.slice(1));
  let needle = filter;
  if (needle.startsWith('/')) needle = needle.slice(1);
  if (needle.endsWith('/')) needle = needle.slice(0, -1);
  if (needle.length === 0) return true;
  return `/${id}/`.includes(`/${needle}/`);
}

/**
 * Every supported scenario for a platform, in that platform's run order:
 * - node/browser: count → candidateKind → mode → control, then the entity
 *   duplicate baseline per count
 * - android: candidateKind → count → control, then all duplicate rows
 *   (device matrix order)
 * Only descriptors — no fixtures are built here.
 */
function listScenarios(platform, { filter } = {}) {
  const modes = MODES_BY_PLATFORM[platform];
  if (!modes) {
    throw new Error(
      `invalid platform=${String(platform)}; expected one of ${PLATFORMS.join('|')}`,
    );
  }
  const scenarios = [];
  const add = (candidateKind, pattern, count) => {
    for (const mode of modes) {
      for (const control of CONTROLS) {
        const axes = { platform, candidateKind, pattern, count, mode, control };
        const id = scenarioId(axes);
        if (matchScenarioId(id, filter)) scenarios.push({ id, ...axes });
      }
    }
  };

  if (platform === 'android') {
    for (const candidateKind of CANDIDATE_KINDS) {
      for (const count of CANONICAL_COUNTS) add(candidateKind, 'unique', count);
    }
    for (const count of CANONICAL_COUNTS) add('entity', 'duplicate', count);
  } else {
    for (const count of CANONICAL_COUNTS) {
      for (const candidateKind of CANDIDATE_KINDS) {
        add(candidateKind, 'unique', count);
      }
      add('entity', 'duplicate', count);
    }
  }
  return scenarios;
}

/**
 * Split mixed total into entity + endpoint counts (entities get the remainder
 * when odd so entityCount + endpointCount === total).
 */
function splitMixedCount(total) {
  const endpoints = Math.floor(total / 2);
  return { entities: total - endpoints, endpoints };
}

module.exports = {
  CANONICAL_COUNTS,
  CANDIDATE_KINDS,
  PATTERNS,
  CONTROLS,
  MODES_BY_PLATFORM,
  MAX_SAMPLES,
  AXIS_LABELS,
  validateAxes,
  validateSampleCount,
  scenarioId,
  parseScenarioId,
  matchScenarioId,
  listScenarios,
  splitMixedCount,
};
