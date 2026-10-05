#!/usr/bin/env node
/**
 * Reject a pulled report that is not this run, then attach sidecar provenance.
 *
 * buildId alone is not enough: another scenario from the same APK shares it.
 * kind, pattern, count, control, and sample count must match the request.
 *
 * Usage:
 *   node accept-collected-report.cjs <report> <sidecar> <installedSha> \
 *     <kind> <pattern> <count> <control> <samples>
 */
const fs = require('fs');

function parseCount(label, raw) {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`error: invalid ${label}: ${raw}`);
  }
  return n;
}

/**
 * @param {object} report
 * @param {{ buildId: string, candidateKind: string, pattern: string, count: number, control: string, samples: number }} expected
 */
function assertCollectedReport(report, expected) {
  const embedded = report.build && report.build.buildId;
  if (!embedded || embedded !== expected.buildId) {
    throw new Error(
      `error: report buildId ${embedded} != sidecar ${expected.buildId}`,
    );
  }
  const scenario = report.scenarios && report.scenarios[0];
  if (!scenario) {
    throw new Error('error: pulled report has no scenario');
  }
  const sampleCount = Array.isArray(scenario.samples)
    ? scenario.samples.length
    : NaN;
  const problems = [];
  if (scenario.candidateKind !== expected.candidateKind) {
    problems.push(
      `kind ${scenario.candidateKind} != ${expected.candidateKind}`,
    );
  }
  if (scenario.pattern !== expected.pattern) {
    problems.push(`pattern ${scenario.pattern} != ${expected.pattern}`);
  }
  if (scenario.count !== expected.count) {
    problems.push(`count ${scenario.count} != ${expected.count}`);
  }
  if (scenario.control !== expected.control) {
    problems.push(`control ${scenario.control} != ${expected.control}`);
  }
  if (sampleCount !== expected.samples) {
    problems.push(`samples ${sampleCount} != ${expected.samples}`);
  }
  if (problems.length) {
    throw new Error(
      `error: pulled report does not match request: ${problems.join('; ')}`,
    );
  }
}

/**
 * @param {object} report
 * @param {object} sidecar
 * @param {string} installedSha
 */
function attachSidecar(report, sidecar, installedSha) {
  report.build = report.build || {};
  report.build.sidecar = {
    buildId: sidecar.buildId,
    sourceDigest: sidecar.sourceDigest,
    apkSha256: sidecar.apkSha256,
    apkPath: sidecar.apkPath,
    sidecarId: sidecar.sidecarId,
  };
  report.build.installedApkSha256 = installedSha;
  report.build.apkSizeBytes = sidecar.apkSizeBytes;
  return report;
}

function acceptCollectedReportFile(argv) {
  const [
    out,
    sidecarPath,
    installedSha,
    candidateKind,
    pattern,
    countRaw,
    control,
    samplesRaw,
  ] = argv;
  if (
    !out ||
    !sidecarPath ||
    !installedSha ||
    !candidateKind ||
    !pattern ||
    countRaw == null ||
    !control ||
    samplesRaw == null
  ) {
    throw new Error(
      'usage: accept-collected-report.cjs <report> <sidecar> <installedSha> <kind> <pattern> <count> <control> <samples>',
    );
  }
  const report = JSON.parse(fs.readFileSync(out, 'utf8'));
  const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
  assertCollectedReport(report, {
    buildId: sidecar.buildId,
    candidateKind,
    pattern,
    count: parseCount('count', countRaw),
    control,
    samples: parseCount('samples', samplesRaw),
  });
  attachSidecar(report, sidecar, installedSha);
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(
    `provenance ok buildId=${sidecar.buildId} sidecarId=${sidecar.sidecarId}`,
  );
}

module.exports = {
  assertCollectedReport,
  attachSidecar,
  parseCount,
};

if (require.main === module) {
  try {
    acceptCollectedReportFile(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
