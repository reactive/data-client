#!/usr/bin/env node
// Copies the agent skills a package owns from .agents/skills into its
// `skills/` folder at pack time, so they publish with the version they
// describe; TanStack Intent (`npx intent install`) finds them there.
// Each skill ships once, in a package every app that needs it installs.
//
// Usage (from a package's prepack): node ../../scripts/pack-skills.mjs
//        node scripts/pack-skills.mjs --check   (every published skill ships once)
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
  '@data-client/rest': ['data-client-rest', 'path-to-regexp-v8-migration'],
  '@data-client/react': ['data-client-react', 'data-client-react-testing'],
  '@data-client/vue': ['data-client-vue', 'data-client-vue-testing'],
};
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
  // every skill the Claude Code plugins publish
  const published = JSON.parse(
    fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'),
  ).plugins.flatMap(plugin => plugin.skills.map(s => path.basename(s)));
  const missing = [
    ...published.filter(s => !owned.includes(s) && !bundled.includes(s)),
    ...owned.filter(s => !fs.existsSync(path.join(SKILLS, s, 'SKILL.md'))),
  ];
  const twice = owned.filter((s, i) => owned.indexOf(s) !== i);
  if (missing.length || twice.length) {
    console.error(
      `scripts/pack-skills.mjs must ship each existing skill in exactly one package: ${[...missing, ...twice].join(', ')}`,
    );
    process.exit(1);
  }
} else {
  const { name } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  fs.rmSync('skills', { recursive: true, force: true });
  if (!owners[name]) throw new Error(`No skills listed for ${name}`);
  for (const skill of owners[name])
    fs.cpSync(path.join(SKILLS, skill), path.join('skills', skill), {
      recursive: true,
      dereference: true,
      filter: src => !skip.has(path.basename(src)),
    });
}
