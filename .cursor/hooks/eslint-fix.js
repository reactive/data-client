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

const git = (...args) =>
  execFileSync('git', args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trimEnd();

/** Uncommitted files; renames as delete + add, so the old path counts too */
const dirtyFiles = () =>
  git('status', '--porcelain', '--no-renames', '--untracked-files=all')
    .split('\n')
    .filter(Boolean)
    .map(line => line.slice(3));

/**
 * Fixes the JS/TS `files` that exist; returns whether eslint ran, the ones it
 * changed, the mtime of each fix still on disk, and the errors it couldn't
 * fix, one `file:line:col message (rule)` each
 */
function eslintFix(files) {
  files = files.filter(file => isLintable(file) && mtime(file) !== undefined);
  if (!files.length)
    return { ok: true, fixed: [], fixedMtimes: {}, errors: [] };
  let ok = true;
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
    else ok = false;
  }
  let results = [];
  try {
    results = JSON.parse(report);
  } catch {
    // not eslint's report
  }
  if (!Array.isArray(results)) results = [];
  // git paths use `/`, including on Windows where `path.relative` does not
  const relative = filePath =>
    path.relative(projectDir, filePath).split(path.sep).join('/');
  const fixed = [];
  // mtimes of fixes still on disk. A later edit is left out so it is not
  // stored as already linted.
  const fixedMtimes = {};
  for (const { filePath, output } of results) {
    if (output === undefined) continue;
    const file = relative(filePath);
    fixed.push(file);
    const modified = mtime(file);
    if (modified === undefined) continue;
    try {
      if (fs.readFileSync(path.join(projectDir, file), 'utf8') === output) {
        fixedMtimes[file] = modified;
      }
    } catch {
      // removed while eslint ran
    }
  }
  return {
    // false when eslint crashed or isn't installed
    ok,
    // eslint reports `output` only for files its fixes changed
    fixed,
    fixedMtimes,
    errors: results.flatMap(({ filePath, messages }) =>
      messages
        .filter(({ severity }) => severity === 2)
        .map(
          ({ line, column, message, ruleId }) =>
            `${relative(filePath)}:${line}:${column} ${message}${ruleId ? ` (${ruleId})` : ''}`,
        ),
    ),
  };
}

if (require.main === module) {
  // LAST_RUN's mtime is this run's start, so edits made while eslint runs
  // count next turn. Its contents are mtimes already linted: the mtime seen
  // when a file was chosen, or, when eslint rewrote it, the mtime it left.
  // Statting every chosen file after the run would store an edit that landed
  // during it as already linted.
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
    const mtimes = {};
    const files = dirtyFiles().filter(file => {
      const modified = mtime(file);
      if (!(modified > lastRun && modified !== linted[file])) return false;
      mtimes[file] = modified;
      return true;
    });
    const { ok, fixedMtimes, errors } = eslintFix(files);
    // keep the old marker, so these files are tried again next turn
    if (!ok) process.exit(0);
    Object.assign(mtimes, fixedMtimes);
    fs.mkdirSync(path.dirname(LAST_RUN), { recursive: true });
    fs.writeFileSync(LAST_RUN, JSON.stringify(mtimes));
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

module.exports = { projectDir, git, dirtyFiles, eslintFix };
