#!/usr/bin/env node
// Copies the agent skills a package owns from .agents/skills into its
// `skills/` folder at pack time, so they publish with the version they
// describe; `data-client-skills` links them into a project's .agents/skills,
// and TanStack Intent finds them there too.
// Each skill ships once, in a package every app that needs it installs
// (.agents/skill-packages.json).
//
// Also copies the `data-client-skills` code into each package that has the
// command.
//
// Usage (from a package's prepack): node ../../scripts/pack-skills.mjs
//        node scripts/pack-skills.mjs --check   (every library skill ships once and exists)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(root, '.agents/skills');
// `data-client-skills`, which core ships from source and the others copy
const AGENTS = path.join(root, 'packages/core/agents');

const owners = JSON.parse(
  fs.readFileSync(path.join(root, '.agents/skill-packages.json'), 'utf8'),
);
// repo tooling, not part of the published copy
const skip = new Set(['evals', 'references.json']);

if (process.argv.includes('--check')) {
  const owned = Object.values(owners).flat();
  // skills a shipped skill bundles (references.json `skills`) ship inside it
  const bundled = owned.flatMap(skill => {
    const manifest = path.join(SKILLS, skill, 'references.json');
    return fs.existsSync(manifest) ?
        (JSON.parse(fs.readFileSync(manifest, 'utf8')).skills ?? [])
      : [];
  });
  // library skills (repo tooling like `changeset` stays out of packages)
  const library = fs
    .readdirSync(SKILLS)
    .filter(s => s.startsWith('data-client') || s.endsWith('-migration'));
  const problems = [
    ...library
      .filter(s => !owned.includes(s) && !bundled.includes(s))
      .map(s => `${s} ships in no package`),
    ...owned
      .filter((s, i) => owned.indexOf(s) !== i)
      .map(s => `${s} ships in more than one package`),
    ...owned
      .filter(s => !fs.existsSync(path.join(SKILLS, s, 'SKILL.md')))
      .map(s => `${s} has no SKILL.md`),
  ];
  if (problems.length) {
    console.error(`scripts/pack-skills.mjs:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
} else {
  const { name, bin } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  // no package every repo installs: core reaches no endpoint-only repo, and
  // endpoint no app, so each package with the command ships its own copy
  const command = !!bin?.['data-client-skills'];
  // core ships its own source
  if (command && path.resolve('agents') !== AGENTS) {
    fs.rmSync('agents', { recursive: true, force: true });
    fs.cpSync(AGENTS, 'agents', {
      recursive: true,
      filter: src => !src.endsWith('.test.mjs'),
    });
  }
  fs.rmSync('skills', { recursive: true, force: true });
  if (!command && !owners[name])
    throw new Error(`No skills listed for ${name}`);
  for (const skill of owners[name] ?? [])
    fs.cpSync(path.join(SKILLS, skill), path.join('skills', skill), {
      recursive: true,
      dereference: true,
      filter: src => !skip.has(path.basename(src)),
    });
}
