/* global require */
// Before an agent runs `git push` (Cursor `beforeShellExecution`, Claude Code
// `PreToolUse` on Bash), regenerates agent skill references and Claude Code's
// copy of the Cursor rules when the branch touches their inputs, runs
// `eslint --fix` on the JS/TS files it changes, and holds the push until the
// result is committed.
// Runs once per push instead of per edit or turn, so any number of local
// commits can come first; CI's `skills` and `agent-rules` checks are the
// backstop.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { projectDir, git, dirtyFiles, eslintFix } = require('./eslint-fix');

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
const commits = gitCommand('commit').test(command);
// `git commit -a` / `-am` / `--all`
const commitsAll =
  commits &&
  /(?:^|[;&|(]\s*)git\b[^;&|]*\scommit\b[^;&|]*\s(?:--all\b|-[A-Za-z]*a)/m.test(
    command,
  );

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
const isSkillInput = file =>
  isSkillDoc(file) ||
  /^\.agents\/skills\/[^/]+\/(references\.json|SKILL\.md)$/.test(file) ||
  file.startsWith('website/framework-docs/');

// files the branch changes relative to master and uncommitted ones; renames
// as delete + add, so the old path counts too
let dirty, committed;
try {
  dirty = dirtyFiles();
  committed = git(
    'diff',
    '--name-only',
    '--no-renames',
    'origin/master...HEAD',
  ).split('\n');
} catch {
  process.exit(0);
}

/**
 * Runs the generator `script` (`yarn build:<check>`, CI check `<check>`) when
 * the branch changes a file `isInput` matches, then reports problems it
 * printed and `outputs` (pathspecs) left uncommitted
 */
function regenerate({ what, from, script, check, isInput, outputs }) {
  const isDirty = dirty.some(isInput);
  // the generator reads the working tree, so it can only vouch for what's
  // pushed when that includes these edits; otherwise leave it to CI
  if (isDirty && !commits) return [];
  if (!isDirty && !committed.some(isInput)) return [];
  let problems = '';
  try {
    execFileSync('node', [script], {
      cwd: projectDir,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (err) {
    problems = String(err.stderr ?? '').trim();
  }
  // includes output generated earlier but never committed
  const uncommitted = git(
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--',
    ...outputs,
  );
  return [
    uncommitted &&
      `${what} generated from this branch's ${from} changes aren't committed. Commit them, then push again:\n${uncommitted}`,
    problems &&
      `\`yarn build:${check}\` found problems the ${check} CI check will fail on. Fix them, commit, then push again:\n${problems}`,
  ];
}

/** `eslint --fix` the JS/TS files this push includes */
function lintFix() {
  // eslint reads the working tree, so lint an uncommitted file only when this
  // command's commit takes all of it: staged with nothing unstaged on top, or
  // any tracked edit with `-a`. Partial staging, untracked files and pathspecs
  // can't be told from here, so those are left alone with the user's WIP
  const committing = new Set(
    commits ?
      git('status', '--porcelain', '--no-renames', '--untracked-files=all')
        .split('\n')
        .filter(
          line =>
            line &&
            !line.startsWith('?') &&
            (commitsAll || (line[0] !== ' ' && line[1] === ' ')),
        )
        .map(line => line.slice(3))
    : [],
  );
  const pushed = [
    ...committed.filter(file => !dirty.includes(file)),
    ...committing,
  ];
  const { fixed } = eslintFix(pushed);
  return fixed.length ?
      [
        `\`eslint --fix\` changed files this push would include. Commit them, then push again:\n${fixed.join('\n')}`,
      ]
    : [];
}

const message = [
  ...lintFix(),
  // dead links, missing variant notes or bad manifests
  ...regenerate({
    what: 'Skill references',
    from: 'docs',
    script: 'website/framework-docs/skillReferences.mjs',
    check: 'skills',
    isInput: isSkillInput,
    outputs: ['.agents/skills/*/references/*'],
  }),
  ...regenerate({
    what: 'Claude Code rules',
    from: 'Cursor rules',
    script: 'scripts/agent-rules.mjs',
    check: 'agent-rules',
    // sources only; a hand edit to the output is left to CI
    isInput: file =>
      /(^|\/)\.cursor\/rules\//.test(file) ||
      file === 'scripts/agent-rules.mjs',
    outputs: [':(glob)**/.claude/rules/**', '.claude/skills'],
  }),
]
  .filter(Boolean)
  .join('\n\n');
if (!message) process.exit(0);
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
