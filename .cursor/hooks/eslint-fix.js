/* global require, module */
// `eslint --fix` for agent hooks. Run directly, it's the end-of-turn hook
// (Cursor `stop`, Claude Code `Stop`): fixes every uncommitted JS/TS file at
// once, so edits from the agent and from someone editing alongside it are
// batched into one run per turn instead of one per edit. `pre-push.js` also
// uses it for the files a push includes.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/** Fixes the JS/TS `files` that exist; returns the ones eslint changed */
function eslintFix(projectDir, files) {
  files = files.filter(
    file =>
      /\.[cm]?[jt]sx?$/.test(file) &&
      fs.existsSync(path.join(projectDir, file)),
  );
  if (!files.length) return [];
  const read = file => fs.readFileSync(path.join(projectDir, file), 'utf8');
  const before = files.map(read);
  try {
    execFileSync(
      path.join(projectDir, 'node_modules/.bin/eslint'),
      ['--fix', '--cache', '--no-warn-ignored', '--', ...files],
      { cwd: projectDir, stdio: 'ignore' },
    );
  } catch {
    // unfixable lint errors are left to CI, like a missing install
  }
  return files.filter((file, i) => read(file) !== before[i]);
}
module.exports = { eslintFix };

if (require.main === module) {
  const projectDir =
    process.env.CURSOR_PROJECT_DIR ||
    process.env.CLAUDE_PROJECT_DIR ||
    process.cwd();
  try {
    const dirty = execFileSync(
      'git',
      ['status', '--porcelain', '--no-renames', '--untracked-files=all'],
      {
        cwd: projectDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    )
      .split('\n')
      .filter(Boolean)
      .map(line => line.slice(3));
    eslintFix(projectDir, dirty);
  } catch {
    // not a git checkout
  }
}
