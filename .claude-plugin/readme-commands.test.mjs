// Keeps the setup commands the READMEs and AgentPrompt copy in step with skillCommands.mjs:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { root } from './cursor.mjs';
import {
  claudePluginCommand,
  claudeSetupPrompt,
  codexPluginCommand,
  codexSetupPrompt,
  cursorPluginCommand,
  cursorSetupPrompt,
  setupCommand,
  setupPrompt,
} from '../website/framework-docs/skillCommands.mjs';

const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// READMEs with the full agent setup: the prompt and each agent's plugin
for (const [file, framework] of Object.entries({
  'README.md': 'react',
  'packages/react/README.md': 'react',
  'packages/vue/README.md': 'vue',
})) {
  test(`${file} setup commands match skillCommands.mjs`, () => {
    const readme = read(file);
    for (const command of [
      setupPrompt(framework),
      claudePluginCommand,
      claudeSetupPrompt(framework),
      cursorPluginCommand,
      cursorSetupPrompt(framework),
      codexPluginCommand,
      codexSetupPrompt(framework),
    ])
      assert.ok(readme.includes(command), command);
  });
}

// protocol READMEs carry only the prompt
for (const pkg of ['rest', 'graphql', 'endpoint']) {
  test(`packages/${pkg}/README.md setup prompt matches skillCommands.mjs`, () => {
    assert.ok(read(`packages/${pkg}/README.md`).includes(setupPrompt(pkg)));
  });
}

test("AgentPrompt's default prompt matches setupPrompt", () => {
  // its translate() literal can't import setupPrompt (i18n extraction needs a literal)
  const message = setupPrompt('{framework}').replace(setupCommand, '{command}');
  assert.ok(
    read('website/src/components/AgentPrompt.tsx').includes(`'${message}'`),
    message,
  );
});
