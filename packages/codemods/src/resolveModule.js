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
  return candidates.find(f => {
    try {
      return fs.statSync(f).isFile();
    } catch {
      return false;
    }
  });
}

// tsconfig/jsconfig `paths` and `baseUrl` of the nearest config, so aliased
// imports like `@/lib/api-client` resolve too
const pathsCache = new Map();
function readConfig(file) {
  const text = fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\/|("(?:\\.|[^"\\])*")|\/\/[^\n]*/g, (m, str) =>
      str ? m : '',
    )
    .replace(/,(\s*[}\]])/g, '$1');
  const config = JSON.parse(text);
  const options = config.compilerOptions || {};
  const dir = nodePath.dirname(file);
  if (typeof config.extends === 'string' && config.extends.startsWith('.')) {
    let parent = nodePath.resolve(dir, config.extends);
    if (!parent.endsWith('.json')) parent += '.json';
    try {
      const inherited = readConfig(parent);
      return {
        baseUrl:
          options.baseUrl ?
            nodePath.resolve(dir, options.baseUrl)
          : inherited.baseUrl,
        paths: options.paths || inherited.paths,
        pathsDir: options.paths ? dir : inherited.pathsDir,
      };
    } catch {
      // fall through to this config alone
    }
  }
  return {
    baseUrl: options.baseUrl && nodePath.resolve(dir, options.baseUrl),
    paths: options.paths,
    pathsDir: dir,
  };
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

// each folder's imports resolve the same way, so files there share lookups
const resolveCache = new Map();
function resolveModule(fromFile, spec) {
  const key = nodePath.dirname(nodePath.resolve(fromFile)) + '\0' + spec;
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
