---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import Link from '@docusaurus/Link';

A maneira mais rápida de começar é deixar um [AI Agent](https://agentskills.io) fazer a instalação usando a skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup).

## Instalação {#install}

<SkillTabs skill="data-client-setup" />

Em seguida, execute a skill `/data-client-setup`. Ela detecta seu framework e o estilo da sua API (REST, GraphQL,
personalizada), instala as skills correspondentes listadas abaixo, configura o provider e migra os endpoints existentes.

### Instalar todas as skills de antemão {#install-all-skills-up-front}

Para instalar agora todas as skills do seu framework, sem deixar o agent executar as instalações:

<SkillTabs />

## Skills disponíveis {#available-skills}

- [**`/data-client-setup`**](https://skills.sh/reactive/data-client/data-client-setup) — instala e configura o Data Client para o seu framework e estilo de API, junto com as skills de que ele precisa.
- [**`/data-client-rest-setup`**](https://skills.sh/reactive/data-client/data-client-rest-setup) — configura o `@data-client/rest` e migra clientes
  `fetch`/`axios` existentes.
- [**`/data-client-endpoint-setup`**](https://skills.sh/reactive/data-client/data-client-endpoint-setup) — envolve funções assíncronas personalizadas com `Endpoint`
  para fluxos que não são REST nem GraphQL.
- [**`/data-client-graphql-setup`**](https://skills.sh/reactive/data-client/data-client-graphql-setup) — configura `@data-client/graphql` e `GQLEndpoint`
  para APIs GraphQL.
- [**`/data-client-schema`**](https://skills.sh/reactive/data-client/data-client-schema) — projeta `Entity`, `Collection`, `Union`, `Query`
  e schemas relacionados.
- [**`/data-client-rest`**](https://skills.sh/reactive/data-client/data-client-rest) — define APIs REST com `resource()`, `RestEndpoint`,
  métodos CRUD e parsing de respostas.
- [**`/data-client-manager`**](https://skills.sh/reactive/data-client/data-client-manager) — implementa `Manager`s personalizados para websockets, SSE,
  polling, subscriptions, logging e middleware.

:::react

- [**`/data-client-react`**](https://skills.sh/reactive/data-client/data-client-react) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  e hooks de mutação, e [depura seu app em execução](./debugging.md#debugging-with-agents) com o Chrome DevTools MCP.
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — escreve testes de React com `renderDataHook`,
  fixtures, interceptors e `nock`.

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  e composables de mutação com `DataClientPlugin`, e [depura seu app em execução](./debugging.md#debugging-with-agents) com o Chrome DevTools MCP.
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — escreve testes de Vue com `renderDataCompose`,
  `mountDataClient`, fixtures e `nock`.

:::

Veja o catálogo completo em [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

## Docs para LLMs {#docs-for-llms}

Agents sem skills podem ler estes docs como markdown simples, seguindo a convenção [llms.txt](https://llmstxt.org):

- :react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] — índice de todas as páginas, com links para o markdown de cada uma
- :react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] — todos os docs de :react[React]:vue[Vue], REST e GraphQL em um único arquivo

Qualquer página dos docs também está disponível como markdown adicionando `.md` à sua URL, como :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)].
