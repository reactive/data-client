# Claude Code plugin

![How the data-client plugin works](how-it-works.svg)

Everything that publishes Data Client's Claude Code plugin lives in this directory. The packages don't know about it: they ship their skills (`scripts/pack-skills.mjs`), and the plugin finds those skills in whatever the user's project installed.

| File                | What                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marketplace.json`  | The marketplace Claude Code reads (`claude plugin marketplace add reactive/data-client`). `data-client` is the plugin; `core`, `react`, `vue` and `migrations` are old names kept as copies so existing installs keep updating (`plans/next-breaking-release.md` removes them). |
| `session-start.mjs` | The SessionStart hook: lists the installed `@data-client/*` versions and the skills they ship. Only the first of several installed copies prints.                                                                                                                               |
| `node-modules.mjs`  | Finds packages through `node_modules`: hoisted, pnpm (store links, transitive `core`/`endpoint`), and npm, Yarn and pnpm workspaces.                                                                                                                                            |
| `pnp.mjs`           | Finds packages in Yarn Plug'n'Play projects by reading `.pnp.cjs`'s install map and the zip cache as data, never running project code. Zipped skills are copied to `.yarn/data-client-skills/`, never through a symlink a repository could commit there.                        |
| `*.test.mjs`        | `node --test '.claude-plugin/*.test.mjs'`: the hook against scratch projects of each layout, and `marketplace.json` against the repo.                                                                                                                                           |

## What it reads from the rest of the repo

- `.agents/skill-packages.json`: which package ships which skill. `scripts/pack-skills.mjs` owns it; the hook falls back to it for releases from before packages shipped skills.
- `.agents/skills/data-client/` and `.agents/skills/data-client-setup/`: the two skills the plugin itself carries.

## CI

The `agent-rules` workflow runs the tests (no install). Its `paths` cover this directory and the inputs above, so a change to any of them is checked, and `marketplace.test.mjs` fails when the old names drift from `data-client`, a plugin skill goes missing or stops shipping in a package, or a hook command points at a missing file.
