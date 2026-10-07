/* global require */
// Before an agent runs `git push` (Cursor `beforeShellExecution`, Claude Code
// `PreToolUse` on Bash), regenerates agent skill references and Claude Code's
// copy of the Cursor rules when the branch touches their inputs, runs
// `eslint --fix` on the JS/TS files it changes, and holds the push until the
// result is committed.
// Runs once per push instead of per edit or turn, so any number of local
// commits can come first; CI's `regenerate` and `agent-rules` checks are the
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
    // not a commit message mentioning `-a` or `--all`
    command.replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, "''"),
  );

/** Docs some skill renders, and skills another bundles */
let skillDocs, bundledSkills;
function readManifests() {
  const skills = path.join(projectDir, '.agents/skills');
  const manifests = fs
    .readdirSync(skills)
    .map(skill => path.join(skills, skill, 'references.json'))
    .filter(manifest => fs.existsSync(manifest))
    .map(manifest => JSON.parse(fs.readFileSync(manifest, 'utf8')));
  skillDocs = new Set(manifests.flatMap(({ docs }) => Object.values(docs)));
  bundledSkills = new Set(manifests.flatMap(({ skills = [] }) => skills));
}
/** partials (`_foo.mdx`) may be inlined anywhere */
function isSkillDoc(file) {
  if (!/^docs\/.*\.mdx?$/.test(file)) return false;
  if (path.basename(file).startsWith('_')) return true;
  if (!skillDocs) readManifests();
  return skillDocs.has(file.replace(/\.(react|vue)(\.mdx?)$/, '$2'));
}
/** any file of a bundled skill is copied into the skill bundling it */
function isBundledSkillFile(file) {
  const [, skill] = file.match(/^\.agents\/skills\/([^/]+)\//) ?? [];
  if (!skill) return false;
  if (!bundledSkills) readManifests();
  return bundledSkills.has(skill);
}
const isSkillInput = file =>
  isSkillDoc(file) ||
  /^\.agents\/skills\/[^/]+\/(references\.json|SKILL\.md)$/.test(file) ||
  isBundledSkillFile(file) ||
  file.startsWith('website/framework-docs/') ||
  // symlinked into skills that others bundle
  file.startsWith('website/static/codemods/');

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
 * Runs the generator `script` (`yarn build:<check>`) when
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
      `\`yarn build:${check}\` found problems CI will fail on. Fix them, commit, then push again:\n${problems}`,
  ];
}

const PENDING = path.join(projectDir, 'node_modules/.cache/pre-push-fixed');

/** `{ file: blob }` for those of `files` HEAD has */
function headBlobs(files) {
  if (!files.length) return {};
  return Object.fromEntries(
    git('ls-tree', '-z', 'HEAD', '--', ...files)
      .split('\0')
      .filter(Boolean)
      .map(line => {
        const [meta, file] = line.split('\t');
        return [file, meta.split(' ')[2]];
      }),
  );
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
  // fixes an earlier push's run left uncommitted: those files are dirty now,
  // so they aren't linted above, but the push would still go without them.
  // Each is kept with its HEAD blob at the time; once a commit changes that,
  // the fix went in with it
  let pending = {};
  try {
    pending = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
  } catch {
    // none yet
  }
  const blobs = headBlobs([...fixed, ...Object.keys(pending)]);
  const unpushed = Object.fromEntries([
    ...Object.entries(pending).filter(
      ([file, blob]) =>
        blob === (blobs[file] ?? null) &&
        dirty.includes(file) &&
        !committing.has(file),
    ),
    ...fixed.map(file => [file, blobs[file] ?? null]),
  ]);
  try {
    fs.mkdirSync(path.dirname(PENDING), { recursive: true });
    fs.writeFileSync(PENDING, JSON.stringify(unpushed));
  } catch {
    // no install
  }
  // a `git add` earlier in this command can't be told from here, so these
  // are held until a commit has them; the agent then pushes on its own
  const held = Object.keys(unpushed);
  return held.length ?
      [
        `\`eslint --fix\` changed files this push would include. Commit them, then push again:\n${held.join('\n')}`,
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
