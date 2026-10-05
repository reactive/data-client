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
 * Inputs: sorted paths under this app (tracked+untracked contents) plus the
 * package files the release Metro bundle actually resolves (@data-client/*
 * via package exports key order: import → node.mjs, require → dist/) and
 * examples/gc-shared, excluding build/node_modules/artifacts/.jdk/generated.
 * prepare rebuilds those package bundles (build:bundle) before hashing.
 */
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

const { resolve: metroResolve } = require('metro-resolver');

let metroResolverConfig;
function loadMetroResolverConfig() {
  if (!metroResolverConfig) {
    metroResolverConfig = require(path.join(ROOT, 'metro.config.js')).resolver;
  }
  return metroResolverConfig;
}

function realpathOrSelf(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return filePath;
  }
}

function fileSystemLookup(filePath) {
  try {
    const stat = fs.lstatSync(filePath);
    return {
      exists: true,
      type: stat.isDirectory() ? 'd' : 'f',
      realPath: realpathOrSelf(filePath),
    };
  } catch {
    return { exists: false };
  }
}

function getPackageForModule(abs) {
  let dir = abs;
  try {
    if (!fs.statSync(abs).isDirectory()) dir = path.dirname(abs);
  } catch {
    dir = path.dirname(abs);
  }
  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const rel = path.relative(dir, abs);
      return {
        rootPath: dir,
        packageJson: JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
        packageRelativePath: rel === '' ? '' : rel,
      };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Same resolver context the release bundle uses (metro.config.js + RN defaults).
 * isESMImport selects the `import` condition; otherwise Metro asserts `require`.
 * Both are tried before `react-native` because matching follows the package's
 * own exports key order.
 */
function metroResolveContext(originModulePath, isESMImport) {
  const resolver = loadMetroResolverConfig();
  return {
    allowHaste: false,
    assetExts: new Set(resolver.assetExts || []),
    dev: false,
    disableHierarchicalLookup: !!resolver.disableHierarchicalLookup,
    doesFileExist: filePath => {
      try {
        return fs.statSync(filePath).isFile();
      } catch {
        return false;
      }
    },
    extraNodeModules: resolver.extraNodeModules || {},
    fileSystemLookup,
    getPackage: pkgPath => JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
    getPackageForModule,
    isESMImport,
    mainFields: resolver.resolverMainFields,
    nodeModulesPaths: resolver.nodeModulesPaths,
    originModulePath,
    preferNativePlatform: true,
    resolveAsset: () => null,
    resolveRequest: resolver.resolveRequest || null,
    sourceExts: resolver.sourceExts,
    unstable_conditionNames: resolver.unstable_conditionNames,
    unstable_conditionsByPlatform: resolver.unstable_conditionsByPlatform,
    unstable_enablePackageExports: resolver.unstable_enablePackageExports,
    unstable_logWarning: () => {},
  };
}

function resolveMetroFile(originModulePath, specifier, isESMImport) {
  const resolved = metroResolve(
    metroResolveContext(originModulePath, isESMImport),
    specifier,
    'android',
  );
  if (!resolved || resolved.type !== 'sourceFile' || !resolved.filePath) {
    throw new Error(
      `Metro did not resolve ${specifier} from ${originModulePath}`,
    );
  }
  return resolved.filePath;
}

function staticDependencies(code) {
  const deps = [];
  const seen = new Set();
  const add = (specifier, isESMImport) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@data-client/')) {
      return;
    }
    const key = `${isESMImport ? 'esm' : 'cjs'}:${specifier}`;
    if (seen.has(key)) return;
    seen.add(key);
    deps.push({ specifier, isESMImport });
  };
  const esmFrom =
    /(?:^|[;\n])\s*(?:import|export)\s+(?!type\b)[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g;
  const esmSide = /(?:^|[;\n])\s*import\s+['"]([^'"]+)['"]/g;
  const cjs = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = esmFrom.exec(code))) add(match[1], true);
  while ((match = esmSide.exec(code))) add(match[1], true);
  while ((match = cjs.exec(code))) add(match[1], false);
  return deps;
}

function shouldFollowResolved(filePath) {
  const rel = path.relative(REPO, filePath).split(path.sep).join('/');
  if (rel.startsWith('..')) return false;
  return (
    rel.startsWith('examples/benchmark-native/') ||
    rel.startsWith('examples/gc-shared/') ||
    rel.startsWith('packages/')
  );
}

/**
 * Package files reachable from the release entry the same way Metro resolves
 * them (android, dev false). This is the closure in the release bundle, not
 * the `react-native` exports field (lib/) and not unused dist siblings.
 */
function metroBundledPackageFiles() {
  const entry = path.join(ROOT, 'index.js');
  const queue = [entry];
  const seen = new Set();
  const packageFiles = [];
  while (queue.length) {
    const file = queue.pop();
    const real = realpathOrSelf(file);
    if (seen.has(real)) continue;
    seen.add(real);
    const rel = path.relative(REPO, real).split(path.sep).join('/');
    if (rel.startsWith('packages/')) packageFiles.push(real);
    if (!shouldFollowResolved(real)) continue;
    let code;
    try {
      code = fs.readFileSync(real, 'utf8');
    } catch {
      continue;
    }
    for (const dep of staticDependencies(code)) {
      let next;
      try {
        next = resolveMetroFile(real, dep.specifier, dep.isESMImport);
      } catch (err) {
        throw new Error(
          `Metro resolve failed for ${dep.specifier} from ${path.relative(REPO, real)}: ${err.message}`,
        );
      }
      queue.push(next);
    }
  }
  return packageFiles.sort((a, b) => a.localeCompare(b));
}

function dataClientPackageName(filePath) {
  const rel = path.relative(REPO, filePath).split(path.sep);
  if (rel[0] !== 'packages' || !rel[1]) return null;
  return rel[1];
}

function runPackageBuildBundle(packageDirName) {
  const pkgPath = path.join(REPO, 'packages', packageDirName, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts || !pkg.scripts['build:bundle']) {
    throw new Error(`${pkg.name} has no build:bundle script`);
  }
  console.log(
    `== build:bundle ${pkg.name} (file the release Metro bundle resolves) ==`,
  );
  execSync(`yarn workspace ${pkg.name} run build:bundle`, {
    cwd: REPO,
    stdio: 'inherit',
  });
}

/**
 * Rebuild dist outputs Metro will bundle, then return that file list.
 * Direct @data-client imports are built first so node.mjs → dist can resolve;
 * transitive packages (normalizr, required from core's dist) are built next.
 */
function ensureMetroBundlesBuilt() {
  const built = new Set();
  const build = name => {
    if (built.has(name)) return;
    built.add(name);
    runPackageBuildBundle(name);
  };
  for (let attempt = 0; attempt < 6; attempt++) {
    let files;
    try {
      files = metroBundledPackageFiles();
    } catch (err) {
      const missing = String(err.message).match(/packages\/([^/]+)\/dist/);
      if (missing && !built.has(missing[1])) {
        build(missing[1]);
        continue;
      }
      throw err;
    }
    const pending = [];
    for (const file of files) {
      const name = dataClientPackageName(file);
      const rel = path.relative(REPO, file).split(path.sep).join('/');
      if (name && rel.includes('/dist/') && !built.has(name)) {
        pending.push(name);
      }
    }
    if (!pending.length) return files;
    for (const name of pending) build(name);
  }
  throw new Error('could not build the package bundles Metro resolves');
}

function collectInputFiles() {
  const files = [];
  walkFiles(ROOT, files);
  for (const file of metroBundledPackageFiles()) files.push(file);
  walkFiles(path.join(REPO, 'examples/gc-shared'), files);
  return files.map(f => path.resolve(f)).sort((a, b) => a.localeCompare(b));
}

function sha256File(filePath) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

function hashInputFiles(files) {
  const h = crypto.createHash('sha256');
  const sorted = files
    .map(f => path.resolve(f))
    .sort((a, b) => a.localeCompare(b));
  for (const file of sorted) {
    const rel = path.relative(REPO, file).split(path.sep).join('/');
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(file));
    h.update('\0');
  }
  return h.digest('hex');
}

function sourceDigest() {
  return hashInputFiles(collectInputFiles());
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
  ensureMetroBundlesBuilt();
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

module.exports = {
  collectInputFiles,
  ensureMetroBundlesBuilt,
  hashInputFiles,
  metroBundledPackageFiles,
  resolveMetroFile,
  sourceDigest,
};

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

if (require.main === module) {
  main();
}
