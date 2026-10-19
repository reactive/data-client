---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';

## Install skills for best results

Agents get the basics right from the package name alone. [Skills](https://agentskills.io) teach them the current
APIs for the rest, like test fixtures and real-time managers. Install skill
[/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup):

<SkillTabs skill="data-client-setup" framed />

Then run it in your agent's chat:

```prompt framed
/data-client-setup
```

It detects your framework and API style (REST, GraphQL, custom), installs the matching skills below, wires up the
provider, and migrates existing endpoints.

### Install all skills up front

To install every skill for your framework now instead, without letting your agent run installs:

<SkillTabs />

The **Installed packages** tab links the skills each installed `@data-client/*` package ships into `.claude/skills`,
where Claude Code and Cursor load them, matched to that package's version. Commit the links. They follow upgrades,
and running it again picks up skills from packages you add or upgrade. The Claude Code plugin sets up apps that don't have Data
Client yet. If you use [TanStack Intent](https://tanstack.com/intent), it loads the same package skills.

### Available Skills

- [**`/data-client`**](https://skills.sh/reactive/data-client/data-client) — starts here when you ask your agent to add or use Data Client, and routes it to setup or the skill for the task.
- [**`/data-client-setup`**](https://skills.sh/reactive/data-client/data-client-setup) — installs and configures Data Client for your framework and API style, along with the skills it needs.
- [**`/data-client-rest-setup`**](https://skills.sh/reactive/data-client/data-client-rest-setup) — sets up `@data-client/rest` and migrates existing
  `fetch`/`axios` clients.
- [**`/data-client-endpoint-setup`**](https://skills.sh/reactive/data-client/data-client-endpoint-setup) — wraps custom async functions with `Endpoint`
  for non-REST and non-GraphQL workflows.
- [**`/data-client-graphql-setup`**](https://skills.sh/reactive/data-client/data-client-graphql-setup) — configures `@data-client/graphql` and `GQLEndpoint`
  for GraphQL APIs.
- [**`/data-client-schema`**](https://skills.sh/reactive/data-client/data-client-schema) — designs `Entity`, `Collection`, `Union`, `Query`,
  and related schemas.
- [**`/data-client-rest`**](https://skills.sh/reactive/data-client/data-client-rest) — defines REST APIs with `resource()`, `RestEndpoint`,
  CRUD methods, and response parsing.
- [**`/data-client-manager`**](https://skills.sh/reactive/data-client/data-client-manager) — implements custom `Manager`s for websockets, SSE,
  polling, subscriptions, logging, and middleware.

:::react

- [**`/data-client-react`**](https://skills.sh/reactive/data-client/data-client-react) — uses `useSuspense`, `useFetch`, `useQuery`, `useLive`,
  and mutation hooks, and [debugs your running app](./debugging.md#debugging-with-agents) with Chrome DevTools MCP.
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — writes React tests with `renderDataHook`,
  fixtures, interceptors, and `nock`.

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — uses `useSuspense`, `useFetch`, `useQuery`, `useLive`,
  and mutation composables with `DataClientPlugin`, and [debugs your running app](./debugging.md#debugging-with-agents) with Chrome DevTools MCP.
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — writes Vue tests with `renderDataCompose`,
  `mountDataClient`, fixtures, and `nock`.

:::

Browse the full catalog at [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

## Set up by hand

To install the packages and add the provider yourself, follow [Installation](./installation.md).

## Docs for LLMs

Agents without skills can read these docs as plain markdown, following the [llms.txt](https://llmstxt.org) convention:

- :react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] — index of every page, with links to each page's markdown
- :react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] — all :react[React]:vue[Vue], REST and GraphQL docs in one file

Any docs page is also available as markdown by adding `.md` to its URL, like :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)].
