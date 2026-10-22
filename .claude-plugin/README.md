# Claude Code, Codex and Cursor plugin

![How Data Client's agent skills work](how-it-works.svg)

Everything that publishes Data Client's agent plugin lives in this directory, Cursor's copy included. The plugin only starts new apps: it
carries the `data-client` router and `data-client-setup` skills and no hooks. Every other skill ships in the
`@data-client/*` package it covers (`scripts/pack-skills.mjs`), and `data-client-skills` (a bin on
endpoint, rest, graphql, react and vue, implemented in `packages/core/agents/` and copied into each at pack time) links those into the project's
`.agents/skills` (with `.claude/skills` linking to it), where Claude Code, Cursor and Codex load them as their own.

| File               | What                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marketplace.json` | The marketplace Claude Code reads (`claude plugin marketplace add reactive/data-client`). `data-client` is the plugin; `core`, `react`, `vue` and `migrations` are old names kept as copies so existing installs keep updating (`plans/next-breaking-release.md` removes them). |
| `cursor.mjs`       | Writes Cursor's copy of the plugin (see below).                                                                                                                                                                                                                                 |
| `*.test.mjs`       | `node --test '.claude-plugin/*.test.mjs'`: `marketplace.json` and the Cursor copy against the repo.                                                                                                                                                                             |

## Codex and Cursor

Codex reads `marketplace.json` as is (`codex plugin add data-client@data-client`). Cursor plugins can't reach files outside their folder, so `cursor.mjs` writes a copy of the `data-client` entry rooted at `.agents/skills` (`.cursor-plugin/marketplace.json`, `.agents/skills/.cursor-plugin/plugin.json`), and `marketplace.test.mjs` fails when they drift. The marketplace source is a `git-subdir` pinned to `master`: Cursor's `/add-plugin` otherwise checks out `main`, which this repo does not have. Cursor's published `marketplace.schema.json` still types `source` as a string; the object form comes from its plugin docs, and the Cursor agent's install resolved it.

## What it reads from the rest of the repo

- `.agents/skills/data-client/` and `.agents/skills/data-client-setup/`: the two skills the plugin carries.
- `.agents/skill-packages.json`: which package ships which skill, so the test can check the plugin's skills also ship
  in a package.

## CI

The `agent-rules` workflow runs these tests and the `data-client-skills` tests (`packages/core/agents/*.test.mjs`), with
no install. Its `paths` cover this directory and the inputs above, and `marketplace.test.mjs` fails when the old names
drift from `data-client` or a plugin skill goes missing or stops shipping in a package. `cursor-plugin.test.mjs` checks that the Cursor manifests still install.
