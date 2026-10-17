#!/usr/bin/env node
// Every pending breaking changeset (a minor or major bump: the packages are
// under 1.0, so minor is breaking) needs a skill eval naming it, so agents
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
const isText = value => typeof value === 'string' && value.trim() !== '';
// a non-blank reason, which also rules out inherited keys like `constructor`
const hasReason = name => isText(exemptions[name]);
const changesetsWithEvals = new Set(
  fs.readdirSync(path.join(root, '.agents/skills')).flatMap(skill => {
    const evals = readJson(`.agents/skills/${skill}/evals/evals.json`);
    return (evals?.evals ?? [])
      .filter(
        ({ changeset, prompt, assertions }) =>
          changeset &&
          isText(prompt) &&
          Array.isArray(assertions) &&
          assertions.length &&
          assertions.every(isText),
      )
      .map(({ changeset }) => changeset);
  }),
);

/** a minor or major bump in the changeset's frontmatter */
const isBreaking = changeset =>
  /:[ \t]*(?:minor|major)[ \t]*\r?$/m.test(
    changeset.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '',
  );

const missing = fs
  .readdirSync(path.join(root, '.changeset'))
  .filter(
    file =>
      file.endsWith('.md') &&
      file !== 'README.md' &&
      !changesetsWithEvals.has(file.slice(0, -3)) &&
      !hasReason(file.slice(0, -3)) &&
      isBreaking(read(`.changeset/${file}`)),
  );

if (missing.length) {
  console.error(
    `These breaking (minor or major bump) changesets need a skill eval naming them or a reason in .agents/skills/changeset/no-agent-impact.json; see "Agents trained on the old behavior" in .cursor/rules/breaking-changes.mdc:\n${missing.map(file => `.changeset/${file}`).join('\n')}`,
  );
  process.exit(1);
}
