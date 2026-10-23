// Keeps the setup commands the READMEs copy in step with the site's:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  linkCommand,
  setupCommand,
} from '../website/framework-docs/skillCommands.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readmes = [
  'README.md',
  'packages/react/README.md',
  'packages/vue/README.md',
];

for (const file of readmes) {
  test(`${file} setup commands match skillCommands.mjs`, () => {
    const readme = fs.readFileSync(path.join(root, file), 'utf8');
    for (const command of [setupCommand, linkCommand])
      assert.ok(readme.includes(command), command);
  });
}
