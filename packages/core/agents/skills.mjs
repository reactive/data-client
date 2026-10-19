// Links the agent skills each installed @data-client package ships into the
// project's .claude/skills, where Claude Code and Cursor load them as their
// own. Links lead through node_modules, so upgrades need no re-run; running
// this again picks up packages or skills that were added or removed. Under
// Yarn Plug'n'Play, which has no node_modules, it copies the skills instead.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { nodeModulesPackages, readJSON } from './node-modules.mjs';
import { pnpPackages } from './pnp.mjs';

const PACKAGES = [
  '@data-client/core',
  '@data-client/endpoint',
  '@data-client/rest',
  '@data-client/graphql',
  '@data-client/react',
  '@data-client/vue',
];
// marks a copied skill as ours, and records which version it came from
const MARKER = '.data-client';

/**
 * Makes `<projectDir>/.claude/skills` hold exactly the skills the installed
 * packages ship. Only touches entries it made: links into
 * node_modules/@data-client, or copies holding its marker.
 */
export function syncSkills(projectDir) {
  const dest = path.join(projectDir, '.claude', 'skills');
  const result = { added: [], removed: [], outdated: [] };
  // never write through a link someone committed
  for (const dir of [path.dirname(dest), dest]) {
    if (fs.lstatSync(dir, { throwIfNoEntry: false })?.isSymbolicLink())
      return result;
  }
  const extracted = fs.mkdtempSync(path.join(os.tmpdir(), 'data-client-'));
  try {
    const want = wantedSkills(projectDir, dest, extracted, result);
    if (!want.size && !fs.existsSync(dest)) return result;
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
    for (const [skill, source] of want) {
      const file = path.join(dest, skill);
      // a skill of the user's own with this name wins
      if (fs.lstatSync(file, { throwIfNoEntry: false })) continue;
      if (source.link) link(source, file);
      else {
        fs.cpSync(source.dir, file, { recursive: true });
        fs.writeFileSync(path.join(file, MARKER), source.id);
      }
      result.added.push(skill);
    }
    return result;
  } finally {
    fs.rmSync(extracted, { recursive: true, force: true });
  }
}

/** Skill name -> where it comes from, for every skill the packages ship */
function wantedSkills(projectDir, dest, extracted, result) {
  let found = nodeModulesPackages(projectDir, PACKAGES);
  // a project that moved off Plug'n'Play can keep a stale .pnp.cjs, so its
  // map counts only when node_modules holds no @data-client package
  const copy = !found.length;
  if (copy) found = pnpPackages(projectDir, PACKAGES, extracted);
  const want = new Map();
  for (const { pkg, dir } of found) {
    const shipped = path.join(dir, 'skills');
    if (!fs.existsSync(shipped)) {
      result.outdated.push(
        `${pkg}@${readJSON(path.join(dir, 'package.json')).version}`,
      );
      continue;
    }
    const base = copy ? undefined : stablePath(dir, pkg, found, dest);
    for (const skill of fs.readdirSync(shipped)) {
      // workspaces can install several versions; the first one found wins
      if (want.has(skill)) continue;
      if (!fs.existsSync(path.join(shipped, skill, 'SKILL.md'))) continue;
      if (copy) {
        const { version } = readJSON(path.join(dir, 'package.json'));
        want.set(skill, {
          dir: path.join(shipped, skill),
          id: `${pkg}@${version}`,
        });
      } else {
        const target = `${base}/skills/${skill}`;
        want.set(skill, {
          link: target,
          dir: path.join(shipped, skill),
          id: target,
        });
      }
    }
  }
  return want;
}

/**
 * What a `.claude/skills` entry this made points at (a link's target, or the
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

function link({ link: target, dir }, file) {
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
  for (const [label, skills] of [
    ['Added', added],
    ['Removed', removed],
  ]) {
    if (skills.length) console.log(`${label} ${skills.join(', ')}`);
  }
  if (!added.length && !removed.length)
    console.log('Data Client skills in .claude/skills are up to date');
  if (outdated.length)
    console.log(
      `${outdated.join(', ')} ships no skills; upgrade to 0.19 or later to get them`,
    );
}
