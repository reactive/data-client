// Keeps the setup commands the READMEs copy in step with the site's:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  claudePluginCommand,
  claudeSetupPrompt,
  codexPluginCommand,
  codexSetupPrompt,
  cursorPluginCommand,
  cursorSetupPrompt,
  setupCommand,
} from '../website/framework-docs/skillCommands.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readmes = {
  'README.md': 'react',
  'packages/react/README.md': 'react',
  'packages/vue/README.md': 'vue',
};

for (const [file, framework] of Object.entries(readmes)) {
  test(`${file} setup commands match skillCommands.mjs`, () => {
    const readme = fs.readFileSync(path.join(root, file), 'utf8');
    for (const command of [
      claudePluginCommand,
      claudeSetupPrompt(framework),
      cursorPluginCommand,
      cursorSetupPrompt(framework),
      codexPluginCommand,
      codexSetupPrompt(framework),
      setupCommand,
    ])
      assert.ok(readme.includes(command), command);
  });
}
