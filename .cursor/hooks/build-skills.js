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
// a git subcommand as a command (`git push`, `git -C dir push`, `cd x && git
// push`); not `git stash push`, `git -c commit.gpgsign=false`, a branch named
// fix-commit or a commit message mentioning push
const gitCommand = sub =>
  new RegExp(
    `(?:^|[;&|(]\\s*)git(?:\\s+-[cC]\\s+\\S+|\\s+--?[\\w-]+(?:=\\S+)?)*\\s+${sub}(?![\\w.-])`,
    'm',
  );
if (!gitCommand('push').test(command)) process.exit(0);

const projectDir =
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();
const git = (...args) =>
  execFileSync('git', args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trimEnd();

/** Docs some skill renders; partials (`_foo.mdx`) may be inlined anywhere */
let skillDocs;
function isSkillDoc(file) {
  if (!/^docs\/.*\.mdx?$/.test(file)) return false;
  if (path.basename(file).startsWith('_')) return true;
  if (!skillDocs) {
    const skills = path.join(projectDir, '.agents/skills');
    skillDocs = new Set(
      fs.readdirSync(skills).flatMap(skill => {
        const manifest = path.join(skills, skill, 'references.json');
        return fs.existsSync(manifest) ?
            Object.values(JSON.parse(fs.readFileSync(manifest, 'utf8')).docs)
          : [];
      }),
    );
  }
  return skillDocs.has(file.replace(/\.(react|vue)(\.mdx?)$/, '$2'));
}
const isInput = file =>
  isSkillDoc(file) ||
  /^\.agents\/skills\/[^/]+\/(references\.json|SKILL\.md)$/.test(file) ||
  file.startsWith('website/framework-docs/');

// files the branch changes relative to master, plus uncommitted ones when
// the same command commits before pushing (`git commit -am x && git push`)
try {
  const dirty = git('status', '--porcelain', '--untracked-files=all')
    .split('\n')
    .map(line => line.slice(3).replace(/^.* -> /, ''))
    .some(isInput);
  // the generator reads the working tree, so it can only vouch for what's
  // pushed when that includes these edits; otherwise leave it to CI
  if (dirty && !gitCommand('commit').test(command)) process.exit(0);
  const committed = git('diff', '--name-only', 'origin/master...HEAD')
    .split('\n')
    .some(isInput);
  if (!dirty && !committed) process.exit(0);
} catch {
  process.exit(0);
}

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
  '.agents/skills/*/references/*',
);
if (!uncommitted && !problems) process.exit(0);

const message = [
  uncommitted &&
    `Skill references generated from this branch's docs changes aren't committed. Commit them, then push again:\n${uncommitted}`,
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
