---
name: data-client
description: Start here when asked to add, use, or set up Reactive Data Client (@data-client/react, @data-client/vue, @data-client/rest) in an app. Routes to setup when the app isn't set up yet, and to the right Data Client skill when it is.
license: Apache 2.0
---

# Reactive Data Client

It's set up when `package.json` has `@data-client/react` or `@data-client/vue` and the source wraps the app in
`DataProvider` (React) or installs `DataClientPlugin` (Vue); search the source for them.

## Not set up yet

Apply the skill `data-client-setup` (`../data-client-setup/SKILL.md`, next to this one). It detects the
framework (NextJS, Expo, React Native, Vue, plain React) and API style (REST, GraphQL, custom), installs the
packages, adds the provider, and migrates existing fetch code. It runs installs, so it isn't loaded on its own:
when the user asked you to add or use Data Client in this app, that is the go-ahead, so read its `SKILL.md` and
follow it. When they only asked about Data Client, answer and offer to set it up instead. If it isn't installed,
see the last section.

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

App code imports from `@data-client/react` or `@data-client/vue` and the protocol package
(`@data-client/rest`, `@data-client/graphql` or `@data-client/endpoint`).

## When a skill isn't installed

This covers `data-client-setup` and every skill above. With the same go-ahead as setup, install it the way this
skill was installed:

- **npm package** (this skill is under `node_modules/`): each skill ships in the `@data-client/*` package it covers,
  so it arrives with that package.
- **Claude Code plugin** (this skill is under `~/.claude/plugins/`): `claude plugin install react@data-client` or
  `claude plugin install vue@data-client`.
- **OpenSkills** (`AGENTS.md` lists skills in `<available_skills>`):
  `npx openskills install reactive/data-client/.agents/skills/<name>`.
- **Otherwise**, the skills CLI: `npx skills add reactive/data-client --yes --skill <name>`.

Then read the new skill's `SKILL.md` directly, since new skills may not load until the next session.

For a question, or when you can't install skills, use the docs as markdown instead:
https://dataclient.io/llms.txt (React) or https://dataclient.io/vue/llms.txt (Vue); to set up by hand, start at
https://dataclient.io/docs/getting-started/installation.md (React) or
https://dataclient.io/vue/getting-started/installation.md (Vue).
