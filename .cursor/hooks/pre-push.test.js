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
function push(root, command = 'git push', env = {}) {
  const out = execFileSync(process.execPath, [hook], {
    cwd: root,
    env: { ...process.env, CURSOR_PROJECT_DIR: root, ...env },
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_input: { command },
    }),
    encoding: 'utf8',
  });
  return out && JSON.parse(out).hookSpecificOutput.permissionDecisionReason;
}

/** commits the working tree as master */
function commitMaster(git) {
  git('add', '-A');
  git('commit', '-m', 'master');
  git('update-ref', 'refs/remotes/origin/master', 'HEAD');
}

const held =
  '`eslint --fix` changed files this push would include. Commit them, then push again:\nsrc/changed.ts';

/** master tracks src/generated.ts; then it's untracked and ignored, but
 * still generated on disk, and src/changed.ts is added */
function untrackGenerated(root, git) {
  write(root, 'src/generated.ts');
  commitMaster(git);
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
    commitMaster(git);
    fs.appendFileSync(path.join(root, 'src/fixed.ts'), 'edit;\n');
    git('commit', '-am', 'branch');
    assert.match(push(root), /src\/fixed\.ts/);
    git('rm', '-f', 'src/fixed.ts');
    assert.equal(push(root, 'git commit -m delete && git push'), '');
  });
});

/** master has the checker; the branch adds a breaking (minor) changeset */
function breakingBranch(root, git) {
  write(
    root,
    'scripts/breaking-evals.mjs',
    fs.readFileSync(path.join(__dirname, '../../scripts/breaking-evals.mjs')),
  );
  fs.mkdirSync(path.join(root, '.agents/skills/demo'), { recursive: true });
  commitMaster(git);
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

test('a major bump holds the push; a patch bump does not', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    for (const [bump, held] of [
      ['major', true],
      ['patch', false],
    ]) {
      fs.writeFileSync(
        path.join(root, '.changeset/drop-old.md'),
        `---\n'@data-client/core': ${bump}\n---\n\nChange \`old()\`\n`,
      );
      git('commit', '-am', bump);
      if (held) assert.match(push(root), /\.changeset\/drop-old\.md/);
      else assert.equal(push(root), '');
    }
  });
});

test('a breaking changeset with no agent impact does not hold the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    write(
      root,
      '.agents/skills/changeset/no-agent-impact.json',
      JSON.stringify({ 'drop-old': 'no agent calls old()' }),
    );
    git('add', '-A');
    assert.equal(push(root, 'git commit -m exempt && git push'), '');
  });
});

test('an eval without a real prompt or assertions holds the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    for (const [i, fields] of [
      { assertions: [] },
      { prompt: '  ', assertions: ['a'] },
      { prompt: 5, assertions: ['a'] },
      { prompt: 'p', assertions: 'not an array' },
      { prompt: 'p', assertions: [''] },
    ].entries()) {
      const evals = [{ id: 1, changeset: 'drop-old', ...fields }];
      write(
        root,
        '.agents/skills/demo/evals/evals.json',
        JSON.stringify({ evals }),
      );
      git('add', '-A');
      assert.match(
        push(root, `git commit -m evals${i} && git push`),
        /\.changeset\/drop-old\.md/,
      );
    }
  });
});

test('a branch from before the checker does not hold the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    git('rm', '-q', 'scripts/breaking-evals.mjs');
    git('commit', '-m', 'old branch');
    assert.equal(push(root), '');
  });
});

test('a blank no-agent-impact reason holds the push', () => {
  withRepo((root, git) => {
    breakingBranch(root, git);
    write(
      root,
      '.agents/skills/changeset/no-agent-impact.json',
      JSON.stringify({ 'drop-old': '  ' }),
    );
    git('add', '-A');
    assert.match(
      push(root, 'git commit -m exempt && git push'),
      /\.changeset\/drop-old\.md/,
    );
  });
});

/** a branch editing a skill; the generator is a no-op stub */
function skillBranch(root, git, skillMd) {
  write(root, 'website/framework-docs/skillReferences.mjs', '');
  write(root, '.agents/skills/a/SKILL.md', 'old\n');
  commitMaster(git);
  write(root, '.agents/skills/a/SKILL.md', skillMd);
}

test('a hand-written SKILL.md committed with the push does not hold it', () => {
  withRepo((root, git) => {
    skillBranch(root, git, 'new\n');
    assert.equal(push(root, 'git commit -am edit && git push'), '');
  });
});

test('an uncommitted generated SKILL.md holds the push', () => {
  withRepo((root, git) => {
    skillBranch(
      root,
      git,
      '<!-- Generated by `yarn build:skills` from src.md. -->\nnew\n',
    );
    assert.match(
      push(root, 'git commit -am edit && git push'),
      /aren't committed[\s\S]*\.agents\/skills\/a\/SKILL\.md/,
    );
  });
});

test('deleting a hand-written SKILL.md does not hold the push', () => {
  withRepo((root, git) => {
    skillBranch(root, git, 'new\n');
    fs.rmSync(path.join(root, '.agents/skills/a/SKILL.md'));
    assert.equal(push(root, 'git commit -am del && git push'), '');
  });
});

test('a generated SKILL.md the generator deleted holds the push', () => {
  withRepo((root, git) => {
    skillBranch(
      root,
      git,
      '<!-- Generated by `yarn build:skills` from src.md. -->\nnew\n',
    );
    git('commit', '-am', 'generated');
    fs.rmSync(path.join(root, '.agents/skills/a/SKILL.md'));
    assert.match(
      push(root, 'git commit -m x --allow-empty && git push'),
      /aren't committed[\s\S]*\.agents\/skills\/a\/SKILL\.md/,
    );
  });
});

test('pushes anywhere in the command are checked', () => {
  withRepo((root, git) => {
    untrackGenerated(root, git);
    git('commit', '-m', 'branch');
    for (const command of [
      'for i in 1 2 3 4; do git push -u origin b && break; sleep 2; done',
      'timeout 60 git push',
      'GIT_TERMINAL_PROMPT=0 git push',
      'if ! git push; then sleep 2; fi',
    ]) {
      assert.equal(push(root, command), held, command);
    }
    for (const command of ['git stash push', 'git commit -m "then git push"']) {
      assert.equal(push(root, command), '', command);
    }
  });
});

/** a branch changing a package; `yarn copy:websitetypes` is a stub that
 * copies the package source's first line (not the fake eslint's) to the
 * editor types */
function typesBranch(root, git) {
  write(root, 'scripts/copywebsitetypes.sh', '');
  write(root, 'packages/core/src/index.ts', '1\n');
  write(root, 'website/src/components/Playground/editor-types/core.d.ts', '');
  commitMaster(git);
  const bin = path.join(root, 'node_modules', '.fake-bin');
  write(
    root,
    'node_modules/.fake-bin/yarn',
    `#!/bin/sh\nhead -n 1 packages/core/src/index.ts > website/src/components/Playground/editor-types/core.d.ts\n`,
  );
  fs.chmodSync(path.join(bin, 'yarn'), 0o755);
  return { PATH: `${bin}${path.delimiter}${process.env.PATH}` };
}

const typesHeld = /Playground editor types[^]*editor-types\/core\.d\.ts/;

test('uncommitted editor types from a package change hold the push', () => {
  withRepo((root, git) => {
    const env = typesBranch(root, git);
    write(root, 'packages/core/src/index.ts', '2\n');
    assert.match(push(root, 'git commit -am edit && git push', env), typesHeld);
  });
});

test('editor types committed with the package change do not hold the push', () => {
  withRepo((root, git) => {
    const env = typesBranch(root, git);
    write(root, 'packages/core/src/index.ts', '2\n');
    git('commit', '-am', 'edit');
    write(
      root,
      'website/src/components/Playground/editor-types/core.d.ts',
      '2\n',
    );
    git('commit', '-am', 'types');
    assert.doesNotMatch(push(root, 'git push', env), typesHeld);
  });
});

test('package tests do not regenerate editor types', () => {
  withRepo((root, git) => {
    const env = typesBranch(root, git);
    write(root, 'packages/core/src/__tests__/a.ts', '');
    git('add', '-A');
    git('commit', '-m', 't');
    // the stub would write index.ts's `1` to the empty core.d.ts if it ran
    assert.doesNotMatch(push(root, 'git push', env), typesHeld);
  });
});

test('a tsconfig change regenerates editor types', () => {
  withRepo((root, git) => {
    const env = typesBranch(root, git);
    write(root, 'packages/core/tsconfig.json', '{}\n');
    git('add', '-A');
    git('commit', '-m', 'tsconfig');
    assert.match(push(root, 'git push', env), typesHeld);
  });
});

test('a generator that fails with no output holds the push', () => {
  withRepo((root, git) => {
    const env = typesBranch(root, git);
    write(root, 'node_modules/.fake-bin/yarn', '#!/bin/sh\nexit 1\n');
    write(root, 'packages/core/tsconfig.json', '{}\n');
    git('add', '-A');
    git('commit', '-m', 'tsconfig');
    assert.match(
      push(root, 'git push', env),
      /`yarn copy:websitetypes` found problems[^]*Command failed/,
    );
  });
});
