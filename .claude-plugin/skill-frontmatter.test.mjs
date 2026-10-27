// Keeps every skill's top-level frontmatter values valid YAML: `npx skills add` parses it strictly
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
    const match = fs
      .readFileSync(file, 'utf8')
      .match(/^---\r?\n([^]*?)\r?\n---\r?\n/);
    assert.ok(match, `${skill}: frontmatter must open the file and close`);
    for (const line of match[1].split(/\r?\n/)) {
      const [, key, value] = line.match(/^(\w[\w-]*): (.*)$/) ?? [];
      // a plain (unquoted) scalar can't start with an indicator like `@`, and
      // `: ` (or a trailing `:`) starts a mapping and ` #` a comment
      if (value && !/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[>|]-?)$/.test(value))
        assert.doesNotMatch(
          value,
          /^[-?:,[\]{}#&*!|>'"%@`]|: | #|:$/,
          `${skill} ${key}: quote it`,
        );
    }
  }
});
