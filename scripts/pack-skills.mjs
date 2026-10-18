#!/usr/bin/env node
// Copies the agent skills a package owns from .agents/skills into its
// `skills/` folder, so they publish with the version they describe.
// Agents load them through TanStack Intent (`npx @tanstack/intent install`),
// which finds any installed package with a `skills/` folder.
//
// Shared skills live in the package every app that needs them already has,
// so each skill ships once: setup and managers with core (React and Vue both
// depend on it), schemas with endpoint (rest and graphql depend on it).
//
// Usage (from a package's prepack): node ../../scripts/pack-skills.mjs
//        node scripts/pack-skills.mjs --check   (every data-client skill has one owner)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(root, '.agents/skills');

const owners = {
  '@data-client/core': ['data-client-setup', 'data-client-manager'],
  '@data-client/endpoint': [
    'data-client-schema',
    'data-client-v0.18-migration',
  ],
  '@data-client/rest': ['data-client-rest'],
  '@data-client/react': ['data-client-react', 'data-client-react-testing'],
  '@data-client/vue': ['data-client-vue', 'data-client-vue-testing'],
};
// bundled into data-client-setup, so shipping them again would duplicate them
const bundled = [
  'data-client-rest-setup',
  'data-client-graphql-setup',
  'data-client-endpoint-setup',
];
// repo tooling, not part of the published copy
const skip = new Set(['evals', 'references.json']);

if (process.argv.includes('--check')) {
  const owned = Object.values(owners).flat();
  const problems = [
    ...owned.filter(s => !fs.existsSync(path.join(SKILLS, s, 'SKILL.md'))),
    ...fs
      .readdirSync(SKILLS)
      .filter(s => s.startsWith('data-client-'))
      .filter(s => !owned.includes(s) && !bundled.includes(s)),
  ];
  if (problems.length) {
    console.error(
      `Skills without exactly one package in scripts/pack-skills.mjs: ${problems.join(', ')}`,
    );
    process.exit(1);
  }
} else {
  const { name } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  fs.rmSync('skills', { recursive: true, force: true });
  for (const skill of owners[name] ?? [])
    fs.cpSync(path.join(SKILLS, skill), path.join('skills', skill), {
      recursive: true,
      dereference: true,
      filter: src => !skip.has(path.basename(src)),
    });
}
