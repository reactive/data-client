# Claude Code plugin

![How Data Client's agent skills work](how-it-works.svg)

Everything that publishes Data Client's Claude Code plugin lives in this directory. The plugin only starts new apps: it
carries the `data-client` router and `data-client-setup` skills and no hooks. Every other skill ships in the
`@data-client/*` package it covers (`scripts/pack-skills.mjs`), and `data-client-skills` (a bin on
`@data-client/react` and `@data-client/vue`, implemented in `packages/core/agents/`) links those into the project's
`.agents/skills` (with `.claude/skills` linking to it), where Claude Code, Cursor and Codex load them as their own.

| File               | What                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marketplace.json` | The marketplace Claude Code reads (`claude plugin marketplace add reactive/data-client`). `data-client` is the plugin; `core`, `react`, `vue` and `migrations` are old names kept as copies so existing installs keep updating (`plans/next-breaking-release.md` removes them). |
| `*.test.mjs`       | `node --test '.claude-plugin/*.test.mjs'`: `marketplace.json` against the repo.                                                                                                                                                                                                 |

## What it reads from the rest of the repo

- `.agents/skills/data-client/` and `.agents/skills/data-client-setup/`: the two skills the plugin carries.
- `.agents/skill-packages.json`: which package ships which skill, so the test can check the plugin's skills also ship
  in a package.

## CI

The `agent-rules` workflow runs these tests and the `data-client-skills` tests (`packages/core/agents/*.test.mjs`), with
no install. Its `paths` cover this directory and the inputs above, and `marketplace.test.mjs` fails when the old names
drift from `data-client` or a plugin skill goes missing or stops shipping in a package.
