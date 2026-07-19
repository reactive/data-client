/**
 * BuildManifest v1 for the Node GC harness.
 *
 * Generated after webpack (`yarn build` / `yarn build:benchmark`) as
 * `dist/gc-build-manifest.json`. `start:gc` verifies source + artifact digests
 * before any scenario work and reports provenance from the verified manifest
 * (never current HEAD alone).
 *
 * Usage:
 *   node ./gc-build-manifest.js write
 *   node ./gc-build-manifest.js verify
 *   node ./gc-build-manifest.js self-test
 */
import { Buffer } from 'node:buffer';
import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BENCH_ROOT = __dirname;
const REPO_ROOT = path.resolve(BENCH_ROOT, '../..');

export const MANIFEST_SCHEMA_VERSION = 1;
export const MANIFEST_RELATIVE = 'dist/gc-build-manifest.json';
export const MANIFEST_PATH = path.join(BENCH_ROOT, MANIFEST_RELATIVE);

/** Benchmark harness / runner / config inputs (relative to repo root). */
const BENCH_SOURCE_FILES = [
  'examples/benchmark/gc-build-manifest.js',
  'examples/benchmark/gc-policy.js',
  'examples/benchmark/gc-policy-scenarios.js',
  'examples/benchmark/filter.js',
  'examples/benchmark/package.json',
  'examples/benchmark/webpack.config.cjs',
  'examples/benchmark/src/index.ts',
  'examples/benchmark/tsconfig.json',
];

const CORE_SRC_DIR = 'packages/core/src';

function sha256Buffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(text, 'utf8'));
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** Walk a directory; return repo-relative posix paths (files only), sorted. */
function walkFiles(absDir, repoRelDir) {
  const out = [];
  if (!existsSync(absDir)) return out;
  const entries = readdirSync(absDir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    const rel = toPosix(path.join(repoRelDir, ent.name));
    if (ent.isDirectory()) {
      out.push(...walkFiles(abs, rel));
    } else if (ent.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

/**
 * Sorted list of relevant source paths (repo-relative posix).
 * Includes untracked files under packages/core/src when present on disk.
 */
export function listRelevantSourcePaths() {
  const coreFiles = walkFiles(path.join(REPO_ROOT, CORE_SRC_DIR), CORE_SRC_DIR);
  const benchFiles = BENCH_SOURCE_FILES.filter(rel =>
    existsSync(path.join(REPO_ROOT, rel)),
  );
  return [...new Set([...coreFiles, ...benchFiles])].sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Canonical source digest over sorted path→content (filesystem, not git blobs).
 * Dirty/untracked relevant files change this digest.
 */
export function computeSourceDigest(paths = listRelevantSourcePaths()) {
  const hash = createHash('sha256');
  for (const rel of paths) {
    const abs = path.join(REPO_ROOT, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      throw new Error(`relevant source missing: ${rel}`);
    }
    hash.update(rel);
    hash.update('\0');
    hash.update(readFileSync(abs));
    hash.update('\0');
  }
  return hash.digest('hex');
}

/** Dist artifact paths relative to examples/benchmark, excluding the manifest. */
export function listDistArtifactPaths() {
  const distDir = path.join(BENCH_ROOT, 'dist');
  if (!existsSync(distDir)) return [];
  const out = [];
  for (const name of readdirSync(distDir)) {
    if (name === 'gc-build-manifest.json') continue;
    const abs = path.join(distDir, name);
    if (statSync(abs).isFile()) {
      out.push(toPosix(path.join('dist', name)));
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function hashDistArtifacts(paths = listDistArtifactPaths()) {
  /** @type {Record<string, string>} */
  const artifacts = {};
  for (const rel of paths) {
    const abs = path.join(BENCH_ROOT, rel);
    if (!existsSync(abs)) {
      throw new Error(`dist artifact missing: ${rel}`);
    }
    artifacts[rel] = sha256Buffer(readFileSync(abs));
  }
  return artifacts;
}

export function gitCommitFull() {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * dirty=true when any relevant path is modified, added, or untracked vs git.
 */
export function computeDirty(paths = listRelevantSourcePaths()) {
  try {
    const pathspecs = [CORE_SRC_DIR, ...BENCH_SOURCE_FILES];
    const out = execFileSync(
      'git',
      ['status', '--porcelain', '-u', '--', ...pathspecs],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim();
    if (!out) return false;
    const relevant = new Set(paths);
    for (const line of out.split('\n')) {
      if (!line) continue;
      const rest = line.slice(3);
      const filePath = rest.includes(' -> ') ? rest.split(' -> ').pop() : rest;
      const norm = toPosix(filePath.replace(/^"|"$/g, ''));
      if (
        relevant.has(norm) ||
        norm.startsWith(`${CORE_SRC_DIR}/`) ||
        BENCH_SOURCE_FILES.includes(norm)
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * buildId = digest of canonical manifest fields excluding buildId itself.
 */
export function computeBuildId({
  schemaVersion,
  commit,
  dirty,
  sourceDigest,
  artifacts,
}) {
  const sortedArtifacts = Object.fromEntries(
    Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b)),
  );
  const canonical = JSON.stringify({
    schemaVersion,
    commit,
    dirty,
    sourceDigest,
    artifacts: sortedArtifacts,
  });
  return sha256Text(canonical);
}

export function buildManifest() {
  const paths = listRelevantSourcePaths();
  const sourceDigest = computeSourceDigest(paths);
  const artifacts = hashDistArtifacts();
  if (Object.keys(artifacts).length === 0) {
    throw new Error(
      'no dist artifacts found; run webpack before writing the GC build manifest',
    );
  }
  const commit = gitCommitFull();
  const dirty = computeDirty(paths);
  const body = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    commit,
    dirty,
    sourceDigest,
    artifacts,
  };
  const buildId = computeBuildId(body);
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    buildId,
    commit,
    dirty,
    sourceDigest,
    artifacts,
  };
}

export function writeManifest(manifest = buildManifest()) {
  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  return manifest;
}

export function readManifest(manifestPath = MANIFEST_PATH) {
  if (!existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

const REBUILD_HINT =
  'Rebuild with: yarn build:benchmark   (or: yarn workspace example-benchmark run build)';

/**
 * Recompute current source digest + dist artifact hashes and compare to manifest.
 * @returns {{ ok: true, manifest: object } | { ok: false, reason: string, details?: string[] }}
 */
export function verifyManifest(manifestPath = MANIFEST_PATH) {
  const details = [];
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      reason: `missing build manifest at ${MANIFEST_RELATIVE}`,
      details: [REBUILD_HINT],
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return {
      ok: false,
      reason: `unreadable build manifest: ${err.message}`,
      details: [REBUILD_HINT],
    };
  }

  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `unsupported manifest schemaVersion ${manifest.schemaVersion} (expected ${MANIFEST_SCHEMA_VERSION})`,
      details: [REBUILD_HINT],
    };
  }

  const expectedBuildId = computeBuildId({
    schemaVersion: manifest.schemaVersion,
    commit: manifest.commit,
    dirty: manifest.dirty,
    sourceDigest: manifest.sourceDigest,
    artifacts: manifest.artifacts ?? {},
  });
  if (manifest.buildId !== expectedBuildId) {
    details.push(
      `buildId mismatch (manifest tampered or corrupt): got ${manifest.buildId}, expected ${expectedBuildId}`,
    );
  }

  let currentSourceDigest;
  try {
    currentSourceDigest = computeSourceDigest();
  } catch (err) {
    return {
      ok: false,
      reason: err.message,
      details: [REBUILD_HINT],
    };
  }
  if (currentSourceDigest !== manifest.sourceDigest) {
    details.push(
      `sourceDigest stale: manifest ${manifest.sourceDigest.slice(0, 12)}… vs current ${currentSourceDigest.slice(0, 12)}… (relevant sources changed since build)`,
    );
  }

  const currentArtifacts = hashDistArtifacts();
  const manifestArts = manifest.artifacts ?? {};
  const allKeys = new Set([
    ...Object.keys(manifestArts),
    ...Object.keys(currentArtifacts),
  ]);
  for (const key of [...allKeys].sort()) {
    if (!(key in manifestArts)) {
      details.push(`unexpected dist artifact not in manifest: ${key}`);
    } else if (!(key in currentArtifacts)) {
      details.push(`missing dist artifact listed in manifest: ${key}`);
    } else if (manifestArts[key] !== currentArtifacts[key]) {
      details.push(
        `dist artifact hash mismatch: ${key} (tampered or stale webpack output)`,
      );
    }
  }

  if (details.length) {
    return {
      ok: false,
      reason: 'GC build provenance verification failed',
      details: [...details, REBUILD_HINT],
    };
  }

  return { ok: true, manifest };
}

export function verifyManifestOrThrow(manifestPath = MANIFEST_PATH) {
  const result = verifyManifest(manifestPath);
  if (!result.ok) {
    const msg = [result.reason, ...(result.details ?? [])].join('\n  ');
    throw new Error(msg);
  }
  return result.manifest;
}

/**
 * Prove source + artifact tampering rejects, restoring all files afterward.
 */
export function runSelfTest() {
  const steps = [];
  const baseline = verifyManifest();
  if (!baseline.ok) {
    throw new Error(
      `self-test requires a valid build first:\n  ${baseline.reason}\n  ${REBUILD_HINT}`,
    );
  }
  steps.push('baseline verify: ok');

  // --- artifact tamper ---
  const artifactRel = Object.keys(baseline.manifest.artifacts)[0];
  if (!artifactRel) throw new Error('self-test: no artifacts in manifest');
  const artifactAbs = path.join(BENCH_ROOT, artifactRel);
  const artifactOrig = readFileSync(artifactAbs);
  try {
    writeFileSync(
      artifactAbs,
      Buffer.concat([artifactOrig, Buffer.from('\n')]),
    );
    const afterArt = verifyManifest();
    if (afterArt.ok) {
      throw new Error('self-test: expected artifact tampering to be rejected');
    }
    steps.push(
      `artifact tamper rejected: ${afterArt.details?.[0] ?? afterArt.reason}`,
    );
  } finally {
    writeFileSync(artifactAbs, artifactOrig);
  }
  const restoredArt = verifyManifest();
  if (!restoredArt.ok) {
    throw new Error(
      `self-test: artifact restore failed verify: ${restoredArt.reason}`,
    );
  }
  steps.push('artifact restore: ok');

  // --- source tamper via temporary untracked file under packages/core/src ---
  const tmpRel = `${CORE_SRC_DIR}/.__gc_manifest_selftest__.tmp`;
  const tmpAbs = path.join(REPO_ROOT, tmpRel);
  try {
    writeFileSync(tmpAbs, '// gc-build-manifest self-test — safe to delete\n');
    const afterSrc = verifyManifest();
    if (afterSrc.ok) {
      throw new Error('self-test: expected source tampering to be rejected');
    }
    steps.push(
      `source tamper rejected: ${afterSrc.details?.[0] ?? afterSrc.reason}`,
    );
  } finally {
    if (existsSync(tmpAbs)) unlinkSync(tmpAbs);
  }
  const restoredSrc = verifyManifest();
  if (!restoredSrc.ok) {
    throw new Error(
      `self-test: source restore failed verify: ${restoredSrc.reason}`,
    );
  }
  steps.push('source restore: ok');

  // --- manifest buildId tamper ---
  const manifestOrig = readFileSync(MANIFEST_PATH);
  try {
    const mangled = JSON.parse(manifestOrig.toString('utf8'));
    mangled.buildId = '0'.repeat(64);
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(mangled, null, 2)}\n`);
    const afterMan = verifyManifest();
    if (afterMan.ok) {
      throw new Error(
        'self-test: expected manifest buildId tamper to be rejected',
      );
    }
    steps.push(
      `manifest tamper rejected: ${afterMan.details?.[0] ?? afterMan.reason}`,
    );
  } finally {
    writeFileSync(MANIFEST_PATH, manifestOrig);
  }
  const final = verifyManifest();
  if (!final.ok) {
    throw new Error(`self-test: final verify failed: ${final.reason}`);
  }
  steps.push('final verify: ok');

  return { ok: true, steps, manifest: final.manifest };
}

function printVerifyFailure(result) {
  console.error(result.reason);
  for (const d of result.details ?? []) {
    console.error(`  ${d}`);
  }
}

function main(argv) {
  const cmd = argv[0] ?? 'write';
  if (cmd === 'write') {
    const manifest = writeManifest();
    console.error(
      `wrote ${MANIFEST_RELATIVE} buildId=${manifest.buildId.slice(0, 12)}… commit=${manifest.commit.slice(0, 12)}… dirty=${manifest.dirty} artifacts=${Object.keys(manifest.artifacts).length}`,
    );
    return;
  }
  if (cmd === 'verify') {
    const result = verifyManifest();
    if (!result.ok) {
      printVerifyFailure(result);
      process.exitCode = 1;
      return;
    }
    console.error(
      `GC build manifest OK buildId=${result.manifest.buildId.slice(0, 12)}… commit=${result.manifest.commit.slice(0, 12)}…`,
    );
    return;
  }
  if (cmd === 'self-test') {
    try {
      const result = runSelfTest();
      for (const step of result.steps) {
        console.error(`  ${step}`);
      }
      console.error('gc-build-manifest self-test passed');
    } catch (err) {
      console.error(err.message ?? err);
      process.exitCode = 1;
    }
    return;
  }
  console.error(`unknown command: ${cmd} (expected write|verify|self-test)`);
  process.exitCode = 1;
}

const isMain =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main(process.argv.slice(2));
}
