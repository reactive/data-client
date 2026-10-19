// Finds installed packages through node_modules: hoisted installs, pnpm
// (store links and transitive packages), and npm, Yarn and pnpm workspaces
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Each installed directory of the `names` packages, searching from the project
 * and its workspaces, then from each @data-client package found: strict
 * layouts (pnpm) expose core and endpoint only to the packages that depend on
 * them, such as graphql
 * @returns {{ pkg: string, dir: string }[]}
 */
export function nodeModulesPackages(projectDir, names) {
  const roots = [projectDir, ...workspaceDirs(projectDir)].flatMap(dir => [
    dir,
    ...declaredPackages(dir),
  ]);
  // Keyed by real directory, so each version a workspace installs is listed,
  // through the path that workspace sees it at
  const found = new Map();
  for (const from of roots) {
    for (const pkg of names) {
      const dir = packageDir(from, pkg);
      const real = dir && realpath(dir);
      if (real && !found.has(real)) {
        found.set(real, { pkg, dir });
        if (!roots.includes(dir)) roots.push(dir);
      }
    }
  }
  return [...found.values()];
}

/** Directories of the @data-client packages `dir`'s package.json declares */
function declaredPackages(dir) {
  const file = path.join(dir, 'package.json');
  if (!fs.existsSync(file)) return [];
  const manifest = readJSON(file);
  return [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]
    .flatMap(field => Object.keys(manifest[field] ?? {}))
    .filter(name => name.startsWith('@data-client/'))
    .map(name => packageDir(dir, name))
    .filter(Boolean);
}

/** Workspace packages declared by package.json or pnpm-workspace.yaml */
function workspaceDirs(dir) {
  const manifest = path.join(dir, 'package.json');
  const { workspaces = [] } = fs.existsSync(manifest) ? readJSON(manifest) : {};
  const pnpm = path.join(dir, 'pnpm-workspace.yaml');
  // workspaces live inside the project; `..` would scan unrelated trees
  const patterns = [
    ...(workspaces.packages ?? workspaces),
    ...(fs.existsSync(pnpm) ? pnpmPackages(pnpm) : []),
  ].filter(pattern => !segments(pattern).includes('..'));
  const excluded = patterns
    .filter(pattern => pattern.startsWith('!'))
    .map(pattern => globRegex(pattern.slice(1)));
  return patterns
    .filter(pattern => !pattern.startsWith('!'))
    .flatMap(pattern => expand(dir, segments(pattern)))
    .filter(found => {
      const relative = path.relative(dir, found).split(path.sep).join('/');
      return !excluded.some(regex => regex.test(relative));
    });
}

// path.join also splits on `\` on Windows, so the `..` check must too
const segments = pattern => pattern.split(/[\\/]/);

/**
 * `packages` of a pnpm-workspace.yaml, as a block or flow list; enough YAML
 * for that one key, so no parser ships with the plugin
 */
function pnpmPackages(file) {
  const text = fs
    .readFileSync(file, 'utf8')
    .replace(/\r\n?/g, '\n')
    .replace(/(^|\s)#.*$/gm, '');
  const value =
    /^packages:[ \t]*(\[[^\]]*\]|(?:\n(?:[ \t]*-.*|[ \t]*))*)/m.exec(text)?.[1];
  if (!value) return [];
  const items =
    value.startsWith('[') ?
      value.slice(1, -1).split(',')
    : value.split('\n').map(line => line.replace(/^\s*-/, ''));
  return items
    .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** Directories with a package.json matching glob segments (`*`, `**`) */
function expand(dir, [segment, ...rest]) {
  if (segment === undefined)
    return fs.existsSync(path.join(dir, 'package.json')) ? [dir] : [];
  if (segment === '' || segment === '.') return expand(dir, rest);
  if (!segment.includes('*')) {
    // a committed symlink could lead out of the project; subdirs() skips them
    // for wildcard segments too
    const next = path.join(dir, segment);
    const link = fs
      .lstatSync(next, { throwIfNoEntry: false })
      ?.isSymbolicLink();
    return link ? [] : expand(next, rest);
  }
  const children = subdirs(dir);
  if (segment === '**')
    return [
      ...expand(dir, rest),
      ...children.flatMap(child => expand(child, [segment, ...rest])),
    ];
  const match = globRegex(segment);
  return children
    .filter(child => match.test(path.basename(child)))
    .flatMap(child => expand(child, rest));
}

function subdirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      e =>
        e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.'),
    )
    .map(e => path.join(dir, e.name));
}

/** Matches a relative path against a glob of `*` and `**` segments */
function globRegex(pattern) {
  const source = pattern
    .replace(/^\.\//, '')
    .split('/')
    .map(segment =>
      segment === '**' ? '\0' : segment.split('*').map(escape).join('[^/]*'),
    )
    .join('/')
    .replace(/\0\//g, '(?:.*/)?')
    .replace(/\/\0/g, '(?:/.*)?')
    .replace(/\0/g, '.*');
  return new RegExp(`^${source}$`);
}

function escape(text) {
  return text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function realpath(dir) {
  try {
    return fs.realpathSync(dir);
  } catch {
    return dir;
  }
}

function packageDir(from, pkg) {
  // the linked path names the workspace; resolve() returns the store path.
  // Resolve from the real path: from a pnpm link, Node never sees the store
  // siblings (transitive core and endpoint)
  const linked = path.join(from, 'node_modules', pkg);
  if (fs.existsSync(path.join(linked, 'package.json'))) return linked;
  try {
    const manifest = createRequire(
      path.join(realpath(from), 'package.json'),
    ).resolve(`${pkg}/package.json`);
    // resolve() caches what it found, which may be gone since
    return fs.existsSync(manifest) ? path.dirname(manifest) : undefined;
  } catch {
    return undefined;
  }
}

export function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
