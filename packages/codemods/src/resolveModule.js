'use strict';

// Finds the file an import loads, so a transform can read a module it imports
// (jscodeshift runs one file at a time)
const fs = require('node:fs');
const nodePath = require('node:path');

function findFile(base) {
  const stem = base.replace(/\.[cm]?jsx?$/, '');
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs'];
  const candidates = [
    base,
    ...exts.map(e => stem + e),
    ...exts.map(e => nodePath.join(base, 'index' + e)),
  ];
  return candidates.find(f =>
    fs.statSync(f, { throwIfNoEntry: false })?.isFile(),
  );
}

// tsconfig/jsconfig `paths` and `baseUrl` of the nearest config, so aliased
// imports like `@/lib/api-client` resolve too
const pathsCache = new Map();
function readConfig(file, fromDir, seen = new Set()) {
  // a referenced project may extend the solution config that references it; `seen` holds the configs
  // that led here
  if (seen.has(file)) return {};
  seen.add(file);
  const text = fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\/|("(?:\\.|[^"\\])*")|\/\/[^\n]*/g, (m, str) =>
      str ? m : '',
    )
    .replace(/,(\s*[}\]])/g, '$1');
  const config = JSON.parse(text);
  const options = config.compilerOptions || {};
  const dir = nodePath.dirname(file);
  const own = {
    baseUrl: options.baseUrl && nodePath.resolve(dir, options.baseUrl),
    paths: options.paths,
    pathsDir: dir,
    // the folders `include` names, up to its first wildcard
    includes:
      Array.isArray(config.include) ?
        config.include.map(p => nodePath.resolve(dir, p.split('*')[0]))
      : undefined,
  };
  const inherited =
    typeof config.extends === 'string' && config.extends.startsWith('.') ?
      tryConfig(nodePath.resolve(dir, config.extends), fromDir, seen)
    : undefined;
  const merged =
    inherited ?
      {
        baseUrl: own.baseUrl || inherited.baseUrl,
        paths: own.paths || inherited.paths,
        pathsDir: own.paths ? dir : inherited.pathsDir,
        includes: own.includes || inherited.includes,
      }
    : own;
  if (merged.paths || merged.baseUrl || !Array.isArray(config.references))
    return merged;
  // a solution-style config (create-vite: `"files": []` plus `references`) keeps its aliases in a
  // referenced config such as tsconfig.app.json
  const aliased = config.references
    .filter(ref => typeof ref?.path === 'string')
    .map(ref => tryConfig(nodePath.resolve(dir, ref.path), fromDir, seen))
    .filter(found => found?.paths || found?.baseUrl);
  if (aliased.length === 1) return aliased[0];
  // with several, only the one whose `include` holds the importing folder; unknown otherwise
  const owners = aliased.filter(found =>
    found.includes?.some(
      folder => fromDir === folder || fromDir.startsWith(folder + nodePath.sep),
    ),
  );
  return owners.length === 1 ? owners[0] : merged;
}

// `extends` and `references` may name a folder or leave off `.json`
function tryConfig(target, fromDir, seen) {
  const file =
    target.endsWith('.json') ? target
    : fs.statSync(target, { throwIfNoEntry: false })?.isDirectory() ?
      nodePath.join(target, 'tsconfig.json')
    : target + '.json';
  try {
    return readConfig(file, fromDir, new Set(seen));
  } catch {
    return undefined;
  }
}

function aliasConfig(fromFile) {
  const fromDir = nodePath.dirname(nodePath.resolve(fromFile));
  if (pathsCache.has(fromDir)) return pathsCache.get(fromDir);
  // the nearest config; which project a solution config picks depends on the importing folder, so the
  // answer is kept for that folder only
  let config = {};
  search: for (let dir = fromDir; ; dir = nodePath.dirname(dir)) {
    for (const name of ['tsconfig.json', 'jsconfig.json']) {
      const file = nodePath.join(dir, name);
      if (!fs.existsSync(file)) continue;
      try {
        config = readConfig(file, fromDir);
      } catch {
        config = {};
      }
      break search;
    }
    if (nodePath.dirname(dir) === dir) break;
  }
  pathsCache.set(fromDir, config);
  return config;
}

// a relative import is keyed by the path it names, and any other by its folder, whose imports resolve the
// same way, so files share lookups
const resolveCache = new Map();
function resolveModule(fromFile, spec) {
  const dir = nodePath.dirname(nodePath.resolve(fromFile));
  const key =
    spec.startsWith('.') ? nodePath.resolve(dir, spec) : dir + '\0' + spec;
  if (!resolveCache.has(key)) resolveCache.set(key, findModule(fromFile, spec));
  return resolveCache.get(key);
}

function findModule(fromFile, spec) {
  if (spec.startsWith('.'))
    return findFile(nodePath.resolve(nodePath.dirname(fromFile), spec));
  const { baseUrl, paths, pathsDir } = aliasConfig(fromFile);
  const root = baseUrl || pathsDir;
  // like TypeScript: an exact pattern, else the wildcard with the longest prefix, and only that one
  let best;
  for (const [pattern, targets] of Object.entries(paths || {})) {
    const star = pattern.indexOf('*');
    if (star === -1) {
      if (spec === pattern) {
        best = { targets, rest: '' };
        break;
      }
      continue;
    }
    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);
    if (
      spec.length >= prefix.length + suffix.length &&
      spec.startsWith(prefix) &&
      spec.endsWith(suffix) &&
      !(best?.prefix.length >= prefix.length)
    )
      best = {
        targets,
        prefix,
        rest: spec.slice(prefix.length, spec.length - suffix.length),
      };
  }
  if (best) {
    for (const target of best.targets) {
      const file = findFile(
        nodePath.resolve(root, target.split('*').join(best.rest)),
      );
      if (file) return file;
    }
  }
  // a bare import is a package unless baseUrl has a file by that name
  return baseUrl ? findFile(nodePath.resolve(baseUrl, spec)) : undefined;
}

module.exports = resolveModule;
