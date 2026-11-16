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
// parsed config files, shared by every folder that reads them
const jsonCache = new Map();
function readJson(file) {
  if (!jsonCache.has(file))
    jsonCache.set(
      file,
      JSON.parse(
        fs
          .readFileSync(file, 'utf8')
          .replace(
            /\/\*[\s\S]*?\*\/|("(?:\\.|[^"\\])*")|\/\/[^\n]*/g,
            (m, str) => (str ? m : ''),
          )
          .replace(/,(\s*[}\]])/g, '$1'),
      ),
    );
  return jsonCache.get(file);
}

function readConfig(file, fromFile, seen = new Set()) {
  // a referenced project may extend the solution config that references it; `chain` holds the configs
  // that led here
  if (seen.has(file)) return {};
  const chain = new Set(seen).add(file);
  const config = readJson(file);
  const options = config.compilerOptions || {};
  const dir = nodePath.dirname(file);
  const inherited =
    (typeof config.extends === 'string' &&
      config.extends.startsWith('.') &&
      tryConfig(nodePath.resolve(dir, config.extends), fromFile, chain)) ||
    {};
  const merged = {
    baseUrl:
      (options.baseUrl && nodePath.resolve(dir, options.baseUrl)) ||
      inherited.baseUrl,
    paths: options.paths || inherited.paths,
    pathsDir: options.paths ? dir : inherited.pathsDir,
    // the files and folders `include` names, up to its first wildcard
    includes:
      Array.isArray(config.include) ?
        config.include.map(p => nodePath.resolve(dir, p.split('*')[0]))
      : inherited.includes,
  };
  if (merged.paths || merged.baseUrl || !Array.isArray(config.references))
    return merged;
  // a solution-style config (create-vite: `"files": []` plus `references`) keeps its aliases in a
  // referenced config such as tsconfig.app.json
  const aliased = config.references
    .filter(ref => typeof ref?.path === 'string')
    .map(ref => tryConfig(nodePath.resolve(dir, ref.path), fromFile, chain))
    .filter(found => found?.paths || found?.baseUrl);
  if (aliased.length === 1) return aliased[0];
  // with several, only the one whose `include` holds the importing file; unknown otherwise
  const owners = aliased.filter(found =>
    found.includes?.some(
      entry => fromFile === entry || fromFile.startsWith(entry + nodePath.sep),
    ),
  );
  return owners.length === 1 ? owners[0] : merged;
}

// `extends` and `references` may name a folder or leave off `.json`
function tryConfig(target, fromFile, seen) {
  const file =
    target.endsWith('.json') ? target
    : fs.statSync(target, { throwIfNoEntry: false })?.isDirectory() ?
      nodePath.join(target, 'tsconfig.json')
    : target + '.json';
  try {
    return readConfig(file, fromFile, seen);
  } catch {
    return undefined;
  }
}

function aliasConfig(importer) {
  const fromFile = nodePath.resolve(importer);
  if (pathsCache.has(fromFile)) return pathsCache.get(fromFile);
  // the nearest config; which project a solution config picks depends on the importing file (its
  // `include` can name the file itself), so the answer is kept for that file only
  let config = {};
  for (let dir = nodePath.dirname(fromFile); ; dir = nodePath.dirname(dir)) {
    const file = ['tsconfig.json', 'jsconfig.json']
      .map(name => nodePath.join(dir, name))
      .find(f => fs.existsSync(f));
    if (file) {
      try {
        config = readConfig(file, fromFile);
      } catch {
        // an unreadable config resolves no aliases
      }
      break;
    }
    if (nodePath.dirname(dir) === dir) break;
  }
  pathsCache.set(fromFile, config);
  return config;
}

// a relative import is keyed by the path it names, so files share lookups, and any other by its importing
// file, whose tsconfig project can differ from its neighbours' (create-vite's vite.config.ts)
const resolveCache = new Map();
function resolveModule(fromFile, spec) {
  const file = nodePath.resolve(fromFile);
  const key =
    spec.startsWith('.') ?
      nodePath.resolve(nodePath.dirname(file), spec)
    : file + '\0' + spec;
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
