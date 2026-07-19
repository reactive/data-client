#!/usr/bin/env node
/**
 * BuildManifest v1 prepare / finalize for release-Hermes Android GC bench.
 *
 * prepare  — write android/app/src/main/assets/build-manifest.json
 *            buildId = deterministic sha256(schemaVersion, gitCommit, gitDirty, sourceDigest)
 * finalize — verify embedded buildId, write artifacts/build-sidecar.json with
 *            apkSha256 (artifact identity) + sidecarId (buildId∥apkSha256)
 * digest   — print current sourceDigest (for stale checks)
 * verify   — verify manifest and/or sidecar identity
 *
 * Inputs: sorted paths under this app (tracked+untracked contents) plus
 * packages/core/src, excluding build/node_modules/artifacts/.jdk/generated.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  computeBuildId,
  computeSidecarId,
  verifyManifestBuildId,
  verifySidecarIdentity,
} = require('./build-identity.cjs');

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '../..');
const ASSET_DIR = path.join(ROOT, 'android/app/src/main/assets');
const MANIFEST_PATH = path.join(ASSET_DIR, 'build-manifest.json');
const SIDECAR_PATH = path.join(ROOT, 'artifacts/build-sidecar.json');
const DEFAULT_APK = path.join(
  ROOT,
  'android/app/build/outputs/apk/release/app-release.apk',
);

const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  'build',
  'artifacts',
  '.jdk',
  '.git',
  '.gradle',
  '.idea',
  'coverage',
  'Pods',
]);

function shouldSkipDir(name) {
  return IGNORE_DIR_NAMES.has(name) || name.startsWith('.');
}

function walkFiles(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'build-manifest.json') continue; // generated
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkipDir(ent.name)) continue;
      walkFiles(full, out);
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
}

function collectInputFiles() {
  const files = [];
  walkFiles(ROOT, files);
  walkFiles(path.join(REPO, 'packages/core/src'), files);
  return files
    .map(f => path.resolve(f))
    .filter(
      f =>
        !f.includes(`${path.sep}android${path.sep}app${path.sep}build${path.sep}`),
    )
    .sort((a, b) => a.localeCompare(b));
}

function sha256File(filePath) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

function sourceDigest() {
  const h = crypto.createHash('sha256');
  for (const file of collectInputFiles()) {
    const rel = path.relative(REPO, file).split(path.sep).join('/');
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(file));
    h.update('\0');
  }
  return h.digest('hex');
}

function gitMeta() {
  try {
    const commit = execSync('git rev-parse HEAD', {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const dirty =
      execSync('git status --porcelain', {
        cwd: REPO,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim().length > 0;
    return { gitCommit: commit, gitDirty: dirty };
  } catch {
    return { gitCommit: 'unknown', gitDirty: true };
  }
}

function prepare() {
  const digest = sourceDigest();
  const { gitCommit, gitDirty } = gitMeta();
  const schemaVersion = 1;
  const buildId = computeBuildId({
    schemaVersion,
    gitCommit,
    gitDirty,
    sourceDigest: digest,
  });
  const manifest = {
    schemaVersion,
    buildId,
    gitCommit,
    gitDirty,
    sourceDigest: digest,
    createdAt: new Date().toISOString(),
  };
  verifyManifestBuildId(manifest);
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${MANIFEST_PATH}`);
  console.log(`buildId=${buildId} (source-build identity)`);
  console.log(`sourceDigest=${digest}`);
  return manifest;
}

function finalize(apkPath = DEFAULT_APK) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('missing build-manifest.json — run prepare first');
  }
  if (!fs.existsSync(apkPath)) {
    throw new Error(`APK not found: ${apkPath}`);
  }
  const splitsDir = path.join(
    ROOT,
    'android/app/build/outputs/apk/release/splits',
  );
  if (fs.existsSync(splitsDir)) {
    throw new Error(
      'split APKs unsupported; use a single release APK (assembleRelease app-release.apk)',
    );
  }
  if (path.basename(apkPath) !== 'app-release.apk') {
    console.warn(
      `warning: expected app-release.apk, got ${path.basename(apkPath)}`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  verifyManifestBuildId(manifest);

  // Stale prepare: source tree changed after prepare but before finalize.
  const currentDigest = sourceDigest();
  if (currentDigest !== manifest.sourceDigest) {
    throw new Error(
      `stale BuildManifest: sourceDigest ${manifest.sourceDigest} != current ${currentDigest}; re-run prepare`,
    );
  }

  const apkSha256 = sha256File(apkPath);
  const apkSizeBytes = fs.statSync(apkPath).size;
  const sidecarId = computeSidecarId({
    buildId: manifest.buildId,
    apkSha256,
  });
  const sidecar = {
    schemaVersion: 1,
    buildId: manifest.buildId,
    sourceDigest: manifest.sourceDigest,
    gitCommit: manifest.gitCommit,
    gitDirty: manifest.gitDirty,
    apkPath: path.resolve(apkPath),
    apkSha256,
    apkSizeBytes,
    sidecarId,
    builtAt: new Date().toISOString(),
  };
  verifySidecarIdentity(sidecar);
  fs.mkdirSync(path.dirname(SIDECAR_PATH), { recursive: true });
  fs.writeFileSync(SIDECAR_PATH, JSON.stringify(sidecar, null, 2) + '\n');
  console.log(`Wrote ${SIDECAR_PATH}`);
  console.log(`apkSha256=${apkSha256} (artifact identity)`);
  console.log(`sidecarId=${sidecarId}`);
  return sidecar;
}

function verify() {
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    verifyManifestBuildId(manifest);
    console.log(`manifest buildId ok: ${manifest.buildId}`);
  } else {
    console.log('no manifest present');
  }
  if (fs.existsSync(SIDECAR_PATH)) {
    const sidecar = JSON.parse(fs.readFileSync(SIDECAR_PATH, 'utf8'));
    verifySidecarIdentity(sidecar);
    console.log(`sidecar identity ok: sidecarId=${sidecar.sidecarId}`);
  } else {
    console.log('no sidecar present');
  }
}

function main() {
  const cmd = process.argv[2] || 'digest';
  if (cmd === 'prepare') {
    prepare();
  } else if (cmd === 'finalize') {
    finalize(process.argv[3] || DEFAULT_APK);
  } else if (cmd === 'digest') {
    console.log(sourceDigest());
  } else if (cmd === 'hash') {
    const filePath = process.argv[3];
    if (!filePath) {
      console.error('usage: build-manifest.cjs hash <file>');
      process.exit(1);
    }
    console.log(sha256File(filePath));
  } else if (cmd === 'verify') {
    verify();
  } else {
    console.error(
      'usage: build-manifest.cjs prepare|finalize [apk]|digest|hash <file>|verify',
    );
    process.exit(1);
  }
}

main();
