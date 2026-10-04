---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import Link from '@docusaurus/Link';

The quickest way to get started is to let an [AI Agent](https://agentskills.io) install using skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup).

## Install

<SkillTabs repo="reactive/data-client" />

Then run skill `/data-client-setup` to install and wire up the provider for your
project. It will automatically detect your framework (NextJS, Expo, React Native, Vue,
plain React), perform installation, as well as do migrations when existing
endpoints are found.

## Available Skills

- [**`/data-client-setup`**](https://skills.sh/reactive/data-client/data-client-setup) — installs and configures Data Client for your framework and API style.
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
- [**`/data-client-react`**](https://skills.sh/reactive/data-client/data-client-react) — uses `useSuspense`, `useFetch`, `useQuery`, `useLive`,
  and mutation hooks.
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — writes React tests with `renderDataHook`,
  fixtures, interceptors, and `nock`.
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — writes Vue tests with `renderDataCompose`,
  `mountDataClient`, fixtures, and `nock`.
- [**`/data-client-manager`**](https://skills.sh/reactive/data-client/data-client-manager) — implements custom `Manager`s for websockets, SSE,
  polling, subscriptions, logging, and middleware.

Browse the full catalog at [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

## Docs for LLMs

Agents without skills can read these docs as plain markdown, following the [llms.txt](https://llmstxt.org) convention:

:::react

- [llms.txt](https://dataclient.io/llms.txt) — index of every page, with links to each page's markdown
- [llms-full.txt](https://dataclient.io/llms-full.txt) — all React, REST and GraphQL docs in one file

Any docs page is also available as markdown by adding `.md` to its URL, like [/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md).

:::

:::vue

- [llms.txt](https://dataclient.io/vue/llms.txt) — index of every page, with links to each page's markdown
- [llms-full.txt](https://dataclient.io/vue/llms-full.txt) — all Vue, REST and GraphQL docs in one file

Any docs page is also available as markdown by adding `.md` to its URL, like [/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md).

:::
