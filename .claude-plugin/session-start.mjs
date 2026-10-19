#!/usr/bin/env node
// SessionStart hook of the data-client Claude Code plugin. Plugin skills load
// in every project, so the plugin carries only the generic entry skills; this
// points the agent at the skills of the @data-client packages the project
// installed, which match their version and framework. It prints nothing when
// the project has no @data-client package, and never fails the session.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tty from 'node:tty';
import { fileURLToPath } from 'node:url';

import { nodeModulesPackages, readJSON } from './node-modules.mjs';
import { pnpPackages } from './pnp.mjs';

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

try {
  if (!firstCopy()) process.exit();
  const owners = readJSON(path.join(pluginRoot, '.agents/skill-packages.json'));
  const names = Object.keys(owners);
  // a project that moved off Plug'n'Play can keep a stale .pnp.cjs, so its
  // map counts only when node_modules holds no @data-client package
  let found = nodeModulesPackages(projectDir, names);
  if (!found.length) found = pnpPackages(projectDir, names, pnpCopies());
  if (found.length) {
    const versions = new Set();
    const lines = [];
    let fromPlugin = false;
    for (const { pkg, dir } of found) {
      const id = `${pkg}@${readJSON(path.join(dir, 'package.json')).version}`;
      if (versions.has(id)) continue;
      versions.add(id);
      // The installed package decides its skills; the map only covers
      // releases from before the packages shipped them
      const shipped = path.join(dir, 'skills');
      const ships = fs.existsSync(shipped);
      if (!ships) fromPlugin = true;
      const [skillsDir, skills] =
        ships ?
          [shipped, fs.readdirSync(shipped).sort()]
        : [path.join(pluginRoot, '.agents/skills'), owners[pkg]];
      for (const skill of skills) {
        const file = path.join(skillsDir, skill, 'SKILL.md');
        if (fs.existsSync(file)) {
          lines.push(`- ${skill}: ${description(file)} (${display(file)})`);
        }
      }
    }
    console.log(
      [
        `This project uses Reactive Data Client (${[...versions].join(', ')}). Before writing or changing Data Client code, read the SKILL.md for the task; these ship in the installed packages, matched to their versions:`,
        ...lines,
        ...(fromPlugin ?
          [
            `Some of these packages predate shipped skills, so those paths come from the latest release; where one describes an API the installed version lacks, follow the installed types.`,
          ]
        : []),
      ].join('\n'),
    );
  }
} catch {
  // context is a convenience; a broken project must still start
}

/**
 * Where zipped Yarn PnP skills are copied for agents to read: the plugin's
 * data directory, never the project. Agents without one (Codex) use a cache
 * in the user's home.
 */
function pnpCopies() {
  return path.join(
    process.env.CLAUDE_PLUGIN_DATA ||
      path.join(os.homedir(), '.cache/data-client'),
    'pnp-skills',
  );
}

/**
 * Whether this is the first copy of the hook to start for this session event.
 * The old plugin names stay installed beside data-client, so several copies
 * run at once; only the first prints.
 */
function firstCopy() {
  // not process.stdin: creating it makes a piped fd 0 non-blocking, and
  // reading before Claude Code writes the input would then fail
  if (tty.isatty(0)) return true;
  let session_id, source;
  try {
    ({ session_id, source } = JSON.parse(fs.readFileSync(0, 'utf8')));
  } catch {
    return true;
  }
  if (!session_id) return true;
  const marker = path.join(
    os.tmpdir(),
    `data-client-hook-${`${session_id}-${source}`.replace(/[^\w-]/g, '')}`,
  );
  // mkdir is atomic, so one copy at a time reads and stamps the marker. Each
  // event (startup, resume, clear, compact) has its own marker, and a repeat
  // of one later in the session finds an old stamp and prints again
  const lock = `${marker}.lock`;
  try {
    fs.mkdirSync(lock);
  } catch (error) {
    // another copy holds it; any other failure prints rather than lose context
    return error.code !== 'EEXIST';
  }
  try {
    // lstat: a symlink planted at the marker is never ours, so never fresh
    const stat = fs.lstatSync(marker, { throwIfNoEntry: false });
    const fresh = stat?.isFile() && Date.now() - stat.mtimeMs < 10_000;
    if (!fresh) {
      // a fresh file, not one through a symlink planted in the shared tmpdir
      fs.rmSync(marker, { force: true });
      fs.writeFileSync(marker, '', { flag: 'wx' });
    }
    return !fresh;
  } finally {
    fs.rmdirSync(lock);
  }
}

/** First sentence of the skill's frontmatter description */
function description(file) {
  const match = /^description:\s*(.*)$/m.exec(fs.readFileSync(file, 'utf8'));
  return match ? match[1].split(/(?<=\.)\s/)[0] : '';
}

function display(file) {
  const relative = path.relative(projectDir, file);
  return relative.startsWith('..') ? file : relative;
}
