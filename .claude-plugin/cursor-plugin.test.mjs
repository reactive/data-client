// The Cursor manifests are written by cursor.mjs, and marketplace.test.mjs
// checks they match it. This checks what they point at still installs:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { root } from './cursor.mjs';

const pluginRoot = path.join(root, '.agents/skills');
const manifest = JSON.parse(
  fs.readFileSync(path.join(pluginRoot, '.cursor-plugin/plugin.json'), 'utf8'),
);
const read = file => fs.readFileSync(path.join(pluginRoot, file), 'utf8');

test('plugin skills are directories inside the plugin, named by SKILL.md', () => {
  for (const skill of manifest.skills) {
    assert.equal(skill.includes('..'), false, skill);
    const name = /^name:\s*(\S+)/m.exec(read(`${skill}/SKILL.md`))[1];
    assert.equal(name, path.basename(skill));
  }
  // the router reads the setup skill by relative path; it is not auto-invoked
  assert.match(
    read('data-client/SKILL.md'),
    /\.\.\/data-client-setup\/SKILL\.md/,
  );
  assert.match(
    read('data-client-setup/SKILL.md'),
    /disable-model-invocation:\s*true/,
  );
});

test('logo stays inside the plugin directory', () => {
  assert.equal(manifest.logo.includes('..'), false);
  assert.ok(fs.existsSync(path.join(pluginRoot, manifest.logo)));
});
