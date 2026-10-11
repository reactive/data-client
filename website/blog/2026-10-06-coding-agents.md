---
title: Data Client for Coding Agents
description: Agent skills, a Claude Code plugin, Chrome DevTools MCP debugging and llms.txt help coding agents write, debug and upgrade Data Client apps
image: /img/social/coding-agents-card.png
authors: [ntucker]
tags: [agents, vue]
draft: true
---

import SkillTabs from '@site/src/components/SkillTabs';

Coding agents write a lot of Data Client code now, and they write it better when they have the current docs and
workflows instead of guessing from older releases. This release cycle makes that easier to set up for any agent.

**New:**

- [Claude Code plugin](/blog/2026/10/06/coding-agents#claude-plugin) - `claude plugin install react@data-client` installs the skills for your framework
- [Vue skills](/blog/2026/10/06/coding-agents#vue-skills) - Vue projects get Vue composables and tests, not React hooks
- [llms.txt](/blog/2026/10/06/coding-agents#llms-txt) - Any agent can read the docs as markdown, and every page tells it where to look

**Also available:**

- [Agent skills](/blog/2026/10/06/coding-agents#skills) - Define REST APIs, design schemas, write Managers, and test; [/data-client-setup](/blog/2026/10/06/coding-agents#setup) now installs just the ones you need, and they're [generated from these docs](/blog/2026/10/06/coding-agents#generated-references)
- [Chrome DevTools MCP](/blog/2026/10/06/coding-agents#debugging) - Agents inspect your running app's store, or use Expo MCP for React Native
- [Upgrade skills](/blog/2026/10/06/coding-agents#upgrades) - Migration skills upgrade your code, including what codemods can't

{/* truncate */}

## Get started {#setup}

Install the [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup) skill and run it. It
detects React or Vue and your API style (REST, GraphQL or custom), installs the skills your project needs, and sets up
Data Client. For REST it hands off to
[data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup), which moves existing `fetch` or
axios calls to endpoints ([#4153](https://github.com/reactive/data-client/pull/4153)).

<SkillTabs skill="data-client-setup" />

[Agent Skills](/docs/getting-started/agent-skills) lists every skill and how to install them all up front.

## Claude Code plugin {#claude-plugin}

The Data Client repo is a Claude Code plugin marketplace. The `core` plugin holds the setup, REST, GraphQL, schema and
Manager skills; the `react` and `vue` plugins add their framework's skills and pull in `core`; and the `migrations`
plugin adds the upgrade skills ([#4153](https://github.com/reactive/data-client/pull/4153)). The
[Agent Skills](/docs/getting-started/agent-skills) page shows the same install with the skills CLI and OpenSkills.

```bash
claude plugin marketplace add reactive/data-client
claude plugin install react@data-client
```

Use `vue@data-client` for Vue, `core@data-client` for neither, and add `migrations@data-client` before an upgrade.

## Vue skills {#vue-skills}

Vue projects used to get the React hooks skill, so agents reached for React patterns. The
[data-client-vue](https://skills.sh/reactive/data-client/data-client-vue) skill writes `DataClientPlugin` and composable
code, and [debugs a running app](/vue/getting-started/debugging#debugging-with-agents)
([#4126](https://github.com/reactive/data-client/pull/4126)).
[data-client-vue-testing](https://skills.sh/reactive/data-client/data-client-vue-testing) writes `renderDataCompose()`
and `mountDataClient()` tests ([#4126](https://github.com/reactive/data-client/pull/4126)) that follow the
[Vue testing guides](/vue/guides/unit-testing-composables) ([#4181](https://github.com/reactive/data-client/pull/4181)).

## llms.txt {#llms-txt}

Agents without skills can read the docs as markdown, following the [llms.txt](https://llmstxt.org) convention
([#4171](https://github.com/reactive/data-client/pull/4171), [#4236](https://github.com/reactive/data-client/pull/4236)):

- [llms.txt](https://dataclient.io/llms.txt) for React and [vue/llms.txt](https://dataclient.io/vue/llms.txt) for Vue index every page, and `llms-full.txt` beside each holds them all in one file
- [rest/llms.txt](https://dataclient.io/rest/llms.txt) and [graphql/llms.txt](https://dataclient.io/graphql/llms.txt) cover just that package's API
- Any docs page is markdown when you add `.md` to its URL, like [/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)

Every page links its llms.txt in `<head>`, and every docs page links its markdown, so an agent given any page URL
finds them on its own.

## Skills match the docs {#generated-references}

Skill reference pages are now generated per framework from these docs, so they carry shared snippets like install
commands and give Vue projects only Vue code. A CI check fails when a skill drifts from the docs, so skills stay
current with each release ([#4170](https://github.com/reactive/data-client/pull/4170)).

## Also available

### Skills for each task {#skills}

Beyond setup, there are skills for each part of a Data Client app. `/data-client-setup` installs the ones your project
uses:

- [data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup) moves `fetch`, axios, ky, got or superagent clients to [RestEndpoint](/rest/api/RestEndpoint), alongside the [axios migration guide](/rest/guides/axios-migration) and its codemod ([#3867](https://github.com/reactive/data-client/pull/3867))
- [data-client-graphql-setup](https://skills.sh/reactive/data-client/data-client-graphql-setup) and [data-client-endpoint-setup](https://skills.sh/reactive/data-client/data-client-endpoint-setup) cover GraphQL and custom async functions
- [data-client-rest](https://skills.sh/reactive/data-client/data-client-rest) defines APIs with [resource()](/rest/api/resource) and [RestEndpoint](/rest/api/RestEndpoint)
- [data-client-schema](https://skills.sh/reactive/data-client/data-client-schema) designs [Entity](/rest/api/Entity), [Collection](/rest/api/Collection), [Union](/rest/api/Union) and [Query](/rest/api/Query) schemas
- [data-client-manager](https://skills.sh/reactive/data-client/data-client-manager) writes [Managers](/docs/concepts/managers) for websockets, SSE, polling and logging
- [data-client-react](https://skills.sh/reactive/data-client/data-client-react) and [data-client-react-testing](https://skills.sh/reactive/data-client/data-client-react-testing) use and test the React hooks

Browse them all at [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

### Debug a running app {#debugging}

Ask your agent "why didn't this refetch?" or "what's in the cache right now?" and it can check the running app instead
of guessing from code. In dev mode, [DevToolsManager](/docs/api/DevToolsManager#controllers) puts each store's
[Controller](/docs/api/Controller) on `globalThis.__DC_CONTROLLERS__`, so an agent connected through
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), or
[Expo MCP](https://docs.expo.dev/eas/ai/mcp/) for React Native, can read the store, follow dispatched actions, and
match them to network requests. The map is there in browsers, React Native and Node
([#3753](https://github.com/reactive/data-client/pull/3753)).

```js title="Browser DevTools console"
__DC_CONTROLLERS__.get('Data Client: My App').getState();
```

The React and Vue skills drive this through Chrome DevTools MCP; see
[debugging with agents](/docs/getting-started/debugging#debugging-with-agents) for what they can inspect.

### Upgrade skills {#upgrades}

Skills also handle upgrades. The v0.18 skill runs the [codemod](/codemods/v0.18.js), then handles what it can't, like
registering [`argsKey`](/rest/api/SchemaSimple) for schemas whose output depends on endpoint args
([v0.18 migration](/blog/2026/05/01/v0.18-scalar-typed-downloads#migration-guide)). The path-to-regexp v8 skill rewrites
[path syntax](/blog/2026/04/01/v0.16-parallel-fetching-collection-move-lazy#path-to-regexp-v8) in your endpoints.

<SkillTabs skills={['data-client-v0.18-migration', 'path-to-regexp-v8-migration']} />
