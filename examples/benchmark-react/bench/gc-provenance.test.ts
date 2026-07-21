/**
 * Provenance tamper tests: artifact / commit / dirty / buildId must fail verify.
 *
 *   yarn test:gc-provenance
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  DIST_DIR,
  MANIFEST_PATH,
  computeBuildId,
  readBuildManifest,
  verifyLocalManifest,
  writeBuildManifest,
  type BuildManifestV1,
} from './build-manifest.ts';

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function expectVerifyFail(label: string, mutate: (m: BuildManifestV1) => void) {
  const original = fs.readFileSync(MANIFEST_PATH, 'utf8');
  try {
    const m = readBuildManifest();
    mutate(m);
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(m, null, 2)}\n`);
    let failed = false;
    try {
      verifyLocalManifest(readBuildManifest());
    } catch (err) {
      failed = true;
      process.stderr.write(
        `provenance: ${label} rejected: ${err instanceof Error ? err.message : err}\n`,
      );
    }
    assert(failed, `${label}: expected verifyLocalManifest to fail`);
  } finally {
    fs.writeFileSync(MANIFEST_PATH, original);
  }
}

if (
  !fs.existsSync(DIST_DIR) ||
  !fs.existsSync(path.join(DIST_DIR, 'data-client.js'))
) {
  throw new Error('dist/ incomplete — run yarn build first');
}

// Ensure a fresh manifest exists for the current tree
writeBuildManifest();
const manifest = readBuildManifest();
verifyLocalManifest(manifest);
process.stderr.write('provenance: clean verify OK\n');

// Canonical buildId includes schemaVersion, commit, dirty, sourceDigest, artifacts
{
  const expected = computeBuildId({
    schemaVersion: 1,
    commit: manifest.commit,
    dirty: manifest.dirty,
    sourceDigest: manifest.sourceDigest,
    artifacts: manifest.artifacts,
  });
  assert(
    expected === manifest.buildId,
    'stored buildId must match canonical digest of manifest fields',
  );
  const flippedDirty = computeBuildId({
    schemaVersion: 1,
    commit: manifest.commit,
    dirty: !manifest.dirty,
    sourceDigest: manifest.sourceDigest,
    artifacts: manifest.artifacts,
  });
  assert(flippedDirty !== manifest.buildId, 'dirty bit must affect buildId');
  const otherCommit = computeBuildId({
    schemaVersion: 1,
    commit: `${manifest.commit}dead`,
    dirty: manifest.dirty,
    sourceDigest: manifest.sourceDigest,
    artifacts: manifest.artifacts,
  });
  assert(otherCommit !== manifest.buildId, 'commit must affect buildId');
}

// Artifact content tamper
const target = path.join(DIST_DIR, 'data-client.js');
const originalArtifact = fs.readFileSync(target);
try {
  fs.writeFileSync(
    target,
    Buffer.concat([originalArtifact, Buffer.from('\n/* tamper */\n')]),
  );
  let failed = false;
  try {
    verifyLocalManifest(readBuildManifest());
  } catch (err) {
    failed = true;
    process.stderr.write(
      `provenance: artifact tamper rejected: ${err instanceof Error ? err.message : err}\n`,
    );
  }
  assert(failed, 'tampered artifact must fail verifyLocalManifest');
} finally {
  fs.writeFileSync(target, originalArtifact);
  writeBuildManifest();
  verifyLocalManifest(readBuildManifest());
}

// Manifest field tampers (buildId left stale → mismatch)
expectVerifyFail('commit field tamper', m => {
  m.commit = `${m.commit}0`;
});
expectVerifyFail('dirty field tamper', m => {
  m.dirty = !m.dirty;
});
expectVerifyFail('buildId field tamper', m => {
  m.buildId = '0'.repeat(64);
});

verifyLocalManifest(readBuildManifest());
assert(fs.existsSync(MANIFEST_PATH), 'manifest exists');
process.stderr.write('gc-provenance: all assertions passed\n');
