#!/usr/bin/env node
// Decides whether a change can affect what a CI job measures, so dependency
// bumps that only touch unrelated tooling (tests, lint, React Native, website)
// skip it. Fails open: anything it can't classify counts as relevant.
//
// Usage: node scripts/ci-deps-relevant.mjs <base-sha> <workspace>[,<workspace>...] [path...]
//   <workspace>: what the job builds and runs (e.g. examples/benchmark).
//   [path...]: the workflow's `paths` filter (GitHub globs, `!` excludes).
//   Relevant when, between <base-sha> and HEAD:
//   - a file matching [path...] (any file, if none given) changed, other than
//     package.json and lockfiles, or
//   - the root package.json changed outside devDependencies/resolutions, or
//   - a listed workspace's package.json changed, or a package.json field
//     other than devDependencies/version of a workspace package it depends on
//     (packageManager is ignored: the yarn version doesn't change output), or
//   - the yarn.lock resolutions reachable from those workspaces' dependencies
//     (or from the build tooling below) changed.
// Prints the decision and writes `relevant=true|false` to $GITHUB_OUTPUT.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

// Root build tooling every package build uses (babel.config.js, browserslist).
// Add new root build dependencies here: root devDependencies aren't walked.
const BUILD_TOOLS =
  /^(@babel\/|core-js|browserslist$|caniuse-lite$|babel-plugin-module-resolver$|@anansi\/(babel-preset|browserslist-config)$)/;
// Type-only packages can't change built output or runtime behavior
const IGNORED = /^(@types\/|typescript$|@typescript\/)/;
const DEP_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
  'devDependencies',
];

const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
const show = (ref, file) => {
  try {
    return git('show', `${ref}:${file}`);
  } catch {
    return undefined;
  }
};
const json = (ref, file) => {
  const text = show(ref, file);
  return text === undefined ? undefined : JSON.parse(text);
};
const omit = (obj, keys) =>
  obj &&
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// '@scope/name@npm:1.0.0' -> '@scope/name'
const nameOf = descriptor => descriptor.slice(0, descriptor.indexOf('@', 1));

function decide(base, workspaceDirs, paths) {
  git('rev-parse', '--verify', `${base}^{commit}`);
  // GitHub `paths` globs as git pathspecs, minus manifests and lockfiles
  const pathspecs = (paths.length ? paths : ['**']).map(p =>
    p.startsWith('!') ? `:(exclude,glob)${p.slice(1)}` : `:(glob)${p}`,
  );
  const other = git(
    'diff',
    '--name-only',
    '--no-renames',
    base,
    'HEAD',
    '--',
    ...pathspecs,
    ':(exclude)yarn.lock',
    ':(exclude,glob)**/package.json',
    ':(exclude,glob)**/package-lock.json',
  )
    .split('\n')
    .filter(Boolean);
  if (other.length) return `files changed: ${other.slice(0, 5).join(', ')}`;

  // Root scripts (e.g. build:benchmark); yarn.lock covers its devDependencies
  // and resolutions
  const root = json('HEAD', 'package.json');
  const rootOmitted = [
    'devDependencies',
    'resolutions',
    'version',
    'packageManager',
  ];
  if (
    !same(
      omit(json(base, 'package.json'), rootOmitted),
      omit(root, rootOmitted),
    )
  )
    return 'package.json changed';

  // Workspace packages by name, so `workspace:*` deps can be followed
  const rootPatterns = root.workspaces;
  const workspaces = new Map();
  for (const file of git(
    'ls-files',
    '--',
    ...rootPatterns.map(p => `${p}/package.json`),
  )
    .split('\n')
    .filter(Boolean)) {
    workspaces.set(json('HEAD', file).name, file);
  }

  // Seed names: everything the listed workspaces use, plus the shipped
  // dependencies of workspace packages they pull in
  const seeds = new Set();
  const visited = new Set();
  const queue = [];
  const addDeps = (manifest, fields) => {
    for (const field of fields)
      for (const name of Object.keys(manifest?.[field] ?? {})) queue.push(name);
  };
  for (const dir of workspaceDirs) {
    const file = `${dir}/package.json`;
    const head = json('HEAD', file);
    if (
      !same(
        omit(json(base, file), ['packageManager']),
        omit(head, ['packageManager']),
      )
    )
      return `${file} changed`;
    addDeps(head, DEP_FIELDS);
  }
  while (queue.length) {
    const name = queue.pop();
    if (visited.has(name) || IGNORED.test(name)) continue;
    visited.add(name);
    const file = workspaces.get(name);
    if (!file) {
      seeds.add(name);
      continue;
    }
    const head = json('HEAD', file);
    const omitted = ['devDependencies', 'version', 'packageManager'];
    if (!same(omit(json(base, file), omitted), omit(head, omitted)))
      return `${file} changed`;
    addDeps(head, ['dependencies', 'optionalDependencies']);
  }

  const before = reachable(parseLock(show(base, 'yarn.lock')), seeds);
  const after = reachable(parseLock(show('HEAD', 'yarn.lock')), seeds);
  const diff = [...after]
    .filter(r => !before.has(r))
    .concat([...before].filter(r => !after.has(r)));
  if (diff.length)
    return `resolved dependencies changed: ${diff.slice(0, 5).join(', ')}`;
}

// yarn.lock (berry) -> descriptor and name lookups for each resolution's deps
function parseLock(text) {
  const byDescriptor = new Map();
  const byName = new Map();
  const deps = new Map();
  for (const block of text.split('\n\n')) {
    const lines = block.split('\n');
    const header = lines.findIndex(l => /^"?[^\s#].*:$/.test(l));
    const resolution = block.match(/^ {2}resolution: "(.+)"$/m)?.[1];
    if (header < 0 || !resolution) continue;
    for (const d of lines[header].slice(0, -1).split(', '))
      byDescriptor.set(d.replace(/^"|"$/g, ''), resolution);
    const name = nameOf(resolution);
    byName.set(name, [...(byName.get(name) ?? []), resolution]);
    const own = [];
    let inDeps = false;
    for (const line of lines.slice(header + 1)) {
      if (/^ {2}\S/.test(line)) inDeps = line === '  dependencies:';
      else if (inDeps) {
        const m = line.match(/^ {4}"?([^":]+)"?: "?([^"]+)"?$/);
        if (m) own.push([m[1], m[2]]);
      }
    }
    deps.set(resolution, own);
  }
  return { byDescriptor, byName, deps };
}

function reachable({ byDescriptor, byName, deps }, seeds) {
  const seen = new Set();
  const stack = [];
  for (const [name, resolutions] of byName)
    if (seeds.has(name) || BUILD_TOOLS.test(name)) stack.push(...resolutions);
  while (stack.length) {
    const res = stack.pop();
    if (
      seen.has(res) ||
      IGNORED.test(nameOf(res)) ||
      res.includes('@workspace:')
    )
      continue;
    seen.add(res);
    for (const [name, range] of deps.get(res) ?? []) {
      const target = byDescriptor.get(`${name}@${range}`);
      // Unmatched ranges (patches, workspaces) follow every version of the name
      stack.push(...(target ? [target] : (byName.get(name) ?? [])));
    }
  }
  return seen;
}

const [base, workspaces = '', ...rest] = process.argv.slice(2);
const paths = rest.filter(Boolean);
let reason;
try {
  reason = decide(base, workspaces.split(',').filter(Boolean), paths);
} catch (e) {
  reason = `could not decide, running anyway (${e.message.split('\n')[0]})`;
}
const relevant = reason !== undefined;
console.log(
  relevant ?
    `relevant: ${reason}`
  : 'not relevant: no change reaches these workspaces',
);
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `relevant=${relevant}\n`);
