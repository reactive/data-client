// Keeps every skill's frontmatter valid YAML: `npx skills add` parses it strictly
// and skips a skill it can't parse, with only a warning:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { root } from './plugin-dir.mjs';

const skills = path.join(root, '.agents/skills');

test('skill frontmatter values that need quotes have them', () => {
  for (const skill of fs.readdirSync(skills)) {
    const file = path.join(skills, skill, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const [, frontmatter] = fs.readFileSync(file, 'utf8').split('---\n');
    for (const line of frontmatter.split('\n')) {
      const [, key, value] = line.match(/^(\w[\w-]*): (.*)$/) ?? [];
      // in a plain (unquoted) scalar, `: ` starts a mapping and ` #` a comment
      if (value && !/^["'>|]/.test(value))
        assert.doesNotMatch(value, /: | #/, `${skill} ${key}: quote it`);
    }
  }
});
