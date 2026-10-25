---
name: data-client
description: Reactive Data Client (@data-client/*). Start here for any task or bug in an app that uses it, or to add it to one.
license: Apache 2.0
---

# Reactive Data Client

It's set up when `package.json` has `@data-client/react` or `@data-client/vue` and the source wraps the app in
`DataProvider` (React) or installs `DataClientPlugin` (Vue); search the source for them.

## Not set up yet

Read `../data-client-setup/SKILL.md` (next to this one) and follow it. It isn't loaded on its own because it runs
installs; the user asking to add or use Data Client in this app is the go-ahead. If they only asked about Data
Client, answer and offer to set it up instead.

To only replace an HTTP client (axios, fetch, ky, superagent, got) with `@data-client/rest` endpoints, follow
`../data-client-setup/references/data-client-rest-setup.md` instead. It needs no provider and leaves how the app loads
and stores data alone.

## Set up

Load the skill for the work. If it isn't available by name but its package is installed, run
`npx --no data-client-skills` (`pnpm exec`, `yarn`) from the project root, which links the skills the installed packages
ship into the project's skill folder, then read `.claude/skills/<skill>/SKILL.md`.

| Work | Skill | Package |
|------|-------|---------|
| Entities, `Collection`, `Union`, `Query`, normalization | `data-client-schema` | `endpoint` |
| REST endpoints: `resource()`, `RestEndpoint` | `data-client-rest` | `rest` |
| React hooks: `useSuspense`, `useController`, `useLive`, `DataProvider` | `data-client-react` | `react` |
| Vue composables: `useSuspense`, `useController`, `DataClientPlugin` | `data-client-vue` | `vue` |
| Tests | `data-client-react-testing` or `data-client-vue-testing` | `react` or `vue` |
| WebSockets, SSE, polling, global side effects | `data-client-manager` | `core` |

To add a protocol the app doesn't depend on yet, move axios or fetch calls to REST endpoints, write GraphQL queries or
wrap async functions, follow its guide in `data-client-setup` (`../data-client-setup/references/`):
`data-client-rest-setup.md`, `data-client-graphql-setup.md` or `data-client-endpoint-setup.md`, installing only packages
the app lacks. They
aren't loaded by name.

If a skill named here isn't installed, follow [references/install.md](references/install.md).
