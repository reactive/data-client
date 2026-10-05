/* global require, module */
// `eslint --fix` for agent hooks. Run directly, it's the end-of-turn hook
// (Cursor `stop`, Claude Code `Stop`): fixes the uncommitted JS/TS files
// changed since eslint last ran, so edits from the agent and from someone
// editing alongside it are batched into one run per turn instead of one per
// edit, and a turn that changed none skips eslint. `pre-push.js` also uses it
// for the files a push includes.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir =
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();
const CACHE = path.join(projectDir, '.eslintcache');
const isLintable = file => /\.[cm]?[jt]sx?$/.test(file);
const mtime = file =>
  fs.statSync(path.join(projectDir, file), { throwIfNoEntry: false })?.mtimeMs;

/** Uncommitted files; renames as delete + add, so the old path counts too */
const dirtyFiles = () =>
  execFileSync(
    'git',
    ['status', '--porcelain', '--no-renames', '--untracked-files=all'],
    { cwd: projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
    .split('\n')
    .filter(Boolean)
    .map(line => line.slice(3));

/** Fixes the JS/TS `files` that exist; returns the ones eslint changed */
function eslintFix(files) {
  files = files.filter(file => isLintable(file) && mtime(file) !== undefined);
  if (!files.length) return [];
  const read = file => fs.readFileSync(path.join(projectDir, file), 'utf8');
  const before = files.map(read);
  try {
    execFileSync(
      path.join(projectDir, 'node_modules/.bin/eslint'),
      [
        '--fix',
        '--cache',
        '--cache-location',
        CACHE,
        '--no-warn-ignored',
        '--',
        ...files,
      ],
      { cwd: projectDir, stdio: 'ignore' },
    );
  } catch {
    // unfixable lint errors are left to CI, like a missing install
  }
  return files.filter((file, i) => read(file) !== before[i]);
}

if (require.main === module) {
  try {
    // eslint rewrites its cache on every run, so older files were already fixed
    const lastRun = fs.statSync(CACHE, { throwIfNoEntry: false })?.mtimeMs ?? 0;
    eslintFix(dirtyFiles().filter(file => mtime(file) > lastRun));
  } catch {
    // not a git checkout
  }
}

module.exports = { projectDir, dirtyFiles, eslintFix };
