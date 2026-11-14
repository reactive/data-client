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

To only swap an HTTP client (axios, fetch, ky, superagent, got) for `@data-client/rest` endpoints, without a provider
or store changes, follow `../data-client-setup/references/data-client-rest-setup.md` instead.

## Set up

Data Client separates defining data from running it. The definition does not depend on a view framework: schemas say
what the data is (nouns), and endpoints are the operations on that data (verbs). At runtime, hooks or composables
connect the data to the view framework, and Managers connect it to the world outside the framework, as `useEffect`
connects a component to what is outside React.

Put each part of the work in its layer and load that layer's skill. One task can need several. If a skill isn't
available by name but its package is installed, run `npx --no data-client-skills` (`pnpm exec`, `yarn`) from the
project root, which links the skills the installed packages ship into the project's skill folder, then read
`.claude/skills/<skill>/SKILL.md`.

| Layer | Work | Skill | Package |
|-------|------|-------|---------|
| Schema: what the data is | Entities, `Collection`, `Union`, `Query`, normalization. Every shape of data, also one no response has: joined across endpoints, derived, or kept from earlier responses | `data-client-schema` | `endpoint` |
| Endpoint: operations on the data | REST endpoints: `resource()`, `RestEndpoint` | `data-client-rest` | `rest` |
| Hooks: runtime in React | `useSuspense`, `useController`, `useLive`, `DataProvider` | `data-client-react` | `react` |
| Composables: runtime in Vue | `useSuspense`, `useController`, `DataClientPlugin` | `data-client-vue` | `vue` |
| Manager: runtime outside the framework | WebSockets, SSE, polling, global side effects. A Manager moves data into and out of the store; the schema defines the data's shape | `data-client-manager` | `core` |
| | Tests | `data-client-react-testing` or `data-client-vue-testing` | `react` or `vue` |
| | Make data loading, navigation or mutations faster; the performance pass after a migration | `data-client-performance` | `react` |

To add a protocol the app doesn't depend on yet, move axios or fetch calls to REST endpoints, write GraphQL queries or
wrap async functions, follow its guide in `data-client-setup` (`../data-client-setup/references/`):
`data-client-rest-setup.md`, `data-client-graphql-setup.md` or `data-client-endpoint-setup.md`, installing only packages
the app lacks. They
aren't loaded by name.

If a skill named here isn't installed, follow [Installing a missing skill](references/install.md).
