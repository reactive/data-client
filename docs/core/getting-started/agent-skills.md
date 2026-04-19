---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import Link from '@docusaurus/Link';

[Agent Skills](https://skills.sh/reactive/data-client) teach AI coding agents
(Claude Code, Cursor, Codex, etc.) how to use Reactive Data Client correctly —
covering installation, schema design, REST/GraphQL endpoints, hooks, and testing.

Install the skills into your project so your agent can scaffold, migrate, and
extend `@data-client` code without guessing.

## Install

<SkillTabs repo="reactive/data-client" />

Then run skill `/data-client-setup` to install and wire up the provider for your
project. The setup skill detects your framework (NextJS, Expo, React Native, Vue,
plain React) and protocol (REST, GraphQL, custom) and applies the right configuration.

## Available Skills

- **`/data-client-setup`** — installs packages and adds the provider for your stack.
- **`/data-client-rest-setup`** — generates `resource()` definitions and migrates
  existing `fetch`/`axios` clients (see [REST Agent Skills](/rest#rest-agent-skills)).
- **`/data-client-schema`** — designs `Entity`, `Collection`, `Union`, and `Query` schemas.
- **`/data-client-react`** — uses `useSuspense`, `useQuery`, `useLive`, mutations.
- **`/data-client-react-testing`** / **`/data-client-vue-testing`** — writes tests with
  `renderDataHook` / `renderDataCompose`, fixtures, and `nock`.
- **`/data-client-manager`** — implements custom `Manager`s for websockets, SSE,
  polling, logging, and middleware.

Browse the full catalog at [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

<center>

<Link className="button button--secondary" to="./installation">Next: Installation »</Link>

</center>
