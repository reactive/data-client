#!/usr/bin/env node
// Mirrors the Cursor agent setup for Claude Code so both harnesses get the
// same steering from one source:
// - every `<dir>/.cursor/rules/<name>.mdc` becomes `<dir>/.claude/rules/<name>.md`
//   with its `globs` as Claude's `paths`. Same depth, so relative links still
//   resolve, and nested rules keep loading only for files in their folder.
// - `.claude/skills` links to `.agents/skills`
// AGENTS.md needs nothing: Claude Code reads it natively while the repo has
// no CLAUDE.md.
//
// Usage: node scripts/agent-rules.mjs [--check]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const SKILLS_LINK = '.claude/skills';
const SKILLS_TARGET = '../.agents/skills';

const lsFiles = glob =>
  execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      `:(glob)${glob}`,
    ],
    { cwd: root, encoding: 'utf8' },
  )
    .split('\n')
    .filter(file => file && fs.existsSync(path.join(root, file)));

const problems = [];
/** @type {Map<string, string>} output path -> content */
const outputs = new Map();

for (const source of lsFiles('**/.cursor/rules/*.mdc')) {
  const text = fs.readFileSync(path.join(root, source), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) {
    problems.push(`${source}: missing frontmatter`);
    continue;
  }
  // Cursor's own frontmatter: single-line `key: value`, `globs` comma-separated
  const meta = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map(line => /^(\w+):\s*(.*)$/.exec(line))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.trim()]),
  );
  // folder holding `.cursor` ('' at the root)
  const base = source.replace(/(^|\/)\.cursor\/rules\/[^/]+$/, '');
  // Claude resolves a nested rule's `paths` from its folder; accept globs
  // written from either the repo root or that folder
  const globs = (meta.globs ?? '')
    .split(',')
    .map(glob => glob.trim())
    .filter(Boolean)
    .map(glob =>
      base && glob.startsWith(`${base}/`) ? glob.slice(base.length + 1) : glob,
    );
  const alwaysApply = meta.alwaysApply === 'true';
  if (!alwaysApply && !globs.length) {
    problems.push(
      `${source}: rules need \`globs\` or \`alwaysApply: true\`. Claude Code has no description-only rules; put guidance the agent pulls in by description in a skill (.agents/skills) instead`,
    );
    continue;
  }
  const output = path.posix.join(
    base,
    '.claude/rules',
    path.posix.basename(source, '.mdc') + '.md',
  );
  const frontmatter =
    alwaysApply ? '' : (
      `---\npaths:\n${globs.map(glob => `  - ${JSON.stringify(glob)}\n`).join('')}---\n`
    );
  outputs.set(
    output,
    `${frontmatter}<!-- Generated from ${source} by \`yarn build:agent-rules\`. Edit the source. -->\n\n${text.slice(match[0].length)}`,
  );
}

const changed = [];
for (const file of lsFiles('**/.claude/rules/**')) {
  if (outputs.has(file)) continue;
  changed.push(`${file} (no source rule)`);
  if (!check) fs.rmSync(path.join(root, file));
}
for (const [file, content] of outputs) {
  const abs = path.join(root, file);
  if (fs.existsSync(abs) && fs.readFileSync(abs, 'utf8') === content) continue;
  changed.push(file);
  if (!check) {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
}

const link = path.join(root, SKILLS_LINK);
let linkTarget;
try {
  linkTarget = fs.readlinkSync(link);
} catch {
  // missing, or a checkout without symlinks
}
if (linkTarget !== SKILLS_TARGET) {
  changed.push(`${SKILLS_LINK} (must be a symlink to ${SKILLS_TARGET})`);
  if (!check) {
    fs.rmSync(link, { recursive: true, force: true });
    fs.symlinkSync(SKILLS_TARGET, link, 'dir');
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
if (check && changed.length) {
  console.error(
    `Claude Code agent config is out of date with the Cursor rules. Run \`yarn build:agent-rules\` and commit:\n${changed.join('\n')}`,
  );
  process.exit(1);
}
console.log(
  changed.length ?
    `Updated:\n${changed.join('\n')}`
  : 'Claude Code rules are up to date.',
);
