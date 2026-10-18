---
name: data-client
description: Start here when asked to add, use, or set up Reactive Data Client (@data-client/react, @data-client/vue, @data-client/rest) in an app. Routes to setup when the packages aren't installed yet, and to the right Data Client skill when they are.
license: Apache 2.0
---

# Reactive Data Client

Check `package.json` for `@data-client/react` or `@data-client/vue`.

## Not installed yet

Apply the skill `data-client-setup` (`../data-client-setup/SKILL.md`, next to this one). It detects the
framework (NextJS, Expo, React Native, Vue, plain React) and API style (REST, GraphQL, custom), installs the
packages, adds the provider, and migrates existing fetch code. It runs installs, so it isn't loaded on its own:
when the user asked you to add or use Data Client in this app, that is the go-ahead, so read its `SKILL.md` and
follow it. When they only asked about Data Client, answer and offer to set it up instead.

If `data-client-setup` isn't installed, the same go-ahead covers installing it:
`npx skills add reactive/data-client --skill data-client-setup`. If you can't install skills, set up by hand from
https://dataclient.io/docs/getting-started/installation.md.

## Installed

Load the skill for the work:

| Work | Skill |
|------|-------|
| Entities, `Collection`, `Union`, `Query`, normalization | `data-client-schema` |
| REST endpoints: `resource()`, `RestEndpoint` | `data-client-rest` |
| React hooks: `useSuspense`, `useController`, `useLive`, `DataProvider` | `data-client-react` |
| Vue composables: `useSuspense`, `useController`, `DataClientPlugin` | `data-client-vue` |
| Tests | `data-client-react-testing` or `data-client-vue-testing` |
| WebSockets, SSE, polling, global side effects | `data-client-manager` |

App code imports from `@data-client/react` or `@data-client/vue` and the protocol package (`@data-client/rest`).
Docs as markdown: https://dataclient.io/llms.txt (React) or https://dataclient.io/vue/llms.txt (Vue).
