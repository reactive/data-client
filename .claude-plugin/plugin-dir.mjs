// Writes the manifests that make .agents/skills a self-contained copy of the
// `data-client` plugin: node .claude-plugin/plugin-dir.mjs
// Cursor plugins and plugins listed in Claude's directory can't reach files
// outside their folder, so they're rooted at .agents/skills.
// marketplace.test.mjs fails when the written files drift from
// marketplace.json.
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
const logo = 'assets/logo.svg';

/** The plugin directory's manifests (path => JSON): the `data-client` entry
 * of marketplace.json plus each listing's own fields */
export function pluginDirFiles() {
  const marketplace = JSON.parse(
    fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'),
  );
  const plugin = marketplace.plugins.find(p => p.name === marketplace.name);
  // the fields both plugin.json listings share
  const listing = {
    name: plugin.name,
    displayName: 'Reactive Data Client',
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
    // Each entry is a skill directory (it contains SKILL.md). Listing the
    // plugin root would also publish the maintainer skills beside them.
    skills: plugin.skills.map(skill => `./${path.relative(skills, skill)}`),
  };
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
      ...listing,
      version: '1.0.0',
      category: 'developer-tools',
      tags: ['react', 'vue', 'data-fetching'],
      logo,
    },
    // Claude's plugin directory submits this folder. No `version`: Claude Code
    // then treats every commit as an update, like the root marketplace does.
    [`${skills}/.claude-plugin/plugin.json`]: {
      ...listing,
      // listing fields only Claude's directory reads
      icon: `./${logo}`,
      documentationUrl: plugin.homepage,
      supportUrl: `${repository}/issues`,
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [file, json] of Object.entries(pluginDirFiles())) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(
      path.join(root, file),
      `${JSON.stringify(json, null, 2)}\n`,
    );
  }
}
