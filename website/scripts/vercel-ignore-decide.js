#!/usr/bin/env node
/**
 * Helpers for website/scripts/vercel-ignore.sh.
 *
 *   node vercel-ignore-decide.js classify
 *     Reads OLD_PKG and NEW_PKG. Exits 0 when the package.json edit is only
 *     non-major dependency bumps. Exits 1 for a major bump or anything else
 *     (added/removed dependencies, scripts, unparsable ranges).
 *
 *   node vercel-ignore-decide.js prepare-failure
 *     Exits 0 when `yarn prepare` (`tsc --build`) is expected to exit 2.
 *     react-native 0.87 dropped InteractionManager from its public types
 *     (still exported in 0.86.2). packages/react still imports it, so tsc
 *     reports TS2305 and the Vercel install command
 *     `cd .. && yarn install && yarn prepare && yarn ci:build && ...`
 *     dies with status 2 after yarn install has already succeeded.
 *     Exits 1 when that failure is not expected.
 *
 *   node vercel-ignore-decide.js self-test
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'resolutions',
  'overrides',
];

// First release whose public types omit InteractionManager.
const INTERACTION_MANAGER_REMOVED = [0, 87, 0];

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .map(key => [key, stable(value[key])]);
  }
  return value;
}

function rest(pkg) {
  const copy = { ...pkg };
  for (const field of DEP_FIELDS) delete copy[field];
  return copy;
}

function flatten(value, prefix, out) {
  if (typeof value === 'string') {
    out[prefix] = value;
    return;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}\0${key}` : key, out);
    }
    return;
  }
  if (prefix) out[prefix] = value;
}

function flattenFields(pkg) {
  const out = {};
  for (const field of DEP_FIELDS) {
    if (pkg[field] && typeof pkg[field] === 'object') flatten(pkg[field], field, out);
  }
  return out;
}

// Version majors mentioned by a specifier, ignoring range punctuation.
// `npm:pkg@version` uses the aliased version. workspace/file/git specs are
// literals. Returns null when the specifier is not a version we can compare.
function classifySpec(spec) {
  if (typeof spec !== 'string') return null;
  let body = spec.trim();
  const alias = body.match(/^npm:(?:@[^\s@/]+\/[^\s@]+|[^\s@/]+)@(.+)$/);
  if (alias) body = alias[1].trim();
  if (/^(workspace:|catalog:|file:|link:|portal:|github:|git\+|git:|https?:)/.test(body)) {
    return { kind: 'literal', value: spec.trim() };
  }
  const majors = [];
  // Build metadata (`+2020`) stays part of the same version so it is not a
  // second major.
  const re = /(?:^|[^\d.])v?(\d+)(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;
  let match;
  while ((match = re.exec(body))) majors.push(Number(match[1]));
  if (majors.length === 0) return null;
  return { kind: 'semver', majors };
}

// 'nonmajor' | 'major' | 'other'
function compareSpecs(before, after) {
  if (before === after) return 'nonmajor';
  const left = classifySpec(before);
  const right = classifySpec(after);
  if (!left || !right || left.kind !== right.kind) return 'other';
  if (left.kind === 'literal') return left.value === right.value ? 'nonmajor' : 'other';
  if (left.majors.length !== right.majors.length) return 'major';
  for (let i = 0; i < left.majors.length; i++) {
    if (left.majors[i] !== right.majors[i]) return 'major';
  }
  return 'nonmajor';
}

function classify(oldText, newText) {
  let oldPkg;
  let newPkg;
  try {
    oldPkg = JSON.parse(oldText);
    newPkg = JSON.parse(newText);
  } catch {
    return 'other';
  }
  if (!oldPkg || !newPkg || typeof oldPkg !== 'object' || typeof newPkg !== 'object') {
    return 'other';
  }
  if (Array.isArray(oldPkg) || Array.isArray(newPkg)) return 'other';
  if (JSON.stringify(stable(rest(oldPkg))) !== JSON.stringify(stable(rest(newPkg)))) {
    return 'other';
  }
  const before = flattenFields(oldPkg);
  const after = flattenFields(newPkg);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  let other = false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(before, key)) return 'other';
    if (!Object.prototype.hasOwnProperty.call(after, key)) return 'other';
    if (typeof before[key] !== 'string' || typeof after[key] !== 'string') return 'other';
    const change = compareSpecs(before[key], after[key]);
    if (change === 'major') return 'major';
    if (change === 'other') other = true;
  }
  return other ? 'other' : 'nonmajor';
}

function versionAtLeast(spec, target) {
  const match = String(spec).match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return false;
  const ver = [Number(match[1]), Number(match[2]), match[3] === undefined ? 0 : Number(match[3])];
  for (let i = 0; i < 3; i++) {
    if (ver[i] !== target[i]) return ver[i] > target[i];
  }
  return true;
}

function declaredReactNative(pkg) {
  const resolutions = pkg.resolutions || {};
  const overrides = pkg.overrides || {};
  const pinned = resolutions['react-native'] || resolutions['**/react-native'] || overrides['react-native'];
  if (typeof pinned === 'string') return pinned;
  const deps = pkg.dependencies || {};
  const dev = pkg.devDependencies || {};
  if (typeof deps['react-native'] === 'string') return deps['react-native'];
  if (typeof dev['react-native'] === 'string') return dev['react-native'];
  return '';
}

function importsInteractionManager(src) {
  const re = /(?:import|export)\s+(?:type\s+)?([\s\S]{0,500}?)\s+from\s+['"]react-native['"]/g;
  let match;
  while ((match = re.exec(src))) {
    if (/\bInteractionManager\b/.test(match[1])) return true;
  }
  return false;
}

function compiledSourceImportsInteractionManager(root) {
  const packages = path.join(root, 'packages');
  const stack = [packages];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'lib' ||
        entry.name === 'dist' ||
        entry.name === 'legacy' ||
        entry.name === '__tests__'
      ) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/\.(?:[cm]?ts|tsx)$/.test(entry.name) || /\.(?:test|spec)\.[^.]+$/.test(entry.name)) {
        continue;
      }
      let src;
      try {
        src = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      if (src.includes('InteractionManager') && importsInteractionManager(src)) return true;
    }
  }
  return false;
}

function prepareWillFail(root) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  } catch {
    return false;
  }
  if (!pkg || typeof pkg !== 'object') return false;
  if (!versionAtLeast(declaredReactNative(pkg), INTERACTION_MANAGER_REMOVED)) return false;
  return compiledSourceImportsInteractionManager(root);
}

function selfTest() {
  const os = require('os');
  const assert = (cond, msg) => {
    if (!cond) {
      console.error(`self-test failed: ${msg}`);
      process.exit(1);
    }
  };
  const withDeps = (deps, extra = {}) => JSON.stringify({ ...extra, ...deps });

  assert(classify(withDeps({ dependencies: { a: '^1.2.3' } }), withDeps({ dependencies: { a: '^1.4.0' } })) === 'nonmajor', 'minor');
  assert(classify(withDeps({ dependencies: { a: '1.2.3' } }), withDeps({ dependencies: { a: '1.2.4' } })) === 'nonmajor', 'patch');
  assert(classify(withDeps({ dependencies: { a: '^1.2.3' } }), withDeps({ dependencies: { a: '^2.0.0' } })) === 'major', 'major');
  assert(classify(withDeps({ dependencies: { m: '^0.56.0' } }), withDeps({ dependencies: { m: '^0.57.0' } })) === 'nonmajor', '0.x minor');
  assert(classify(withDeps({ dependencies: { m: '^0.56.0' } }), withDeps({ dependencies: { m: '^1.0.0' } })) === 'major', '0.x to 1');
  assert(classify(withDeps({ devDependencies: { '@types/react': '19.2.17' } }), withDeps({ devDependencies: { '@types/react': '19.3.0' } })) === 'nonmajor', 'types minor');
  assert(classify(withDeps({ devDependencies: { '@types/react': '19.2.17' } }), withDeps({ devDependencies: { '@types/react': '20.0.0' } })) === 'major', 'types major');
  assert(classify(withDeps({ dependencies: { t: 'npm:typescript@7.0.2' } }), withDeps({ dependencies: { t: 'npm:typescript@7.0.3' } })) === 'nonmajor', 'alias patch');
  assert(classify(withDeps({ dependencies: { t: 'npm:@typescript/typescript6@6.0.2' } }), withDeps({ dependencies: { t: 'npm:@typescript/typescript6@7.0.0' } })) === 'major', 'scoped alias major');
  assert(classify(withDeps({ dependencies: { a: '^4.8.0-rc.0' } }), withDeps({ dependencies: { a: '^4.9.0' } })) === 'nonmajor', 'prerelease minor');
  assert(classify(withDeps({ dependencies: { a: '^4.8.0-rc.0' } }), withDeps({ dependencies: { a: '^5.0.0-rc.1' } })) === 'major', 'prerelease major');
  assert(classify(withDeps({ dependencies: { a: '1.2.3+2020' } }), withDeps({ dependencies: { a: '1.2.4+2021' } })) === 'nonmajor', 'build metadata');
  assert(classify(withDeps({ dependencies: { w: 'workspace:*', a: '1.2.3' } }), withDeps({ dependencies: { w: 'workspace:*', a: '1.2.4' } })) === 'nonmajor', 'workspace untouched');
  assert(classify(withDeps({ dependencies: { a: '1.0.0' } }), withDeps({ dependencies: { a: '1.0.0', b: '1.0.0' } })) === 'other', 'added dep');
  assert(classify(withDeps({ dependencies: { a: '1.0.0', b: '1.0.0' } }), withDeps({ dependencies: { a: '1.0.0' } })) === 'other', 'removed dep');
  assert(
    classify(withDeps({ dependencies: { a: '1.0.0' } }, { scripts: { build: 'a' } }), withDeps({ dependencies: { a: '1.0.1' } }, { scripts: { build: 'b' } })) === 'other',
    'script change',
  );
  assert(classify(withDeps({ resolutions: { foo: '7.1.2' } }), withDeps({ resolutions: { foo: '8.0.0' } })) === 'major', 'resolution major');
  assert(classify(withDeps({ overrides: { foo: { bar: '1.2.3' } } }), withDeps({ overrides: { foo: { bar: '1.2.4' } } })) === 'nonmajor', 'nested override patch');
  assert(classify(withDeps({ overrides: { foo: { bar: '1.2.3' } } }), withDeps({ overrides: { foo: { bar: '2.0.0' } } })) === 'major', 'nested override major');
  assert(classify('{', '{') === 'other', 'invalid json');

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vercel-ignore-'));
  const hook = path.join(root, 'packages/react/src/hooks');
  fs.mkdirSync(hook, { recursive: true });
  const source = path.join(hook, 'useFetch.native.ts');
  const writePkg = version => {
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ devDependencies: { 'react-native': version } }));
  };
  const importing = "import { InteractionManager } from 'react-native';\n";
  try {
    writePkg('0.86.2');
    fs.writeFileSync(source, importing);
    assert(prepareWillFail(root) === false, '0.86 still exports InteractionManager');
    writePkg('0.87.0');
    assert(prepareWillFail(root) === true, '0.87.0 removed the export');
    writePkg('0.87.1');
    assert(prepareWillFail(root) === true, '0.87.1 removed the export');
    fs.writeFileSync(source, "import {\n  InteractionManager,\n} from 'react-native';\n");
    assert(prepareWillFail(root) === true, 'multiline import');
    fs.writeFileSync(source, "export const x = 1;\n");
    assert(prepareWillFail(root) === false, 'import removed');
    fs.mkdirSync(path.join(root, 'packages/react/src/__tests__'), { recursive: true });
    fs.writeFileSync(path.join(root, 'packages/react/src/__tests__/useFetch.native.tsx'), importing);
    assert(prepareWillFail(root) === false, 'test import is not compiled by tsc --build');
    writePkg('^0.86.2');
    fs.writeFileSync(source, importing);
    assert(prepareWillFail(root) === false, 'range whose minimum still has the export');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  const cmd = process.argv[2];
  if (cmd === 'self-test') {
    selfTest();
    return;
  }
  if (cmd === 'classify') {
    const result = classify(process.env.OLD_PKG || '', process.env.NEW_PKG || '');
    process.exit(result === 'nonmajor' ? 0 : 1);
  }
  if (cmd === 'prepare-failure') {
    process.exit(prepareWillFail(process.cwd()) ? 0 : 1);
  }
  console.error(`usage: vercel-ignore-decide.js <classify|prepare-failure|self-test>`);
  process.exit(1);
}

main();
