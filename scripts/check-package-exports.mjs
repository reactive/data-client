#!/usr/bin/env node
// Checks every published package's entry points the way consumers load them.
// Packs each package with `yarn pack` (which runs its `prepack` build), then:
//   1. publint: package.json fields point at published files of the right format
//   2. arethetypeswrong: each entry point's types resolve in every TS resolution mode
//   3. Node: `import()` and `require()` of each entry point give the same exports
//      as its ESM build (what bundlers load)
//   4. shared: each subpath shares code with `.` instead of loading a second copy
//      (a Controller, a React context), so the instances work together
// Run after `yarn build:types` (packing builds only the JavaScript).
//
// Usage: yarn check:package-exports
import {
  checkPackage,
  createPackageFromTarballData,
} from '@arethetypeswrong/core';
import {
  problemAffectsEntrypoint,
  problemKindInfo,
} from '@arethetypeswrong/core/problems';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Inside node_modules so the unpacked packages resolve their dependencies
// (react, vue...) from the root install
const work = path.join(root, 'node_modules/.cache/check-package-exports');
const packs = path.join(work, 'packs');

// publint suggestions that are about entry points
const ENTRY_POINT_SUGGESTIONS = new Set([
  'HAS_MODULE_BUT_NO_EXPORTS',
  'HAS_ESM_MAIN_BUT_NO_EXPORTS',
]);
// Node adds these to CommonJS modules, and on Node 23+ `export *` from one
// passes `module.exports` on, so they say nothing about the entry point
const INTEROP = new Set(['__esModule', 'module.exports']);
// Subpath exports that share a name with a different export of `.` on purpose
const DIFFERENT_ON_PURPOSE = {
  // the Redux-backed provider
  '@data-client/react/redux': ['DataProvider'],
  // the provider that streams server data to the client
  '@data-client/react/nextjs': ['DataProvider'],
};

// Lists the files a fresh Node process loads for `import`s or `require`s of
// the specifiers (see mixedBuilds)
const LOADER_SOURCE = `import { createRequire, registerHooks } from 'node:module';
const loaded = new Set();
registerHooks({
  resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context);
    loaded.add(result.url);
    return result;
  },
});
// slice(1): it runs with node -e, so argv has no script path
const [call, ...specifiers] = process.argv.slice(1);
const require = createRequire(import.meta.url);
for (const specifier of specifiers) {
  if (call === 'import') await import(specifier);
  else require(specifier);
}
console.log(JSON.stringify([...loaded]));
`;

const packages = publishedPackages();
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(packs, { recursive: true });
packAll();
// Unpack them all first, so they load each other rather than the workspaces
const unpacked = packages.map(unpack);
const consumer = await consumerLoaders();

let failed = false;
for (const { pkg, dir, tarball } of unpacked) {
  console.log(`\n${pkg.name}`);
  // Runs every check before combining, so each failure is reported
  const passed = [
    report('publint', await lint(pkg, dir)),
    report('types', await checkTypes(pkg, tarball)),
    report('node', await checkNode(pkg, dir, consumer)),
    report('shared', await checkShared(pkg, dir, consumer)),
  ].every(Boolean);
  if (!passed) failed = true;
}
if (failed) {
  console.error('\nPackage entry point check failed.');
  process.exit(1);
}
console.log('\nAll package entry points passed.');

// The workspaces release publishes (`--no-private`, as in `changeset:publish`)
function publishedPackages() {
  return execFileSync(
    'yarn',
    ['workspaces', 'list', '--no-private', '--json'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  )
    .trim()
    .split('\n')
    .map(line => JSON.parse(line).location)
    .map(location =>
      JSON.parse(
        fs.readFileSync(path.join(root, location, 'package.json'), 'utf8'),
      ),
    );
}

function packAll() {
  try {
    execFileSync(
      'yarn',
      [
        'workspaces',
        'foreach',
        '--all',
        '--no-private',
        '--parallel',
        // bundles inline some dependencies' lib/, which their prepack builds
        '--topological',
        'pack',
        '--out',
        path.join(packs, '%s.tgz'),
      ],
      { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    // yarn reports a failed prepack on stdout; with no output, yarn never ran
    if (error.stdout === undefined) console.error(error.message);
    else console.error(error.stdout, '\n', error.stderr);
    console.error('yarn pack failed');
    process.exit(1);
  }
}

function unpack(pkg) {
  // yarn's `%s` in `--out`: @scope/name -> @scope-name
  const tarball = path.join(packs, `${pkg.name.replace('/', '-')}.tgz`);
  const dir = path.join(work, 'node_modules', pkg.name);
  fs.mkdirSync(dir, { recursive: true });
  execFileSync('tar', ['-xzf', tarball, '-C', dir, '--strip-components=1']);
  return { pkg, dir, tarball: fs.readFileSync(tarball) };
}

// import() and require() that resolve specifiers the way a consumer of the
// unpacked packages would
async function consumerLoaders() {
  const probe = path.join(work, 'probe.mjs');
  fs.writeFileSync(probe, 'export default specifier => import(specifier);\n');
  return {
    import: (await import(pathToFileURL(probe))).default,
    require: createRequire(probe),
  };
}

// Prints the check's result; returns whether it passed
function report(check, { errors, allowed = [] }) {
  const note =
    allowed.length ? ` (allowed: ${[...new Set(allowed)].join(', ')})` : '';
  if (!errors.length) {
    console.log(`  ✓ ${check}${note}`);
    return true;
  }
  console.error(`  ✗ ${check}${note}`);
  for (const error of errors) console.error(`    ${error}`);
  return false;
}

async function lint(pkg, dir) {
  // `dir` holds exactly the published files
  const { messages } = await publint({ pkgDir: dir, pack: false });
  const errors = [];
  const allowed = [];
  for (const message of messages) {
    if (isAllowedLintMessage(pkg, message)) {
      allowed.push(message.code);
    } else {
      errors.push(
        `${message.code}: ${formatMessage(message, pkg, { color: false })}`,
      );
    }
  }
  return { errors, allowed };
}

async function checkTypes(pkg, tarball) {
  const analysis = await checkPackage(createPackageFromTarballData(tarball));
  const errors = [];
  const allowed = [];
  for (const problem of analysis.problems ?? []) {
    const entrypoints = Object.keys(analysis.entrypoints).filter(entrypoint =>
      problemAffectsEntrypoint(problem, entrypoint, analysis),
    );
    if (isAllowedTypesProblem(pkg, problem, entrypoints)) {
      allowed.push(problem.kind);
      continue;
    }
    errors.push(
      `${problem.kind} (${entrypoints.join(', ')}): ${problemKindInfo[problem.kind].description}`,
    );
  }
  return { errors, allowed };
}

function isAllowedLintMessage(pkg, { type, code, args, path: msgPath }) {
  // Suggestions about entry points fail; other suggestions are only listed
  if (type === 'suggestion') return !ENTRY_POINT_SUGGESTIONS.has(code);
  // The CommonJS-types gap (see isAllowedTypesProblem), as publint reports it:
  // the `require` condition's types, on a subpath with a top-level `require`.
  // publint paths look like ['exports', '.', 'types']
  const [field, subpath] = msgPath;
  return (
    code === 'EXPORTS_TYPES_INVALID_FORMAT' &&
    args.condition === 'require' &&
    field === 'exports' &&
    hasTopLevelRequire(pkg, subpath)
  );
}

function hasTopLevelRequire(pkg, subpath) {
  return Object.hasOwn(pkg.exports?.[subpath] ?? {}, 'require');
}

function isAllowedTypesProblem(pkg, problem, entrypoints) {
  switch (problem.kind) {
    // The CommonJS-types gap: every package with an exports map gives its
    // top-level `require` condition (CommonJS dist/) ESM-format types
    // (lib/*.d.ts under "type": "module"). Only CommonJS files compiled with
    // TypeScript < 5.8 or `module: node16` see this, and fixing it means
    // publishing a CommonJS copy of every declaration file.
    case 'FalseESM':
      return (
        entrypoints.length > 0 &&
        entrypoints.every(entrypoint => hasTopLevelRequire(pkg, entrypoint))
      );
    // Exports subpaths with no `require` condition at any level ship only ESM
    // on purpose
    case 'CJSResolvesToESM':
      return (
        pkg.exports?.[problem.entrypoint] !== undefined &&
        !JSON.stringify(pkg.exports[problem.entrypoint]).includes('"require":')
      );
    default:
      return false;
  }
}

// Each entry point with the ESM file bundlers load for it: the `default`
// target of each exports subpath. A package with `module` but no exports map
// already fails publint's HAS_MODULE_BUT_NO_EXPORTS.
function entryPoints(pkg) {
  return Object.entries(pkg.exports ?? {})
    .filter(
      ([subpath]) => subpath !== './package.json' && !subpath.includes('*'),
    )
    .map(([subpath, conditions]) => [
      subpath,
      typeof conditions === 'string' ? conditions : conditions.default,
    ]);
}

async function checkNode(pkg, dir, consumer) {
  const errors = [];
  for (const [subpath, esmFile] of entryPoints(pkg)) {
    const specifier = pkg.name + subpath.slice(1);
    const expected = await import(pathToFileURL(path.join(dir, esmFile)));
    for (const [call, load] of Object.entries(consumer)) {
      try {
        const diff = compareExports(expected, await load(specifier));
        if (diff) errors.push(`${call}('${specifier}') ${diff}`);
      } catch (error) {
        errors.push(loadError(call, specifier, error));
      }
    }
  }
  return { errors };
}

function loadError(call, specifier, error) {
  return `${call}('${specifier}') threw ${error.message.split('\n')[0]}`;
}

function compareExports(expected, actual) {
  const problems = [];
  for (const name of new Set([
    ...Object.keys(expected),
    ...Object.keys(actual),
  ])) {
    if (INTEROP.has(name)) continue;
    if (!(name in expected)) {
      // CommonJS gets a `default`; it counts only when the ESM build has one
      if (name !== 'default') problems.push(`has extra export ${name}`);
    } else if (!(name in actual)) {
      problems.push(`is missing export ${name}`);
    } else if (typeof actual[name] !== typeof expected[name]) {
      problems.push(
        `export ${name} is ${typeof actual[name]}, not ${typeof expected[name]}`,
      );
    }
  }
  return problems.join('; ');
}

// A subpath that loads a second copy of code `.` also loads breaks at runtime:
// MockController isn't the app's Controller, a provider fills a context the
// hooks never read. Skips ESM-only subpaths (no `require` condition), which
// are for bundlers: Node `import` loads them from lib/ while `.` loads dist/,
// so one that shares state with `.` needs a `require` target and shim too.
async function checkShared(pkg, dir, consumer) {
  const subpaths = entryPoints(pkg)
    .map(([subpath]) => subpath)
    .filter(subpath => subpath !== '.' && hasTopLevelRequire(pkg, subpath));
  const errors = duplicateSingletons(dir);
  for (const subpath of subpaths) {
    const specifier = pkg.name + subpath.slice(1);
    for (const [call, load] of Object.entries(consumer)) {
      try {
        for (const [name, builds] of mixedBuilds(call, [pkg.name, specifier])) {
          errors.push(
            `${call}('${pkg.name}') and ${call}('${specifier}') load ${name} from both ${builds.join(' and ')}`,
          );
        }
        for (const name of await differentExports(load, pkg.name, specifier)) {
          errors.push(
            `${call}('${specifier}') export ${name} is a different object from ${call}('${pkg.name}')'s`,
          );
        }
      } catch (error) {
        errors.push(loadError(call, specifier, error));
      }
    }
  }
  return { errors };
}

// Names the subpath exports that are a different object from `.`'s export
// of the same name
async function differentExports(load, rootSpecifier, specifier) {
  const root = await load(rootSpecifier);
  const sub = await load(specifier);
  return Object.keys(sub).filter(
    name =>
      name in root &&
      !INTEROP.has(name) &&
      name !== 'default' &&
      !DIFFERENT_ON_PURPOSE[specifier]?.includes(name) &&
      sub[name] !== root[name],
  );
}

// Loads the specifiers in a fresh Node process, and returns each unpacked
// package that loaded files from more than one build folder (lib/, dist/...)
function mixedBuilds(call, specifiers) {
  const urls = JSON.parse(
    execFileSync(
      process.execPath,
      ['--input-type=module', '-e', LOADER_SOURCE, call, ...specifiers],
      // resolve the specifiers from the unpacked node_modules
      { cwd: work, encoding: 'utf8' },
    ),
  );
  const builds = new Map();
  for (const url of urls) {
    if (!url.startsWith('file:')) continue;
    const file = path.relative(
      path.join(work, 'node_modules'),
      fileURLToPath(url),
    );
    // @scope/name/<build>/...; files at a package's root are shims
    const [scope, name, build, ...rest] = file.split(path.sep);
    if (scope.startsWith('.') || !rest.length) continue;
    const pkgName = `${scope}/${name}`;
    if (!builds.has(pkgName)) builds.set(pkgName, new Set());
    builds.get(pkgName).add(`${build}/`);
  }
  return [...builds]
    .filter(([, set]) => set.size > 1)
    .map(([name, set]) => [name, [...set]]);
}

// A class or React context bundled into two CommonJS files of one build:
// separate rollup builds per entry point each bundle their own copy of shared
// modules. A duplicated function shows up only when `.` exports it too
// (differentExports). React Native's dist/*.native.js are a separate build.
function duplicateSingletons(dir) {
  const declared = new Map();
  const distDir = path.join(dir, 'dist');
  if (!fs.existsSync(distDir)) return [];
  for (const file of fs.readdirSync(distDir, { recursive: true })) {
    if (!file.endsWith('.js') || file.endsWith('.umd.min.js')) continue;
    const build = file.endsWith('.native.js') ? 'native' : 'node';
    const source = fs.readFileSync(path.join(distDir, file), 'utf8');
    // rollup output declares them at the start of a line
    for (const [, className, contextName] of source.matchAll(
      /^(?:class ([\w$]+)|const ([\w$]+) = (?:\/\*#__PURE__\*\/)?[\w$.]*createContext\()/gm,
    )) {
      const [kind, name] =
        className ? ['class', className] : ['context', contextName];
      const key = `${build} ${kind} ${name}`;
      if (!declared.has(key)) declared.set(key, { kind, name, files: [] });
      declared.get(key).files.push(`dist/${file}`);
    }
  }
  return [...declared.values()]
    .filter(({ files }) => files.length > 1)
    .map(
      ({ kind, name, files }) =>
        `${kind} ${name} is bundled into ${files.join(' and ')}`,
    );
}
