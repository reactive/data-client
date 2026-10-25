# Reactive Data Client

[Reactive Data Client](https://dataclient.io) manages server state in React and Vue apps: fetching, caching,
mutations and real-time updates, all kept consistent through a normalized store. This plugin teaches your coding
agent to use it well.

The plugin carries two skills:

- **`data-client`** starts any task in an app that uses Data Client, or that should. It sends the agent to the
  skill for the work at hand: schemas, REST endpoints, React hooks, Vue composables, tests, or real-time managers.
- **`data-client-setup`** adds Data Client to an app. It runs only when you ask for it. It detects your framework
  (NextJS, Expo, React Native, Vue or plain React) and protocol (REST, GraphQL or other async code), tells you which
  packages it will install, installs them with your package manager, adds the provider, and follows the setup guide
  for your protocol.

Every other skill ships inside the `@data-client/*` package it covers, so its guidance always matches the version
your project installs. The setup skill links them into your project's `.agents/skills` folder (and `.claude/skills`)
by running `npx --no data-client-skills`, which uses only your installed packages and never downloads one.

## Install

With Claude Code, for everyone working on the project:

```bash
claude plugin marketplace add reactive/data-client --scope project \
  --sparse .claude-plugin .agents/skills
claude plugin install data-client@data-client --scope project
```

In Cursor's agent chat:

```
/add-plugin data-client@https://github.com/reactive/data-client
```

In Codex:

```bash
codex plugin marketplace add reactive/data-client \
  --sparse .claude-plugin --sparse .agents/skills
codex plugin add data-client@data-client
```

Then ask your agent to set up Data Client, or start the setup skill yourself: `/data-client:data-client-setup` in
Claude Code, `/data-client-setup` in Cursor, `$data-client:data-client-setup` in Codex.

## What it runs

The plugin has no hooks, MCP servers or scripts of its own, and it sends no data anywhere. When you ask it to set up
Data Client, the agent runs your package manager to install the `@data-client/*` packages and runs the
`data-client-skills` command those packages include. Projects on packages older than 0.19 install the skills with
the [skills CLI](https://www.npmjs.com/package/skills) instead.

## Learn more

- [Agent skills guide](https://dataclient.io/docs/getting-started/agent-skills)
- [Documentation](https://dataclient.io/docs)
- [Source](https://github.com/reactive/data-client), licensed under Apache-2.0
