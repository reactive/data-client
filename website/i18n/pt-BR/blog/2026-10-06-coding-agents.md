---
title: Data Client para Coding Agents
description: Agent skills, um plugin do Claude Code, depuração com Chrome DevTools MCP e llms.txt ajudam coding agents a escrever, depurar e atualizar apps com Data Client
image: /img/social/coding-agents-card.png
authors: [ntucker]
tags: [agents, vue]
draft: true
---

import SkillTabs from '@site/src/components/SkillTabs';

Coding agents escrevem muito código com Data Client hoje, e escrevem melhor quando têm a documentação e os
fluxos de trabalho atuais em vez de adivinhar a partir de versões antigas. Este ciclo de lançamento torna isso mais fácil de configurar para qualquer agent.

**Novidades:**

- [Plugin do Claude Code](/blog/2026/10/06/coding-agents#claude-plugin) - `claude plugin install react@data-client` instala as skills do seu framework
- [Skills de Vue](/blog/2026/10/06/coding-agents#vue-skills) - Projetos Vue recebem composables e testes de Vue, não hooks de React
- [llms.txt](/blog/2026/10/06/coding-agents#llms-txt) - Qualquer agent pode ler a documentação como markdown, e cada página indica onde procurar

**Também disponível:**

- [Agent skills](/blog/2026/10/06/coding-agents#skills) - Defina APIs REST, projete schemas, escreva Managers e teste; o [/data-client-setup](/blog/2026/10/06/coding-agents#setup) agora instala só as que você precisa, e elas são [geradas a partir desta documentação](/blog/2026/10/06/coding-agents#generated-references)
- [Chrome DevTools MCP](/blog/2026/10/06/coding-agents#debugging) - Agents inspecionam a store do seu app em execução, ou usam o Expo MCP para React Native
- [Skills de atualização](/blog/2026/10/06/coding-agents#upgrades) - Skills de migração atualizam seu código, inclusive o que os codemods não conseguem

{/* truncate */}

## Primeiros passos {#setup}

Instale a skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup) e execute-a. Ela
detecta React ou Vue e o estilo da sua API (REST, GraphQL ou personalizada), instala as skills que o seu projeto precisa e configura o
Data Client. Para REST, ela delega para
[data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup), que migra chamadas `fetch` ou
axios existentes para endpoints ([#4153](https://github.com/reactive/data-client/pull/4153)).

<SkillTabs skill="data-client-setup" />

[Agent Skills](/docs/getting-started/agent-skills) lista todas as skills e como instalá-las todas de antemão.

## Plugin do Claude Code {#claude-plugin}

O repositório do Data Client é um marketplace de plugins do Claude Code. O plugin `core` contém as skills de setup, REST, GraphQL, schema e
Manager; os plugins `react` e `vue` adicionam as skills do seu framework e trazem o `core` junto; e o plugin `migrations`
adiciona as skills de atualização ([#4153](https://github.com/reactive/data-client/pull/4153)). A página
[Agent Skills](/docs/getting-started/agent-skills) mostra a mesma instalação com a CLI de skills e o OpenSkills.

```bash
claude plugin marketplace add reactive/data-client
claude plugin install react@data-client
```

Use `vue@data-client` para Vue, `core@data-client` para nenhum dos dois, e adicione `migrations@data-client` antes de uma atualização.

## Skills de Vue {#vue-skills}

Projetos Vue costumavam receber a skill de hooks do React, então os agents recorriam a padrões de React. A skill
[data-client-vue](https://skills.sh/reactive/data-client/data-client-vue) escreve código com `DataClientPlugin` e composables,
e [depura um app em execução](/vue/getting-started/debugging#debugging-with-agents)
([#4126](https://github.com/reactive/data-client/pull/4126)).
[data-client-vue-testing](https://skills.sh/reactive/data-client/data-client-vue-testing) escreve testes com `renderDataCompose()`
e `mountDataClient()` ([#4126](https://github.com/reactive/data-client/pull/4126)) que seguem os
[guias de testes para Vue](/vue/guides/unit-testing-composables) ([#4181](https://github.com/reactive/data-client/pull/4181)).

## llms.txt {#llms-txt}

Agents sem skills podem ler a documentação como markdown, seguindo a convenção [llms.txt](https://llmstxt.org)
([#4171](https://github.com/reactive/data-client/pull/4171), [#4236](https://github.com/reactive/data-client/pull/4236)):

- [llms.txt](https://dataclient.io/llms.txt) para React e [vue/llms.txt](https://dataclient.io/vue/llms.txt) para Vue indexam todas as páginas, e o `llms-full.txt` ao lado de cada um reúne todas elas em um único arquivo
- [rest/llms.txt](https://dataclient.io/rest/llms.txt) e [graphql/llms.txt](https://dataclient.io/graphql/llms.txt) cobrem apenas a API daquele pacote
- Qualquer página da documentação vira markdown quando você adiciona `.md` à sua URL, como [/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)

Toda página referencia seu llms.txt no `<head>`, e toda página da documentação referencia seu markdown, então um agent que receba a URL de qualquer página
os encontra sozinho.

## Skills acompanham a documentação {#generated-references}

As páginas de referência das skills agora são geradas por framework a partir desta documentação, então trazem trechos compartilhados como comandos de
instalação e dão aos projetos Vue apenas código Vue. Uma verificação de CI falha quando uma skill diverge da documentação, então as skills se mantêm
atualizadas a cada lançamento ([#4170](https://github.com/reactive/data-client/pull/4170)).

## Também disponível {#also-available}

### Skills para cada tarefa {#skills}

Além do setup, há skills para cada parte de um app com Data Client. O `/data-client-setup` instala as que o seu projeto
usa:

- [data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup) migra clientes `fetch`, axios, ky, got ou superagent para [RestEndpoint](/rest/api/RestEndpoint), junto com o [guia de migração do axios](/rest/guides/axios-migration) e seu codemod ([#3867](https://github.com/reactive/data-client/pull/3867))
- [data-client-graphql-setup](https://skills.sh/reactive/data-client/data-client-graphql-setup) e [data-client-endpoint-setup](https://skills.sh/reactive/data-client/data-client-endpoint-setup) cobrem GraphQL e funções assíncronas personalizadas
- [data-client-rest](https://skills.sh/reactive/data-client/data-client-rest) define APIs com [resource()](/rest/api/resource) e [RestEndpoint](/rest/api/RestEndpoint)
- [data-client-schema](https://skills.sh/reactive/data-client/data-client-schema) projeta schemas [Entity](/rest/api/Entity), [Collection](/rest/api/Collection), [Union](/rest/api/Union) e [Query](/rest/api/Query)
- [data-client-manager](https://skills.sh/reactive/data-client/data-client-manager) escreve [Managers](/docs/concepts/managers) para websockets, SSE, polling e logging
- [data-client-react](https://skills.sh/reactive/data-client/data-client-react) e [data-client-react-testing](https://skills.sh/reactive/data-client/data-client-react-testing) usam e testam os hooks do React

Veja todas em [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

### Depure um app em execução {#debugging}

Pergunte ao seu agent "por que isso não buscou de novo?" ou "o que está no cache agora?" e ele pode verificar o app em execução em vez
de adivinhar a partir do código. Em modo de desenvolvimento, o [DevToolsManager](/docs/api/DevToolsManager#controllers) coloca o
[Controller](/docs/api/Controller) de cada store em `globalThis.__DC_CONTROLLERS__`, então um agent conectado via
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), ou
[Expo MCP](https://docs.expo.dev/eas/ai/mcp/) para React Native, pode ler a store, acompanhar as ações despachadas e
relacioná-las às requisições de rede. O mapa está disponível em navegadores, React Native e Node
([#3753](https://github.com/reactive/data-client/pull/3753)).

```js title="Browser DevTools console"
__DC_CONTROLLERS__.get('Data Client: My App').getState();
```

As skills de React e Vue fazem isso por meio do Chrome DevTools MCP; veja
[depuração com agents](/docs/getting-started/debugging#debugging-with-agents) para saber o que elas conseguem inspecionar.

### Skills de atualização {#upgrades}

As skills também cuidam de atualizações. A skill da v0.18 executa o [codemod](/codemods/v0.18.js) e depois trata do que ele não consegue, como
registrar [`argsKey`](/rest/api/SchemaSimple) para schemas cuja saída depende dos argumentos do endpoint
([migração para a v0.18](/blog/2026/05/01/v0.18-scalar-typed-downloads#migration-guide)). A skill do path-to-regexp v8 reescreve a
[sintaxe de paths](/blog/2026/04/01/v0.16-parallel-fetching-collection-move-lazy#path-to-regexp-v8) nos seus endpoints.

<SkillTabs skills={['data-client-v0.18-migration', 'path-to-regexp-v8-migration']} />
