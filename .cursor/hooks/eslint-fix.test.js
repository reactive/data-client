/* global require */
// `node --test .cursor/hooks/eslint-fix.test.js`
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const { test } = require('node:test');
const os = require('os');
const path = require('path');

const hook = path.join(__dirname, 'eslint-fix.js');
const future = new Date('2030-01-01T00:00:00Z');

const fakeEslint = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sep = process.argv.indexOf('--');
const targets = sep === -1 ? [] : process.argv.slice(sep + 1);
const log = path.join(process.cwd(), 'invocations.json');
const prev = fs.existsSync(log) ? JSON.parse(fs.readFileSync(log, 'utf8')) : [];
prev.push(targets);
fs.writeFileSync(log, JSON.stringify(prev));
const mode = JSON.parse(process.env.ESLINT_FAKE || '{}');
const when = new Date('2030-01-01T00:00:00Z');
const results = targets.map(file => {
  const filePath = path.resolve(process.cwd(), file);
  const action = mode[file];
  const result = { filePath, messages: [], errorCount: 0, warningCount: 0 };
  if (action === 'human' || action === 'fix' || action === 'fix-then-human') {
    const original = fs.readFileSync(filePath, 'utf8');
    const fixed = original + '\\n// fix\\n';
    if (action === 'human') {
      fs.writeFileSync(filePath, original + '// human\\n');
    } else if (action === 'fix') {
      fs.writeFileSync(filePath, fixed);
      result.output = fixed;
    } else {
      fs.writeFileSync(filePath, fixed + '// human\\n');
      result.output = fixed;
    }
    fs.utimesSync(filePath, when, when);
  }
  return result;
});
process.stdout.write(JSON.stringify(results));
`;

function withRepo(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eslint-fix-'));
  try {
    execFileSync('git', ['init', '-b', 'main'], { cwd: root, stdio: 'ignore' });
    const bin = path.join(root, 'node_modules', '.bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(path.join(bin, 'eslint'), fakeEslint, { mode: 0o755 });
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, file) {
  const abs = path.join(root, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, 'const n = 1;\n');
}

const mtime = (root, file) => fs.statSync(path.join(root, file)).mtimeMs;
const marker = root =>
  path.join(root, 'node_modules/.cache/eslint-fix-last-run');
const linted = root => JSON.parse(fs.readFileSync(marker(root), 'utf8'));
const invocations = root =>
  JSON.parse(fs.readFileSync(path.join(root, 'invocations.json'), 'utf8'));

function run(root, fake = {}) {
  execFileSync(process.execPath, [hook], {
    cwd: root,
    env: {
      ...process.env,
      CURSOR_PROJECT_DIR: root,
      ESLINT_FAKE: JSON.stringify(fake),
    },
    input: '{}',
    encoding: 'utf8',
  });
}

test('an edit that lands during eslint is linted next turn', () => {
  withRepo(root => {
    write(root, 'src/edited.js');
    write(root, 'src/fixed.js');
    const editedBefore = mtime(root, 'src/edited.js');
    run(root, { 'src/edited.js': 'human', 'src/fixed.js': 'fix' });
    const stored = linted(root);
    // the human edit's mtime must not be the one recorded as already linted
    assert.equal(stored['src/edited.js'], editedBefore);
    assert.notEqual(mtime(root, 'src/edited.js'), editedBefore);
    // eslint's own rewrite is remembered, so the next turn skips it
    assert.equal(stored['src/fixed.js'], mtime(root, 'src/fixed.js'));
    run(root, {});
    const calls = invocations(root);
    assert.deepEqual(calls[0].slice().sort(), [
      'src/edited.js',
      'src/fixed.js',
    ]);
    assert.deepEqual(calls[1], ['src/edited.js']);
  });
});

test('an edit after eslint rewrites a chosen file is linted next turn', () => {
  withRepo(root => {
    write(root, 'src/both.js');
    const before = mtime(root, 'src/both.js');
    run(root, { 'src/both.js': 'fix-then-human' });
    assert.equal(linted(root)['src/both.js'], before);
    run(root, {});
    assert.deepEqual(invocations(root)[1], ['src/both.js']);
  });
});

test('a file linted with a mtime after the run start is not linted again', () => {
  withRepo(root => {
    write(root, 'src/fresh.js');
    fs.utimesSync(path.join(root, 'src/fresh.js'), future, future);
    const stamped = mtime(root, 'src/fresh.js');
    run(root, {});
    assert.equal(linted(root)['src/fresh.js'], stamped);
    run(root, {});
    assert.equal(invocations(root).length, 1);
  });
});

test('an edit after the run is linted on the next turn', () => {
  withRepo(root => {
    write(root, 'src/quiet.js');
    run(root, {});
    fs.utimesSync(path.join(root, 'src/quiet.js'), future, future);
    run(root, {});
    assert.equal(invocations(root).length, 2);
  });
});
