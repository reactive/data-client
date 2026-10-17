/* global require, __dirname */
// `node --test '.cursor/hooks/*.test.js'`
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const { test } = require('node:test');
const os = require('os');
const path = require('path');

const hook = path.join(__dirname, 'pre-push.js');

// "fixes" every file it's given
const fakeEslint = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const targets = process.argv.slice(process.argv.indexOf('--') + 1);
const results = targets.map(file => {
  const filePath = path.resolve(process.cwd(), file);
  const output = fs.readFileSync(filePath, 'utf8') + '// fix\\n';
  fs.writeFileSync(filePath, output);
  return { filePath, messages: [], output };
});
process.stdout.write(JSON.stringify(results));
`;

function withRepo(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-push-'));
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  try {
    git('init', '-b', 'main');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'test');
    const bin = path.join(root, 'node_modules', '.bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(path.join(bin, 'eslint'), fakeEslint, { mode: 0o755 });
    fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n');
    fn(root, git);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, file, content = 'const n = 1;\n') {
  const abs = path.join(root, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

/** the reason the hook denies `git push`, if it does */
function push(root, command = 'git push') {
  const out = execFileSync(process.execPath, [hook], {
    cwd: root,
    env: { ...process.env, CURSOR_PROJECT_DIR: root },
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_input: { command },
    }),
    encoding: 'utf8',
  });
  return out && JSON.parse(out).hookSpecificOutput.permissionDecisionReason;
}

const held =
  '`eslint --fix` changed files this push would include. Commit them, then push again:\nsrc/changed.ts';

/** master tracks src/generated.ts; then it's untracked and ignored, but
 * still generated on disk, and src/changed.ts is added */
function untrackGenerated(root, git) {
  write(root, 'src/generated.ts');
  git('add', '-A');
  git('commit', '-m', 'master');
  git('update-ref', 'refs/remotes/origin/master', 'HEAD');
  git('rm', '--cached', 'src/generated.ts');
  fs.appendFileSync(path.join(root, '.gitignore'), 'src/generated.ts\n');
  write(root, 'src/changed.ts');
  git('add', '-A');
}

test('an ignored file the branch stops tracking is not linted', () => {
  withRepo((root, git) => {
    untrackGenerated(root, git);
    git('commit', '-m', 'branch');
    assert.equal(push(root), held);
  });
});

test('an ignored file the push commits untracking is not linted', () => {
  withRepo((root, git) => {
    untrackGenerated(root, git);
    assert.equal(push(root, 'git commit -m branch && git push'), held);
  });
});

test('a pending fix to a file the push deletes does not hold it', () => {
  withRepo((root, git) => {
    write(root, 'src/fixed.ts');
    git('add', '-A');
    git('commit', '-m', 'master');
    git('update-ref', 'refs/remotes/origin/master', 'HEAD');
    fs.appendFileSync(path.join(root, 'src/fixed.ts'), 'edit;\n');
    git('commit', '-am', 'branch');
    assert.match(push(root), /src\/fixed\.ts/);
    git('rm', '-f', 'src/fixed.ts');
    assert.equal(push(root, 'git commit -m delete && git push'), '');
  });
});

/** master has the checker; the branch adds a `BREAKING` changeset */
function breakingBranch(root, git) {
  write(
    root,
    'scripts/breaking-evals.mjs',
    fs.readFileSync(path.join(__dirname, '../../scripts/breaking-evals.mjs')),
  );
  fs.mkdirSync(path.join(root, '.agents/skills/demo'), { recursive: true });
  git('add', '-A');
  git('commit', '-m', 'master');
  git('update-ref', 'refs/remotes/origin/master', 'HEAD');
  write(
    root,
    '.changeset/drop-old.md',
    "---\n'@data-client/core': minor\n---\n\nBREAKING: Remove `old()`\n",
  );
  git('add', '-A');
  git('commit', '-m', 'branch');
}

test('a breaking changeset without an eval holds the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    assert.match(
      push(root),
      /breaking-changes\.mdc[^]*\.changeset\/drop-old\.md/,
    );
  });
});

test('a breaking changeset an eval names does not hold the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    const evals = [
      { id: 1, changeset: 'drop-old', prompt: 'p', assertions: ['a'] },
    ];
    write(
      root,
      '.agents/skills/demo/evals/evals.json',
      JSON.stringify({ evals }),
    );
    git('add', '-A');
    assert.equal(push(root, 'git commit -m evals && git push'), '');
  });
});

test('a changeset that only mentions breaking does not hold the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    fs.writeFileSync(
      path.join(root, '.changeset/drop-old.md'),
      "---\n'@data-client/core': patch\n---\n\nFix `old()`; a future BREAKING release removes it\n",
    );
    git('commit', '-am', 'not breaking');
    assert.equal(push(root), '');
  });
});
