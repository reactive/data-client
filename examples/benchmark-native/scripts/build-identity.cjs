/**
 * Deterministic BuildManifest / sidecar identity helpers (pure).
 *
 * buildId  — source-build identity: sha256 over canonical v1 inputs
 *            (schemaVersion, gitCommit, gitDirty, sourceDigest).
 *            Does NOT include createdAt or artifact hashes.
 * sidecarId — artifact-aware identity: sha256(buildId || apkSha256).
 */
const crypto = require('crypto');

/**
 * @param {{ schemaVersion: number, gitCommit: string, gitDirty: boolean, sourceDigest: string }} inputs
 * @returns {string} hex sha256
 */
function computeBuildId(inputs) {
  if (inputs.schemaVersion !== 1) {
    throw new Error(`unsupported schemaVersion=${inputs.schemaVersion}`);
  }
  if (typeof inputs.gitCommit !== 'string' || !inputs.gitCommit) {
    throw new Error('gitCommit required');
  }
  if (typeof inputs.gitDirty !== 'boolean') {
    throw new Error('gitDirty must be boolean');
  }
  if (typeof inputs.sourceDigest !== 'string' || !/^[0-9a-f]{64}$/.test(inputs.sourceDigest)) {
    throw new Error('sourceDigest must be 64-char hex sha256');
  }
  // Canonical encoding: fixed field order, no timestamps/artifacts.
  const payload = [
    String(inputs.schemaVersion),
    inputs.gitCommit,
    inputs.gitDirty ? '1' : '0',
    inputs.sourceDigest,
  ].join('\0');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * @param {{ buildId: string, apkSha256: string }} inputs
 * @returns {string} hex sha256
 */
function computeSidecarId(inputs) {
  if (typeof inputs.buildId !== 'string' || !/^[0-9a-f]{64}$/.test(inputs.buildId)) {
    throw new Error('buildId must be 64-char hex sha256');
  }
  if (typeof inputs.apkSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(inputs.apkSha256)) {
    throw new Error('apkSha256 must be 64-char hex sha256');
  }
  return crypto
    .createHash('sha256')
    .update(`${inputs.buildId}\0${inputs.apkSha256}`, 'utf8')
    .digest('hex');
}

/**
 * Recompute buildId from manifest fields and ensure it matches.
 * Catches tampered metadata or a forged buildId.
 * @param {{ schemaVersion: number, buildId: string, gitCommit: string, gitDirty: boolean, sourceDigest: string }} manifest
 */
function verifyManifestBuildId(manifest) {
  const expected = computeBuildId({
    schemaVersion: manifest.schemaVersion,
    gitCommit: manifest.gitCommit,
    gitDirty: manifest.gitDirty,
    sourceDigest: manifest.sourceDigest,
  });
  if (manifest.buildId !== expected) {
    throw new Error(
      `buildId mismatch: embedded=${manifest.buildId} expected=${expected} (tampered metadata or forged buildId)`,
    );
  }
  return expected;
}

/**
 * Verify sidecar buildId + sidecarId against fields + apkSha256.
 * @param {{ schemaVersion: number, buildId: string, gitCommit: string, gitDirty: boolean, sourceDigest: string, apkSha256: string, sidecarId?: string }} sidecar
 */
function verifySidecarIdentity(sidecar) {
  verifyManifestBuildId(sidecar);
  const expectedSidecarId = computeSidecarId({
    buildId: sidecar.buildId,
    apkSha256: sidecar.apkSha256,
  });
  if (sidecar.sidecarId == null || sidecar.sidecarId === '') {
    throw new Error('sidecarId required (artifact-aware identity)');
  }
  if (sidecar.sidecarId !== expectedSidecarId) {
    throw new Error(
      `sidecarId mismatch: embedded=${sidecar.sidecarId} expected=${expectedSidecarId}`,
    );
  }
  return expectedSidecarId;
}

module.exports = {
  computeBuildId,
  computeSidecarId,
  verifyManifestBuildId,
  verifySidecarIdentity,
};
