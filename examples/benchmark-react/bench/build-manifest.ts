/**
 * BuildManifest v1 — provenance for browser GC measurements.
 *
 * Generated after webpack build. Runner verifies local source digest + artifact
 * hashes and that the served `/gc-build-manifest.json` matches before measuring.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BENCH_ROOT = path.resolve(__dirname, '..');
export const REPO_ROOT = path.resolve(BENCH_ROOT, '../..');
export const DIST_DIR = path.join(BENCH_ROOT, 'dist');
export const MANIFEST_FILENAME = 'gc-build-manifest.json';
export const MANIFEST_PATH = path.join(DIST_DIR, MANIFEST_FILENAME);

export interface BuildManifestV1 {
  schemaVersion: 1;
  buildId: string;
  commit: string;
  dirty: boolean;
  sourceDigest: string;
  /** relative path from dist/ → sha256 hex */
  artifacts: Record<string, string>;
}

function sha256Buffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath: string): string {
  return sha256Buffer(fs.readFileSync(filePath));
}

function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/** Walk directory; return absolute file paths sorted. */
function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (
          ent.name === 'node_modules' ||
          ent.name === 'dist' ||
          ent.name === '.git'
        )
          continue;
        stack.push(p);
      } else if (ent.isFile()) {
        out.push(p);
      }
    }
  }
  return out.sort();
}

/**
 * Sorted relevant inputs for sourceDigest:
 * packages/core/src + benchmark-react src/bench/config/package files.
 * Hashes actual file contents (includes dirty/untracked).
 */
export function listSourceInputFiles(): string[] {
  const files = new Set<string>();
  for (const f of walkFiles(path.join(REPO_ROOT, 'packages/core/src'))) {
    files.add(f);
  }
  const benchRoots = [
    path.join(BENCH_ROOT, 'src'),
    path.join(BENCH_ROOT, 'bench'),
  ];
  for (const root of benchRoots) {
    for (const f of walkFiles(root)) files.add(f);
  }
  for (const name of [
    'package.json',
    'tsconfig.json',
    'webpack.config.cjs',
    '.babelrc.js',
    'playwright.config.ts',
  ]) {
    const p = path.join(BENCH_ROOT, name);
    if (fs.existsSync(p)) files.add(p);
  }
  return [...files].sort();
}

export function computeSourceDigest(files = listSourceInputFiles()): string {
  const h = createHash('sha256');
  for (const abs of files) {
    const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/');
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(abs));
    h.update('\0');
  }
  return h.digest('hex');
}

export function listDistArtifacts(distDir = DIST_DIR): string[] {
  return walkFiles(distDir)
    .filter(f => path.basename(f) !== MANIFEST_FILENAME)
    .sort();
}

export function hashDistArtifacts(distDir = DIST_DIR): Record<string, string> {
  const artifacts: Record<string, string> = {};
  for (const abs of listDistArtifacts(distDir)) {
    const rel = path.relative(distDir, abs).split(path.sep).join('/');
    artifacts[rel] = sha256File(abs);
  }
  // Stable key order
  return Object.fromEntries(
    Object.keys(artifacts)
      .sort()
      .map(k => [k, artifacts[k]]),
  );
}

export function isGitDirty(): boolean {
  const status = git('status --porcelain');
  return status.length > 0;
}

export function gitCommitFull(): string {
  return git('rev-parse HEAD') || 'unknown';
}

export function computeBuildId(inputs: {
  schemaVersion: 1;
  commit: string;
  dirty: boolean;
  sourceDigest: string;
  artifacts: Record<string, string>;
}): string {
  const h = createHash('sha256');
  // Canonical BuildManifest v1 inputs (order fixed; artifacts sorted by path)
  h.update(`schemaVersion:${inputs.schemaVersion}\n`);
  h.update(`commit:${inputs.commit}\n`);
  h.update(`dirty:${inputs.dirty ? '1' : '0'}\n`);
  h.update(`sourceDigest:${inputs.sourceDigest}\n`);
  for (const k of Object.keys(inputs.artifacts).sort()) {
    h.update(k);
    h.update(':');
    h.update(inputs.artifacts[k]);
    h.update('\n');
  }
  return h.digest('hex');
}

export function writeBuildManifest(distDir = DIST_DIR): BuildManifestV1 {
  fs.mkdirSync(distDir, { recursive: true });
  const sourceDigest = computeSourceDigest();
  const artifacts = hashDistArtifacts(distDir);
  const commit = gitCommitFull();
  const dirty = isGitDirty();
  const schemaVersion = 1 as const;
  const buildId = computeBuildId({
    schemaVersion,
    commit,
    dirty,
    sourceDigest,
    artifacts,
  });
  const manifest: BuildManifestV1 = {
    schemaVersion,
    buildId,
    commit,
    dirty,
    sourceDigest,
    artifacts,
  };
  fs.writeFileSync(
    path.join(distDir, MANIFEST_FILENAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

export function readBuildManifest(
  manifestPath = MANIFEST_PATH,
): BuildManifestV1 {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (raw.schemaVersion !== 1) {
    throw new Error(
      `unsupported build manifest schemaVersion: ${raw.schemaVersion}`,
    );
  }
  return raw as BuildManifestV1;
}

export interface ProvenanceVerification {
  ok: true;
  manifest: BuildManifestV1;
}

/**
 * Verify local source digest + on-disk artifact hashes match the manifest.
 * Does not fetch the served URL (caller does that separately).
 */
export function verifyLocalManifest(
  manifest: BuildManifestV1,
  distDir = DIST_DIR,
): void {
  const sourceDigest = computeSourceDigest();
  if (sourceDigest !== manifest.sourceDigest) {
    throw new Error(
      `stale build: sourceDigest mismatch (manifest ${manifest.sourceDigest.slice(0, 12)}… vs current ${sourceDigest.slice(0, 12)}…). Rebuild with yarn build.`,
    );
  }
  const artifacts = hashDistArtifacts(distDir);
  const manKeys = Object.keys(manifest.artifacts).sort();
  const curKeys = Object.keys(artifacts).sort();
  if (manKeys.join('\n') !== curKeys.join('\n')) {
    throw new Error(
      'stale/tampered build: dist artifact set does not match manifest',
    );
  }
  for (const k of manKeys) {
    if (artifacts[k] !== manifest.artifacts[k]) {
      throw new Error(
        `tampered/stale artifact: ${k} hash mismatch (rebuild required)`,
      );
    }
  }
  const buildId = computeBuildId({
    schemaVersion: 1,
    commit: manifest.commit,
    dirty: manifest.dirty,
    sourceDigest,
    artifacts,
  });
  if (buildId !== manifest.buildId) {
    throw new Error(
      'buildId mismatch after recompute (manifest fields tampered or corrupted?)',
    );
  }
}

/** CLI: write manifest after webpack. */
async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`dist/ missing at ${DIST_DIR}; run webpack build first`);
  }
  const m = writeBuildManifest();
  process.stderr.write(
    `BuildManifest v1 → ${MANIFEST_FILENAME} buildId=${m.buildId.slice(0, 16)}… commit=${m.commit.slice(0, 8)} dirty=${m.dirty}\n`,
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
