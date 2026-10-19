# Installing a missing Data Client skill

This covers `data-client-setup` and every skill the router names. With the same go-ahead as setup, install it the way
the router skill was installed:

- **npm package** (the router is under `node_modules/`): each skill ships in the `@data-client/*` package it covers,
  so install that package if the app lacks it (`@data-client/rest` brings `data-client-rest`).
- **Claude Code plugin** (the router is under `~/.claude/plugins/`): `claude plugin install react@data-client` or
  `claude plugin install vue@data-client`.
- **OpenSkills** (`AGENTS.md` lists skills in `<available_skills>`):
  `npx openskills install reactive/data-client/.agents/skills/<name>`.
- **Otherwise**, the skills CLI: `npx skills add reactive/data-client --yes --skill <name>`.

For OpenSkills and the skills CLI, add `-g` when the router skill lives under your home directory.

Then read the new skill's `SKILL.md` directly, since new skills may not load until the next session.

For a question, or when you can't install skills, use the docs as markdown instead:
https://dataclient.io/llms.txt (React) or https://dataclient.io/vue/llms.txt (Vue); to set up by hand, start at
https://dataclient.io/docs/getting-started/installation.md (React) or
https://dataclient.io/vue/getting-started/installation.md (Vue).
