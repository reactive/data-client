/* global require, module */
// `eslint --fix` for agent hooks. Run directly, it's the end-of-turn hook
// (Cursor `stop`, Claude Code `Stop`): fixes the uncommitted JS/TS files
// changed since this hook last ran, so edits from the agent and from someone
// editing alongside it are batched into one run per turn instead of one per
// edit, and a turn that changed none skips eslint. Errors eslint can't fix go
// back to the agent once per turn (not after a Cursor abort). `pre-push.js` also uses it
// for the files a push includes.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir =
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();
const CACHE = path.join(projectDir, '.eslintcache');
// written only by the end-of-turn run, unlike eslint's cache, which pre-push
// and other `eslint --cache` runs also touch
const LAST_RUN = path.join(
  projectDir,
  'node_modules/.cache/eslint-fix-last-run',
);
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

/**
 * Fixes the JS/TS `files` that exist; returns the ones eslint changed and the
 * errors it couldn't fix, one `file:line:col message (rule)` each
 */
function eslintFix(files) {
  files = files.filter(file => isLintable(file) && mtime(file) !== undefined);
  if (!files.length) return { fixed: [], errors: [] };
  const read = file => fs.readFileSync(path.join(projectDir, file), 'utf8');
  const before = files.map(read);
  let report = '[]';
  try {
    report = execFileSync(
      path.join(projectDir, 'node_modules/.bin/eslint'),
      [
        '--fix',
        '--cache',
        '--cache-location',
        CACHE,
        '--no-warn-ignored',
        '--format',
        'json',
        '--',
        ...files,
      ],
      {
        cwd: projectDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 64 * 1024 * 1024,
      },
    );
  } catch (err) {
    // exit 1 means lint errors are left; a crash or missing install is left
    // to CI
    if (err.status === 1) report = err.stdout;
  }
  let errors = [];
  try {
    errors = JSON.parse(report).flatMap(({ filePath, messages }) =>
      messages
        .filter(({ severity }) => severity === 2)
        .map(
          ({ line, column, message, ruleId }) =>
            `${path.relative(projectDir, filePath)}:${line}:${column} ${message}${ruleId ? ` (${ruleId})` : ''}`,
        ),
    );
  } catch {
    // not eslint's report
  }
  return {
    fixed: files.filter((file, i) => read(file) !== before[i]),
    errors,
  };
}

if (require.main === module) {
  // stamped with the start time, so edits made while eslint runs count next
  // turn; holds the mtimes eslint left, so its own fixes don't
  const start = new Date();
  let payload = {};
  try {
    payload = JSON.parse(
      (!process.stdin.isTTY && fs.readFileSync(0, 'utf8')) || '{}',
    );
  } catch {
    // run by hand
  }
  try {
    const lastRun =
      fs.statSync(LAST_RUN, { throwIfNoEntry: false })?.mtimeMs ?? 0;
    let linted = {};
    try {
      linted = JSON.parse(fs.readFileSync(LAST_RUN, 'utf8'));
    } catch {
      // first run
    }
    const files = dirtyFiles().filter(
      file => mtime(file) > lastRun && mtime(file) !== linted[file],
    );
    const { errors } = eslintFix(files);
    fs.mkdirSync(path.dirname(LAST_RUN), { recursive: true });
    fs.writeFileSync(
      LAST_RUN,
      JSON.stringify(
        Object.fromEntries(files.map(file => [file, mtime(file)])),
      ),
    );
    fs.utimesSync(LAST_RUN, start, start);
    // hand errors eslint can't fix back to the agent once per turn, so it
    // fixes them before finishing; the files it edits get linted again on
    // its next stop, which reports nothing more
    const followUp =
      payload.stop_hook_active ||
      payload.loop_count > 0 ||
      (payload.status && payload.status !== 'completed');
    if (errors.length && !followUp) {
      const message = `ESLint found errors it couldn't fix in uncommitted files. Fix the ones in files you edited, and leave the rest to whoever is editing them:\n${errors.slice(0, 50).join('\n')}${errors.length > 50 ? `\n…and ${errors.length - 50} more` : ''}`;
      console.log(
        JSON.stringify(
          payload.hook_event_name === 'Stop' ?
            { decision: 'block', reason: message }
          : { followup_message: message },
        ),
      );
    }
  } catch {
    // not a git checkout
  }
}

module.exports = { projectDir, dirtyFiles, eslintFix };
