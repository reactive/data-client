---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import Link from '@docusaurus/Link';

La forma más rápida de dar los primeros pasos es dejar que un [agente de IA](https://agentskills.io) instale usando la skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup).

## Instalar {#install}

<SkillTabs skill="data-client-setup" />

Después ejecuta la skill `/data-client-setup`. Detecta tu framework y el estilo de API (REST, GraphQL,
personalizada), instala las skills correspondientes de abajo, conecta el provider y migra los endpoints existentes.

### Instalar todas las skills por adelantado {#install-all-skills-up-front}

Para instalar ahora todas las skills de tu framework, sin dejar que tu agente ejecute las instalaciones:

<SkillTabs />

## Skills disponibles {#available-skills}

- [**`/data-client-setup`**](https://skills.sh/reactive/data-client/data-client-setup) — instala y configura Data Client para tu framework y estilo de API, junto con las skills que necesita.
- [**`/data-client-rest-setup`**](https://skills.sh/reactive/data-client/data-client-rest-setup) — configura `@data-client/rest` y migra clientes existentes de
  `fetch`/`axios`.
- [**`/data-client-endpoint-setup`**](https://skills.sh/reactive/data-client/data-client-endpoint-setup) — envuelve funciones asíncronas personalizadas con `Endpoint`
  para flujos que no son REST ni GraphQL.
- [**`/data-client-graphql-setup`**](https://skills.sh/reactive/data-client/data-client-graphql-setup) — configura `@data-client/graphql` y `GQLEndpoint`
  para APIs de GraphQL.
- [**`/data-client-schema`**](https://skills.sh/reactive/data-client/data-client-schema) — diseña `Entity`, `Collection`, `Union`, `Query`
  y schemas relacionados.
- [**`/data-client-rest`**](https://skills.sh/reactive/data-client/data-client-rest) — define APIs REST con `resource()`, `RestEndpoint`,
  métodos CRUD y el análisis de la respuesta.
- [**`/data-client-manager`**](https://skills.sh/reactive/data-client/data-client-manager) — implementa `Manager`s personalizados para websockets, SSE,
  sondeo (polling), suscripciones, registro y middleware.

:::react

- [**`/data-client-react`**](https://skills.sh/reactive/data-client/data-client-react) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  y los hooks de mutación, y [depura tu aplicación en ejecución](./debugging.md#debugging-with-agents) con Chrome DevTools MCP.
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — escribe pruebas de React con `renderDataHook`,
  fixtures, interceptors y `nock`.

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  y composables de mutación con `DataClientPlugin`, y [depura tu aplicación en ejecución](./debugging.md#debugging-with-agents) con Chrome DevTools MCP.
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — escribe pruebas de Vue con `renderDataCompose`,
  `mountDataClient`, fixtures y `nock`.

:::

Consulta el catálogo completo en [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

## Documentación para LLMs {#docs-for-llms}

Los agentes sin skills pueden leer esta documentación como markdown simple, siguiendo la convención de [llms.txt](https://llmstxt.org):

- :react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] — índice de todas las páginas, con enlaces al markdown de cada una
- :react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] — toda la documentación de :react[React]:vue[Vue], REST y GraphQL en un solo archivo

Cualquier página de la documentación también está disponible como markdown añadiendo `.md` a su URL, como :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)].
