---
name: data-client
description: Start here when asked to add, use, or set up Reactive Data Client (@data-client/react, @data-client/vue, @data-client/rest) in an app. Routes to setup when the app isn't set up yet, and to the right Data Client skill when it is.
license: Apache 2.0
---

# Reactive Data Client

It's set up when `package.json` has `@data-client/react` or `@data-client/vue` and the source wraps the app in
`DataProvider` (React) or installs `DataClientPlugin` (Vue); search the source for them.

## Not set up yet

Read `../data-client-setup/SKILL.md` (next to this one) and follow it. It isn't loaded on its own because it runs
installs; the user asking to add or use Data Client in this app is the go-ahead. If they only asked about Data
Client, answer and offer to set it up instead.

## Set up

Load the skill for the work:

| Work | Skill |
|------|-------|
| Entities, `Collection`, `Union`, `Query`, normalization | `data-client-schema` |
| REST endpoints: `resource()`, `RestEndpoint` | `data-client-rest` |
| React hooks: `useSuspense`, `useController`, `useLive`, `DataProvider` | `data-client-react` |
| Vue composables: `useSuspense`, `useController`, `DataClientPlugin` | `data-client-vue` |
| Tests | `data-client-react-testing` or `data-client-vue-testing` |
| WebSockets, SSE, polling, global side effects | `data-client-manager` |

To add a protocol the app doesn't depend on yet, or to write GraphQL queries or wrap async functions, follow its guide
in `data-client-setup` (`../data-client-setup/references/`): `data-client-rest-setup.md`,
`data-client-graphql-setup.md` or `data-client-endpoint-setup.md`, installing only packages the app lacks. They
aren't loaded by name.

If a skill named here isn't installed, follow [references/install.md](references/install.md).
