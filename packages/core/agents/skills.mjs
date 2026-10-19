// Links the agent skills each installed @data-client package ships into the
// project's skill folder, where Claude Code, Cursor and Codex load them as
// their own. Links lead through node_modules, so they follow upgrades; running this
// again picks up packages or skills that were added or removed. Under
// Yarn Plug'n'Play, which has no node_modules, it copies the skills instead.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { isLink, nodeModulesPackages, readJSON } from './node-modules.mjs';
import { pnpPackages } from './pnp.mjs';

// the packages that ship skills (.agents/skill-packages.json); strict layouts
// reach core and endpoint through any declared @data-client package
export const PACKAGES = [
  '@data-client/core',
  '@data-client/endpoint',
  '@data-client/rest',
  '@data-client/react',
  '@data-client/vue',
];
// marks a copied skill as ours, and records which version it came from
const MARKER = '.data-client';

/**
 * Makes the project's skill folder hold exactly the skills the installed
 * packages ship. Only touches entries it made: links into
 * node_modules/@data-client, or copies holding its marker.
 */
export function syncSkills(projectDir) {
  const dirs = skillsDirs(projectDir);
  const result = {
    added: [],
    removed: [],
    outdated: [],
    kept: [],
    junctions: false,
    dir: dirs && posix(path.relative(projectDir, dirs.dest)),
  };
  if (!dirs) return result;
  const { dest, other, mirror } = dirs;
  const extracted = fs.mkdtempSync(path.join(os.tmpdir(), 'data-client-'));
  try {
    const { want, copy } = wantedSkills(projectDir, dest, extracted, result);
    if (!want.size && !fs.existsSync(dest)) return result;
    fs.mkdirSync(dest, { recursive: true });
    // let the agents that read the other folder see it too
    if (!fs.lstatSync(other, { throwIfNoEntry: false })) {
      fs.mkdirSync(path.dirname(other), { recursive: true });
      const target = posix(path.relative(path.dirname(other), dest));
      result.junctions =
        link(target, fs.realpathSync(dest), other) || result.junctions;
    }
    syncDir(dest, want, copy, result);
    if (mirror) mirrorLinks(dest, mirror, result);
    return result;
  } finally {
    fs.rmSync(extracted, { recursive: true, force: true });
  }
}

/**
 * Where the links go (`dest`), the folder to link to it (`other`) when
 * missing, and a folder to link each skill into (`mirror`). Codex reads
 * .agents/skills, Claude Code reads .claude/skills and Cursor reads both, so
 * a new project gets .agents/skills with .claude/skills linking to it. When
 * both are real folders, as the skills CLI makes them, the skills go in
 * .agents/skills with a link to each in .claude/skills, as that CLI does. A
 * project that keeps its skills only in a real .claude/skills folder gets them
 * there, with .agents/skills linking to it. Undefined when a link would lead
 * anywhere else: never write through a link someone committed.
 */
function skillsDirs(projectDir) {
  const claude = path.join(projectDir, '.claude', 'skills');
  const shared = path.join(projectDir, '.agents', 'skills');
  if ([path.dirname(shared), path.dirname(claude)].some(isLink)) return;
  const stat = fs.lstatSync(claude, { throwIfNoEntry: false });
  if (stat?.isDirectory()) {
    const sharedStat = fs.lstatSync(shared, { throwIfNoEntry: false });
    // .claude/skills links into .agents/skills even after someone deleted it
    // (the junction warning says to): recreate it rather than link it to
    // .claude/skills, which would make those links circular
    return (
        sharedStat?.isDirectory() || (!sharedStat && linksInto(claude, shared))
      ) ?
        { dest: shared, other: claude, mirror: claude }
      : { dest: claude, other: shared };
  }
  if (isLink(shared)) return;
  // a committed .claude/skills link checks out as a file without
  // core.symlinks; .agents/skills still serves Codex and Cursor
  if (!stat?.isSymbolicLink()) return { dest: shared, other: claude };
  const target = path.resolve(path.dirname(claude), fs.readlinkSync(claude));
  return target === shared || sameDir(claude, shared) ?
      { dest: shared, other: claude }
    : undefined;
}

/** Whether any entry of `dir` links into `target` */
function linksInto(dir, target) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .some(
      entry =>
        entry.isSymbolicLink() &&
        path.dirname(
          path.resolve(dir, fs.readlinkSync(path.join(dir, entry.name))),
        ) === target,
    );
}

/** A junction holds an absolute path, which may differ from `shared` in casing or a linked parent */
function sameDir(a, b) {
  try {
    return fs.realpathSync.native(a) === fs.realpathSync.native(b);
  } catch {
    return false;
  }
}

function syncDir(dest, want, copy, result) {
  for (const entry of fs.readdirSync(dest, { withFileTypes: true })) {
    const file = path.join(dest, entry.name);
    const current = owned(file, entry);
    if (current === undefined) {
      // anything else holding a wanted name wins: the user's own skill, a
      // committed link git checked out as a file, copies committed from a
      // junction. Say so rather than report up to date.
      if (want.delete(entry.name)) result.kept.push(entry.name);
      continue;
    }
    const wanted = want.get(entry.name);
    if (
      wanted &&
      (current === wanted.id ||
        // a junction (see link) holds the absolute path instead
        (path.isAbsolute(current) && current === real(wanted.dir)))
    ) {
      want.delete(entry.name);
      continue;
    }
    fs.rmSync(file, { recursive: true, force: true });
    if (!want.has(entry.name)) result.removed.push(entry.name);
  }
  for (const [skill, { dir, id }] of want) {
    const file = path.join(dest, skill);
    if (copy) {
      fs.cpSync(dir, file, { recursive: true });
      fs.writeFileSync(path.join(file, MARKER), id);
    } else
      result.junctions =
        link(id, fs.realpathSync(dir), file) || result.junctions;
    result.added.push(skill);
  }
}

/**
 * Links each skill this made in `dest` into `mirror` (../../.agents/skills/<name>),
 * and drops those links for skills it removed. Each points at the `dest`
 * entry, not through it, so upgrades that relink that entry carry over.
 */
function mirrorLinks(dest, mirror, result) {
  // a junction (see link) holds the absolute path instead
  const junction = skill => path.join(fs.realpathSync(dest), skill);
  for (const skill of result.removed) {
    const file = path.join(mirror, skill);
    if (!isLink(file)) continue;
    const current = posix(fs.readlinkSync(file));
    if (current === mirrored(skill) || current === posix(junction(skill)))
      fs.rmSync(file);
  }
  for (const entry of fs.readdirSync(dest, { withFileTypes: true })) {
    const file = path.join(mirror, entry.name);
    if (owned(path.join(dest, entry.name), entry) === undefined) continue;
    if (fs.lstatSync(file, { throwIfNoEntry: false })) continue;
    result.junctions =
      link(mirrored(entry.name), junction(entry.name), file) ||
      result.junctions;
  }
}

const mirrored = skill => `../../.agents/skills/${skill}`;

/**
 * Skill name -> its directory and id: the link target from `dest`, or
 * `pkg@version` for copies, which Yarn Plug'n'Play needs since it has no
 * node_modules
 */
function wantedSkills(projectDir, dest, extracted, result) {
  let found = nodeModulesPackages(projectDir, PACKAGES);
  // a project that moved off Plug'n'Play can keep a stale .pnp.cjs, so its
  // map counts only when node_modules holds no @data-client package
  const copy = !found.length;
  if (copy) found = pnpPackages(projectDir, PACKAGES, extracted);
  const want = new Map();
  for (const { pkg, dir } of found) {
    const version = `${pkg}@${readJSON(path.join(dir, 'package.json')).version}`;
    const shipped = path.join(dir, 'skills');
    if (!fs.existsSync(shipped)) {
      result.outdated.push(version);
      continue;
    }
    const base = copy ? undefined : stablePath(dir, pkg, found, dest);
    for (const skill of fs.readdirSync(shipped)) {
      // workspaces can install several versions; the first one found wins
      if (want.has(skill)) continue;
      if (!fs.existsSync(path.join(shipped, skill, 'SKILL.md'))) continue;
      want.set(skill, {
        dir: path.join(shipped, skill),
        id: copy ? version : `${base}/skills/${skill}`,
      });
    }
  }
  return { want, copy };
}

/**
 * What a skill folder entry this made points at (a link's target, or the
 * version in a copy's marker), or undefined for anyone else's entry
 */
function owned(file, entry) {
  if (entry.isSymbolicLink()) {
    // Windows writes relative targets with backslashes
    const target = posix(fs.readlinkSync(file));
    return /node_modules\/@data-client\//.test(target) ? target : undefined;
  }
  const marker = path.join(file, MARKER);
  return entry.isDirectory() && fs.existsSync(marker) ?
      fs.readFileSync(marker, 'utf8')
    : undefined;
}

/**
 * A relative path from `dest` to `dir` that survives upgrades. pnpm keeps
 * transitive packages (core, endpoint) only in its versioned store, so reach
 * them through a direct dependency's link: node_modules/@data-client/react/../core
 * resolves to the store sibling of whichever react version is installed.
 */
function stablePath(dir, pkg, found, dest) {
  const relative = from => posix(path.relative(dest, from));
  // Windows resolves `..` before following links, so it gets the store path
  if (!dir.split(path.sep).includes('.pnpm') || process.platform === 'win32')
    return relative(dir);
  const parent = path.dirname(fs.realpathSync(dir));
  for (const direct of found) {
    if (direct.dir.split(path.sep).includes('.pnpm')) continue;
    if (path.dirname(fs.realpathSync(direct.dir)) === parent)
      return `${relative(direct.dir)}/../${pkg.split('/')[1]}`;
  }
  return relative(dir);
}

const posix = file => file.replaceAll('\\', '/');
const real = dir => posix(fs.realpathSync(dir));

/**
 * Links `file` to `target`, or to `absolute` with a junction where Windows
 * denies symlinks but still allows junctions, which need an absolute target.
 * Returns true when it had to make a junction.
 */
function link(target, absolute, file) {
  try {
    fs.symlinkSync(target, file, 'dir');
    return false;
  } catch (error) {
    if (error.code !== 'EPERM') throw error;
    fs.symlinkSync(absolute, file, 'junction');
    return true;
  }
}

/** The `data-client-skills` command */
export function main(projectDir = process.cwd()) {
  const { added, removed, outdated, kept, dir, junctions } =
    syncSkills(projectDir);
  if (added.length) console.log(`Added ${added.join(', ')}`);
  if (removed.length) console.log(`Removed ${removed.join(', ')}`);
  for (const skill of kept)
    console.log(
      `Kept ${dir}/${skill} (not a link data-client-skills made); delete it to get the installed version`,
    );
  if (!added.length && !removed.length && !kept.length)
    console.log('Data Client skills are up to date');
  if (junctions)
    console.log(
      `Windows denied symlinks, so ${dir} holds junctions, which git commits as copies. Don't commit them; to commit links, turn on Developer Mode, run git config core.symlinks true, delete ${dir} and rerun.`,
    );
  if (outdated.length)
    console.log(
      `${outdated.join(', ')} ships no skills; upgrade to 0.19 or later to get them`,
    );
}
