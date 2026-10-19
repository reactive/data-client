// The Cursor manifests are written by cursor.mjs. This checks the
// committed files still install: node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = file =>
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

const marketplace = readJSON('.cursor-plugin/marketplace.json');
const pluginRoot = path.join(root, '.agents/skills');
const manifest = readJSON('.agents/skills/.cursor-plugin/plugin.json');

test('marketplace pins master so /add-plugin does not look up main', () => {
  assert.equal(marketplace.plugins.length, 1);
  const [entry] = marketplace.plugins;
  assert.equal(entry.name, 'data-client');
  assert.equal(entry.name, manifest.name);
  // A relative source has no ref. Cursor then runs git ls-remote for "main",
  // and this repo has no main branch.
  assert.deepEqual(entry.source, {
    source: 'git-subdir',
    url: 'https://github.com/reactive/data-client.git',
    path: '.agents/skills',
    ref: 'master',
  });
});

test('plugin skills are the two entry skills, each a directory with SKILL.md', () => {
  assert.deepEqual(manifest.skills, ['./data-client', './data-client-setup']);
  for (const skill of manifest.skills) {
    assert.equal(skill.includes('..'), false, skill);
    const dir = path.join(pluginRoot, skill);
    const text = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
    const name = /^name:\s*(\S+)/m.exec(text)[1];
    assert.equal(name, path.basename(skill));
  }
  // the router reads the setup skill by relative path; it is not auto-invoked
  const router = fs.readFileSync(
    path.join(pluginRoot, 'data-client/SKILL.md'),
    'utf8',
  );
  assert.match(router, /\.\.\/data-client-setup\/SKILL\.md/);
  const setup = fs.readFileSync(
    path.join(pluginRoot, 'data-client-setup/SKILL.md'),
    'utf8',
  );
  assert.match(setup, /disable-model-invocation:\s*true/);
});

test('logo stays inside the plugin directory', () => {
  assert.equal(manifest.logo, 'assets/logo.svg');
  assert.equal(manifest.logo.includes('..'), false);
  assert.ok(fs.existsSync(path.join(pluginRoot, manifest.logo)));
});
