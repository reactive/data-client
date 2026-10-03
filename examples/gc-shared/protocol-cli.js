#!/usr/bin/env node
'use strict';
/**
 * Host CLI over ./protocol.js for shell scripts (benchmark-native run-matrix /
 * collect-report). Never imported by app bundles.
 *
 *   node protocol-cli.js list <platform> [filter]
 *     Prints matching stable scenario ids, one per line.
 *   node protocol-cli.js validate <kind> <pattern> <count> <control> [samples]
 *     Exits 0 when valid; otherwise prints `error: ...` to stderr and exits 1.
 */
const {
  listScenarios,
  validateAxes,
  validateSampleCount,
} = require('./protocol.js');

/** Env var names the shell scripts accept, used in validation messages. */
const ENV_LABELS = {
  candidateKind: 'CANDIDATE_KIND',
  pattern: 'PATTERN',
  count: 'COUNT',
  control: 'CONTROL',
  samples: 'SAMPLES',
  oneOf: '',
};

/** Decimal integer strings only (no sign, exponent, or leading zeros). */
function parseIntArg(raw) {
  return /^(0|[1-9][0-9]*)$/.test(raw) ? Number(raw) : raw;
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'list') {
    const [platform, filter] = rest;
    for (const { id } of listScenarios(platform, { filter })) {
      process.stdout.write(`${id}\n`);
    }
    return 0;
  }
  if (cmd === 'validate') {
    const [candidateKind, pattern, count, control, samples = '1'] = rest;
    validateAxes(
      { candidateKind, pattern, count: parseIntArg(count ?? ''), control },
      ENV_LABELS,
    );
    validateSampleCount(parseIntArg(samples), ENV_LABELS);
    return 0;
  }
  process.stderr.write(
    'usage: protocol-cli.js list <platform> [filter]\n' +
      '       protocol-cli.js validate <kind> <pattern> <count> <control> [samples]\n',
  );
  return 2;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  process.stderr.write(`error: ${err.message}\n`);
  process.exitCode = 1;
}
