// Writes the Cursor copy of the `data-client` plugin: node .claude-plugin/cursor.mjs
// Cursor plugins can't reach files outside their folder, so it's rooted at
// .agents/skills. marketplace.test.mjs fails when the written files drift
// from marketplace.json.
//
// `/add-plugin` checks out ref "main" when the marketplace entry's source
// doesn't pin one, and a branch on the GitHub URL is ignored. This repo's
// default branch is master, so a relative source fails with
// `git ls-remote did not return a resolvable commit for ref "main"`.
// git-subdir sparse-checks out only the plugin directory at master.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const skills = '.agents/skills';
const repository = 'https://github.com/reactive/data-client';

/** Cursor's manifests (path => JSON): the `data-client` entry of
 * marketplace.json plus Cursor's own listing fields */
export function cursorFiles() {
  const marketplace = JSON.parse(
    fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'),
  );
  const plugin = marketplace.plugins.find(p => p.name === marketplace.name);
  return {
    '.cursor-plugin/marketplace.json': {
      name: marketplace.name,
      owner: marketplace.owner,
      metadata: marketplace.metadata,
      plugins: [
        {
          name: plugin.name,
          source: {
            source: 'git-subdir',
            url: `${repository}.git`,
            path: skills,
            ref: 'master',
          },
          description: plugin.description,
        },
      ],
    },
    [`${skills}/.cursor-plugin/plugin.json`]: {
      name: plugin.name,
      displayName: 'Reactive Data Client',
      version: '1.0.0',
      description: plugin.description,
      author: marketplace.owner,
      homepage: plugin.homepage,
      repository,
      license: plugin.license,
      keywords: [
        'data-client',
        'react',
        'vue',
        'rest',
        'graphql',
        'normalized-cache',
      ],
      category: 'developer-tools',
      tags: ['react', 'vue', 'data-fetching'],
      logo: 'assets/logo.svg',
      // Each entry is a skill directory (it contains SKILL.md). Listing the
      // plugin root would also publish the maintainer skills beside them.
      skills: plugin.skills.map(skill => `./${path.relative(skills, skill)}`),
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [file, json] of Object.entries(cursorFiles())) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(
      path.join(root, file),
      `${JSON.stringify(json, null, 2)}\n`,
    );
  }
}
