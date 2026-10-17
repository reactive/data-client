#!/usr/bin/env node
// Every pending `BREAKING` changeset needs a skill eval naming it, so agents
// trained on the old behavior get the new one right up front. See "Agents
// trained on the old behavior" in .cursor/rules/breaking-changes.mdc.
//
// Usage: node scripts/breaking-evals.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const named = new Set(
  fs.readdirSync(path.join(root, '.agents/skills')).flatMap(skill => {
    const file = `.agents/skills/${skill}/evals/evals.json`;
    if (!fs.existsSync(path.join(root, file))) return [];
    return JSON.parse(read(file))
      .evals.filter(
        ({ changeset, prompt, assertions }) =>
          changeset && prompt && assertions?.length,
      )
      .map(({ changeset }) => changeset);
  }),
);

const missing = fs.readdirSync(path.join(root, '.changeset')).filter(
  file =>
    file.endsWith('.md') &&
    file !== 'README.md' &&
    !named.has(file.slice(0, -3)) &&
    // the body, after the frontmatter
    /^BREAKING( CHANGE)?:/m.test(
      read(`.changeset/${file}`).replace(/^---[^]*?\n---/, ''),
    ),
);

if (missing.length) {
  console.error(
    `These BREAKING changesets need an agent impact review and an eval naming them (\`"changeset": "<name>"\` with a prompt and assertions); see "Agents trained on the old behavior" in .cursor/rules/breaking-changes.mdc:\n${missing.map(file => `.changeset/${file}`).join('\n')}`,
  );
  process.exit(1);
}
