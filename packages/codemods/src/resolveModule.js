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
function readConfig(file, seen = new Set()) {
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
  };
  const inherited =
    typeof config.extends === 'string' && config.extends.startsWith('.') ?
      tryConfig(nodePath.resolve(dir, config.extends), seen)
    : undefined;
  const merged =
    inherited ?
      {
        baseUrl: own.baseUrl || inherited.baseUrl,
        paths: own.paths || inherited.paths,
        pathsDir: own.paths ? dir : inherited.pathsDir,
      }
    : own;
  if (merged.paths || merged.baseUrl || !Array.isArray(config.references))
    return merged;
  // a solution-style config (create-vite: `"files": []` plus `references`) keeps its aliases in a
  // referenced config such as tsconfig.app.json
  for (const ref of config.references) {
    if (typeof ref?.path !== 'string') continue;
    const found = tryConfig(nodePath.resolve(dir, ref.path), seen);
    if (found?.paths || found?.baseUrl) return found;
  }
  return merged;
}

// `extends` and `references` may name a folder or leave off `.json`
function tryConfig(target, seen) {
  const file =
    target.endsWith('.json') ? target
    : fs.statSync(target, { throwIfNoEntry: false })?.isDirectory() ?
      nodePath.join(target, 'tsconfig.json')
    : target + '.json';
  try {
    return readConfig(file, new Set(seen));
  } catch {
    return undefined;
  }
}

function aliasConfig(fromFile) {
  const dir = nodePath.dirname(nodePath.resolve(fromFile));
  if (pathsCache.has(dir)) return pathsCache.get(dir);
  let config = null;
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const file = nodePath.join(dir, name);
    if (!fs.existsSync(file)) continue;
    try {
      config = readConfig(file);
    } catch {
      config = {};
    }
    break;
  }
  const parent = nodePath.dirname(dir);
  // a file in the parent folder, so the lookup continues from there
  if (!config && parent !== dir)
    config = aliasConfig(nodePath.join(parent, 'index.js'));
  pathsCache.set(dir, config || {});
  return config || {};
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
