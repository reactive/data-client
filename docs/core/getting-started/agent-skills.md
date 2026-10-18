---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import AgentPrompt from '@site/src/components/AgentPrompt';
import SkillTabs from '@site/src/components/SkillTabs';

The quickest way to get started is to tell your [coding agent](https://agentskills.io):

<AgentPrompt />

## Install skills for best results

Agents get the basics right from the package name alone. [Skills](https://agentskills.io) teach them the current
APIs for the rest, like test fixtures and real-time managers. Install skill
[/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup):

<SkillTabs skill="data-client-setup" />

Then run skill `/data-client-setup`. It detects your framework and API style (REST, GraphQL,
custom), installs the matching skills below, wires up the provider, and migrates existing endpoints.

### Install all skills up front

To install every skill for your framework now instead, without letting your agent run installs:

<SkillTabs />

Then asking your agent to use Data Client is enough: skill `/data-client` routes it to setup or to the skill for
the task.

### Load skills from your installed packages

Each `@data-client/*` package ships the skills for its version, so they update with `npm update`. To have your agent
load them, add [TanStack Intent](https://tanstack.com/intent) and run its install, which adds a skill loading section
to your `AGENTS.md`:

```bash
npm install -D @tanstack/intent
npx intent install
```

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
