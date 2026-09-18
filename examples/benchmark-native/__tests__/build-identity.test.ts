/**
 * Deterministic buildId / sidecarId identity (source vs artifact).
 */
const {
  computeBuildId,
  computeSidecarId,
  verifyManifestBuildId,
  verifySidecarIdentity,
} = require('../scripts/build-identity.cjs');

const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const APK_A = 'c'.repeat(64);
const APK_B = 'd'.repeat(64);

describe('computeBuildId', () => {
  it('is deterministic over schemaVersion, gitCommit, gitDirty, sourceDigest', () => {
    const a = computeBuildId({
      schemaVersion: 1,
      gitCommit: 'abc',
      gitDirty: false,
      sourceDigest: DIGEST_A,
    });
    const b = computeBuildId({
      schemaVersion: 1,
      gitCommit: 'abc',
      gitDirty: false,
      sourceDigest: DIGEST_A,
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when any canonical input changes', () => {
    const base = {
      schemaVersion: 1 as const,
      gitCommit: 'abc',
      gitDirty: false,
      sourceDigest: DIGEST_A,
    };
    const id = computeBuildId(base);
    expect(computeBuildId({ ...base, gitCommit: 'xyz' })).not.toBe(id);
    expect(computeBuildId({ ...base, gitDirty: true })).not.toBe(id);
    expect(computeBuildId({ ...base, sourceDigest: DIGEST_B })).not.toBe(id);
  });
});

describe('verifyManifestBuildId', () => {
  it('accepts a consistent manifest', () => {
    const inputs = {
      schemaVersion: 1,
      gitCommit: 'deadbeef',
      gitDirty: true,
      sourceDigest: DIGEST_A,
    };
    const buildId = computeBuildId(inputs);
    expect(verifyManifestBuildId({ ...inputs, buildId })).toBe(buildId);
  });

  it('rejects forged buildId', () => {
    expect(() =>
      verifyManifestBuildId({
        schemaVersion: 1,
        buildId: '0'.repeat(64),
        gitCommit: 'deadbeef',
        gitDirty: false,
        sourceDigest: DIGEST_A,
      }),
    ).toThrow(/buildId mismatch/);
  });

  it('rejects tampered metadata that no longer matches buildId', () => {
    const inputs = {
      schemaVersion: 1,
      gitCommit: 'deadbeef',
      gitDirty: false,
      sourceDigest: DIGEST_A,
    };
    const buildId = computeBuildId(inputs);
    expect(() =>
      verifyManifestBuildId({
        ...inputs,
        buildId,
        sourceDigest: DIGEST_B,
      }),
    ).toThrow(/buildId mismatch/);
  });
});

describe('computeSidecarId / verifySidecarIdentity', () => {
  it('binds source buildId to artifact apkSha256', () => {
    const buildId = computeBuildId({
      schemaVersion: 1,
      gitCommit: 'abc',
      gitDirty: false,
      sourceDigest: DIGEST_A,
    });
    const id1 = computeSidecarId({ buildId, apkSha256: APK_A });
    const id2 = computeSidecarId({ buildId, apkSha256: APK_B });
    expect(id1).not.toBe(id2);
    // Same APK + same source → same sidecarId
    expect(computeSidecarId({ buildId, apkSha256: APK_A })).toBe(id1);
  });

  it('rejects tampered sidecarId while preserving buildId checks', () => {
    const inputs = {
      schemaVersion: 1,
      gitCommit: 'abc',
      gitDirty: false,
      sourceDigest: DIGEST_A,
    };
    const buildId = computeBuildId(inputs);
    const apkSha256 = APK_A;
    const sidecarId = computeSidecarId({ buildId, apkSha256 });
    expect(
      verifySidecarIdentity({ ...inputs, buildId, apkSha256, sidecarId }),
    ).toBe(sidecarId);
    expect(() =>
      verifySidecarIdentity({
        ...inputs,
        buildId,
        apkSha256,
        sidecarId: '0'.repeat(64),
      }),
    ).toThrow(/sidecarId mismatch/);
  });
});
