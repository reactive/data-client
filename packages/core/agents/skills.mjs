// Links the agent skills each installed @data-client package ships into the
// project's skill folder, where Claude Code, Cursor and Codex load them as
// their own. Links lead through node_modules, so they follow upgrades; running this
// again picks up packages or skills that were added or removed. Under
// Yarn Plug'n'Play, which has no node_modules, it copies the skills instead.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { nodeModulesPackages, readJSON } from './node-modules.mjs';
import { pnpPackages } from './pnp.mjs';

// the packages that ship skills (.agents/skill-packages.json); strict layouts
// reach core and endpoint through any declared @data-client package
const PACKAGES = [
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
  const result = { added: [], removed: [], outdated: [] };
  const dest = skillsDir(projectDir);
  if (!dest) return result;
  const extracted = fs.mkdtempSync(path.join(os.tmpdir(), 'data-client-'));
  try {
    const { found, copy } = installedPackages(projectDir, extracted);
    const want = wantedSkills(found, copy, dest, result);
    if (!want.size && !fs.existsSync(dest)) return result;
    fs.mkdirSync(dest, { recursive: true });
    shareWithClaude(projectDir, dest);
    syncDir(dest, want, copy, result);
    return result;
  } finally {
    fs.rmSync(extracted, { recursive: true, force: true });
  }
}

/**
 * Where the links go. Codex reads .agents/skills, Claude Code reads
 * .claude/skills and Cursor reads both, so a new project gets .agents/skills
 * with .claude/skills linking to it. A project that already keeps its skills
 * in a real .claude/skills folder gets them there. Undefined when a link would
 * lead anywhere else: never write through a link someone committed.
 */
function skillsDir(projectDir) {
  const claude = path.join(projectDir, '.claude', 'skills');
  const shared = path.join(projectDir, '.agents', 'skills');
  if ([shared, path.dirname(shared), path.dirname(claude)].some(isLink)) return;
  if (!isLink(claude)) return fs.existsSync(claude) ? claude : shared;
  const target = path.resolve(path.dirname(claude), fs.readlinkSync(claude));
  return target === shared ? shared : undefined;
}

/** Links .claude/skills to .agents/skills when it doesn't exist yet */
function shareWithClaude(projectDir, dest) {
  const claude = path.join(projectDir, '.claude', 'skills');
  if (dest === claude || fs.lstatSync(claude, { throwIfNoEntry: false }))
    return;
  fs.mkdirSync(path.dirname(claude), { recursive: true });
  link('../.agents/skills', dest, claude);
}

function isLink(file) {
  return !!fs.lstatSync(file, { throwIfNoEntry: false })?.isSymbolicLink();
}

function syncDir(dest, want, copy, result) {
  if (!want.size && !fs.existsSync(dest)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(dest, { withFileTypes: true })) {
    const file = path.join(dest, entry.name);
    const current = owned(file, entry);
    if (current === undefined) continue;
    if (current === want.get(entry.name)?.id) {
      want.delete(entry.name);
      continue;
    }
    fs.rmSync(file, { recursive: true, force: true });
    if (!want.has(entry.name)) result.removed.push(entry.name);
  }
  for (const [skill, { dir, id }] of want) {
    const file = path.join(dest, skill);
    // a skill of the user's own with this name wins
    if (fs.lstatSync(file, { throwIfNoEntry: false })) continue;
    if (copy) {
      fs.cpSync(dir, file, { recursive: true });
      fs.writeFileSync(path.join(file, MARKER), id);
    } else link(id, dir, file);
    result.added.push(skill);
  }
}

/**
 * The installed packages; under Yarn Plug'n'Play, which has no node_modules,
 * extracted into `extracted` so they can be copied
 */
function installedPackages(projectDir, extracted) {
  const found = nodeModulesPackages(projectDir, PACKAGES);
  // a project that moved off Plug'n'Play can keep a stale .pnp.cjs, so its
  // map counts only when node_modules holds no @data-client package
  if (found.length) return { found, copy: false };
  return { found: pnpPackages(projectDir, PACKAGES, extracted), copy: true };
}

/**
 * Skill name -> its directory and id: the link target from `dest`, or
 * `pkg@version` for copies
 */
function wantedSkills(found, copy, dest, result) {
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
  return want;
}

/**
 * What a skill folder entry this made points at (a link's target, or the
 * version in a copy's marker), or undefined for anyone else's entry
 */
function owned(file, entry) {
  if (entry.isSymbolicLink()) {
    const target = fs.readlinkSync(file);
    return /node_modules[\\/]@data-client[\\/]/.test(target) ? target : (
        undefined
      );
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
  const relative = from => path.relative(dest, from).split(path.sep).join('/');
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

function link(target, dir, file) {
  try {
    fs.symlinkSync(target, file, 'dir');
  } catch (error) {
    // Windows without symlink rights still allows junctions, which need an
    // absolute target
    if (error.code !== 'EPERM') throw error;
    fs.symlinkSync(fs.realpathSync(dir), file, 'junction');
  }
}

/** The `data-client-skills` command */
export function main(projectDir = process.cwd()) {
  const { added, removed, outdated } = syncSkills(projectDir);
  if (added.length) console.log(`Added ${added.join(', ')}`);
  if (removed.length) console.log(`Removed ${removed.join(', ')}`);
  if (!added.length && !removed.length)
    console.log('Data Client skills are up to date');
  if (outdated.length)
    console.log(
      `${outdated.join(', ')} ships no skills; upgrade to 0.19 or later to get them`,
    );
}
