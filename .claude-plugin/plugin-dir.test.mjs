// The plugin directory's manifests are written by plugin-dir.mjs, and
// marketplace.test.mjs checks they match it. This checks what they point at
// still installs:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { root } from './plugin-dir.mjs';

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
  const { icon } = JSON.parse(read('.claude-plugin/plugin.json'));
  for (const file of [manifest.logo, icon]) {
    assert.equal(file.includes('..'), false, file);
    assert.ok(fs.existsSync(path.join(pluginRoot, file)), file);
  }
});

test('README is long enough for the Claude directory listing', () => {
  // the directory shows it as the description and blocks under 40 words,
  // not counting code blocks
  const prose = read('README.md').replace(/```[\s\S]*?```/g, '');
  assert.ok(prose.split(/\s+/).filter(Boolean).length >= 40);
});
