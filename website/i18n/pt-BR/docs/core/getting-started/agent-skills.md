---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import AgentOnly from '@site/src/components/AgentOnly';

## Instale as skills para obter os melhores resultados {#install-skills-for-best-results}

Os agents acertam o básico só pelo nome do pacote. As [skills](https://agentskills.io) ensinam a eles as
APIs atuais para o restante, como fixtures de teste e managers em tempo real.

Se o seu app já tem pacotes `@data-client`, vincule as skills que eles incluem, correspondentes às suas versões:

```bash framed
npx --no data-client-skills
```

Caso contrário, instale a skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup):

<SkillTabs skill="data-client-setup" framed />

Em seguida, execute-a no chat do seu agent:

```prompt framed
/data-client-setup
```

Ela detecta seu framework e o estilo da sua API (REST, GraphQL, personalizada), instala as skills correspondentes listadas abaixo,
configura o provider e migra os endpoints existentes.

### Instalar todas as skills de antemão {#install-all-skills-up-front}

Para instalar agora todas as skills do seu framework, sem deixar o agent executar as instalações:

<SkillTabs />

A aba **Installed packages** vincula as skills que cada pacote `@data-client/*` instalado inclui em `.agents/skills`
(com `.claude/skills` apontando para ele), onde o Claude Code, o Cursor e o Codex as carregam, correspondentes à versão desse pacote. Faça commit dos links. Eles acompanham as atualizações,
e executá-lo novamente captura as skills dos pacotes que você adicionar ou atualizar. No Windows, faça commit dos links somente com o Modo de Desenvolvedor ativado e
`git config core.symlinks true`; caso contrário, deixe-os sem commit e execute o comando novamente após a instalação. Os plugins do Claude Code, do Cursor e do Codex configuram apps que ainda não têm o Data
Client. Se você usa o [TanStack Intent](https://tanstack.com/intent), ele carrega as mesmas skills dos pacotes.

### Skills disponíveis {#available-skills}

- [**`/data-client`**](https://skills.sh/reactive/data-client/data-client) — é o ponto de partida quando você pede ao seu agent para adicionar ou usar o Data Client, e o encaminha para a configuração ou para a skill da tarefa.
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
  e hooks de mutação, e [depura seu app em execução](./debugging.md#debugging-with-agents) a partir de uma ferramenta de navegador como o navegador do Cursor, o Chrome DevTools MCP ou o Playwright MCP.
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — escreve testes de React com `renderDataHook`,
  fixtures, interceptors e `nock`.

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — usa `useSuspense`, `useFetch`, `useQuery`, `useLive`
  e composables de mutação com `DataClientPlugin`, e [depura seu app em execução](./debugging.md#debugging-with-agents) a partir de uma ferramenta de navegador como o navegador do Cursor, o Chrome DevTools MCP ou o Playwright MCP.
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — escreve testes de Vue com `renderDataCompose`,
  `mountDataClient`, fixtures e `nock`.

:::

Veja o catálogo completo em [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client).

## Configurar manualmente {#set-up-by-hand}

Para instalar os pacotes e adicionar o provider por conta própria, siga a [Instalação](./installation.md).

<AgentOnly>

Todas as páginas dos docs também estão disponíveis como markdown adicionando `.md` à sua URL, como :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)].
:react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] lista todas elas, e
:react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] reúne todos os docs de :react[React]:vue[Vue], REST e GraphQL em um único arquivo.

</AgentOnly>
