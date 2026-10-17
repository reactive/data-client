#!/usr/bin/env node
// Every pending `BREAKING` changeset needs a skill eval naming it, so agents
// trained on the old behavior get the new one right up front, or a reason in
// no-agent-impact.json why no realistic agent task hits it. See "Agents
// trained on the old behavior" in .cursor/rules/breaking-changes.mdc.
//
// Usage: node scripts/breaking-evals.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file =>
  fs.existsSync(path.join(root, file)) ? JSON.parse(read(file)) : undefined;

// changesets the impact review found no realistic agent task for, with why
const exemptions =
  readJson('.agents/skills/changeset/no-agent-impact.json') ?? {};
const changesetsWithEvals = new Set(
  fs.readdirSync(path.join(root, '.agents/skills')).flatMap(skill => {
    const evals = readJson(`.agents/skills/${skill}/evals/evals.json`);
    return (evals?.evals ?? [])
      .filter(
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
    !changesetsWithEvals.has(file.slice(0, -3)) &&
    !Object.hasOwn(exemptions, file.slice(0, -3)) &&
    // the body, after the frontmatter
    /^[^\w\n]*BREAKING( CHANGE)?[^\w\n]*:/m.test(
      read(`.changeset/${file}`).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ''),
    ),
);

if (missing.length) {
  console.error(
    `These BREAKING changesets need an agent impact review, then an eval naming them (\`"changeset": "<name>"\` with a prompt and assertions) or, when no realistic agent task hits the old behavior, a reason in .agents/skills/changeset/no-agent-impact.json; see "Agents trained on the old behavior" in .cursor/rules/breaking-changes.mdc:\n${missing.map(file => `.changeset/${file}`).join('\n')}`,
  );
  process.exit(1);
}
