/* global require */
// Before an agent runs `git push` (Cursor `beforeShellExecution`, Claude Code
// `PreToolUse` on Bash), regenerates agent skill references when the branch
// touches their inputs, and holds the push until the result is committed.
// Runs once per push instead of per edit or turn, so any number of local
// commits can come first; CI's `skills` check is the backstop.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let payload = {};
try {
  payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const command = payload.command ?? payload.tool_input?.command ?? '';
if (!/\bgit\b[^;&|\n]*\bpush\b/.test(command)) process.exit(0);

const projectDir =
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();
const git = (...args) =>
  execFileSync('git', args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

let manifestCache;
/** Every skill's references.json */
function manifests() {
  if (!manifestCache) {
    const skills = path.join(projectDir, '.agents/skills');
    manifestCache = fs
      .readdirSync(skills)
      .map(skill => path.join(skills, skill, 'references.json'))
      .filter(manifest => fs.existsSync(manifest))
      .map(manifest => JSON.parse(fs.readFileSync(manifest, 'utf8')));
  }
  return manifestCache;
}

/** Docs some skill renders; partials (`_foo.mdx`) may be inlined anywhere */
function isSkillDoc(file) {
  if (!/^docs\/.*\.mdx?$/.test(file)) return false;
  if (path.basename(file).startsWith('_')) return true;
  const page = file.replace(/\.(react|vue)(\.mdx?)$/, '$2');
  return manifests().some(({ docs }) => Object.values(docs).includes(page));
}

/** Manifests and SKILL.md (link checks), or files of a skill another bundles */
function isSkillSource(file) {
  const [, skill, rest] = file.match(/^\.agents\/skills\/([^/]+)\/(.+)$/) ?? [];
  if (!skill) return false;
  if (rest === 'references.json' || rest === 'SKILL.md') return true;
  return manifests().some(({ skills = [] }) => skills.includes(skill));
}
const isInput = file =>
  isSkillDoc(file) ||
  isSkillSource(file) ||
  file.startsWith('website/framework-docs/') ||
  // symlinked into skills that others bundle
  file.startsWith('website/static/codemods/');

// files the branch changes relative to master
let changed;
try {
  const base = git('merge-base', 'HEAD', 'origin/master');
  changed = git('diff', '--name-only', base, 'HEAD').split('\n');
} catch {
  process.exit(0);
}
if (!changed.some(isInput)) process.exit(0);

let problems = '';
try {
  execFileSync('node', ['website/framework-docs/skillReferences.mjs'], {
    cwd: projectDir,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
} catch (err) {
  // dead links, missing variant notes or bad manifests
  problems = String(err.stderr ?? '').trim();
}
// includes references regenerated earlier but never committed
const uncommitted = git(
  'status',
  '--porcelain',
  '--untracked-files=all',
  '--',
  '.agents/skills',
)
  .split('\n')
  .filter(line => line.includes('/references/'))
  .join('\n');
if (!uncommitted && !problems) process.exit(0);

const message = [
  uncommitted &&
    `Skill references generated from this branch's docs or skill changes aren't committed. Commit them, then push again:\n${uncommitted}`,
  problems &&
    `\`yarn build:skills\` found problems the skills CI check will fail on. Fix them, commit, then push again:\n${problems}`,
]
  .filter(Boolean)
  .join('\n\n');
console.log(
  JSON.stringify(
    payload.hook_event_name === 'PreToolUse' ?
      {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: message,
        },
      }
    : { permission: 'deny', userMessage: message, agentMessage: message },
  ),
);
process.exit(0);
