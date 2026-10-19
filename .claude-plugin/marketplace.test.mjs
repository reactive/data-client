// Keeps marketplace.json consistent with the repo it publishes from:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = file =>
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const { plugins } = readJSON('.claude-plugin/marketplace.json');
const main = plugins.find(plugin => plugin.name === 'data-client');

test('old plugin names stay copies of data-client', () => {
  // so existing installs keep updating; plans/next-breaking-release.md removes them
  const body = plugin =>
    JSON.stringify({ ...plugin, name: undefined, description: undefined });
  for (const plugin of plugins) assert.equal(body(plugin), body(main));
});

test('plugin skills exist and ship in a package', () => {
  // the hook falls back to the plugin's copy of a package's skills
  const owned = Object.values(readJSON('.agents/skill-packages.json')).flat();
  for (const skill of main.skills) {
    assert.ok(fs.existsSync(path.join(root, skill, 'SKILL.md')), skill);
    assert.ok(owned.includes(path.basename(skill)), skill);
  }
});

test('hook commands run files in this directory', () => {
  for (const { hooks } of Object.values(main.hooks).flat()) {
    for (const { command } of hooks) {
      const [, file] = /\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)/.exec(command);
      assert.ok(file.startsWith('.claude-plugin/'), command);
      assert.ok(fs.existsSync(path.join(root, file)), command);
    }
  }
});
