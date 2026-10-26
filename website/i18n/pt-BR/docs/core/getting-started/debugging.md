---
title: Depuração e inspeção
sidebar_label: Depuração
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';
import DevtoolsDebugging from '../_agents/devtools-debugging.md';

<SiteOnly>

## Depuração com agents {#debugging-with-agents}

[`globalThis.__DC__`](../api/DevToolsManager.md#controllers) permite que agents inspecionem o store do Data Client do seu
app em desenvolvimento: seu estado, ações e erros recentes, para que o seu agente de código depure o que você vê. Peça a ele:

```prompt
The todo list still shows the old title after I save. Find out why.
```

Com as [skills](./agent-skills.md) do Data Client configuradas, ele encontra a causa no store em vez de adivinhar pelo código. Ele
precisa de uma ferramenta de navegador que execute JavaScript na página: o navegador do Cursor,
o [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp),
o [Playwright MCP](https://github.com/microsoft/playwright-mcp) ou o Claude in Chrome.

Se a depuração não funcionar com o seu agent ou ferramenta de navegador, [abra uma issue](https://github.com/reactive/data-client/issues/new?template=bug_report.md&title=Agent%20debugging%3A%20)
citando ambos para que possamos oferecer suporte. Ou peça ao seu agent que a escreva:

```prompt
Debugging this app through globalThis.__DC__ didn't work with you and your browser tool. Search reactive/data-client issues for one about this pair; if there's none, draft a bug report from its .github/ISSUE_TEMPLATE/bug_report.md titled "Agent debugging: <agent> + <browser tool>" with both names and versions, the app's @data-client versions, whether globalThis.__DC__ was defined, what you ran and the exact error, and no app data or secrets. Show me the draft before filing it with gh issue create.
```

</SiteOnly>

<AgentOnly>

<DevtoolsDebugging />

## Depuração manual {#manual-debugging}

Se o usuário quiser inspecionar o store por conta própria, envie-o para as etapas da extensão Redux DevTools em
:react[https://dataclient.io/docs/getting-started/debugging#manual-debugging]:vue[https://dataclient.io/vue/getting-started/debugging#manual-debugging].

</AgentOnly>

<SiteOnly>

## Depuração manual {#manual-debugging-1}

Se você prefere inspecionar tudo por conta própria, o fluxo de devtools do navegador abaixo continua
sendo o caminho manual padrão.

### Instalação {#installation}

Adicione a extensão do navegador para
[Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
ou
[Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Abrir as devtools {#open-dev-tools}

:::react

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![botão do redux-devtools no navegador](/img/devtools-browser-button.png)
<span style={{display:'inline-block',width:'40px',height:'40px'}}>
![botão do reactive data client](/img/client-logo.svg)
</span>
</span>

:::

:::vue

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![botão do redux-devtools no navegador](/img/devtools-browser-button.png)
</span>

:::

Depois de instalar e carregar seu site no :react[[modo de desenvolvimento](https://webpack.js.org/guides/development/)]:vue[[modo de desenvolvimento](https://vite.dev/guide/env-and-mode)], :react[você pode
clicar no logo do <abbr title="Reactive Data Client">Data Client</abbr> (por padrão no canto inferior direito da janela) ou no
logo do redux-devtool na barra de endereço.]:vue[clique no logo do redux-devtool na barra de endereço.]

Isso abrirá o inspetor, que permite observar as actions despachadas,
seu efeito no estado do store, bem como o estado atual do store.

:::react

O logo do <abbr title="Reactive Data Client">Data Client</abbr> só aparece no modo de desenvolvimento. No entanto, sua
posição pode ser alterada ou ele pode ser totalmente desativado definindo a [prop devButton do DataProvider](../api/DataProvider.md#devbutton).

:::

![devtools do navegador](/img/devtool-action.png 'Reactive Data Client devtools')

O [Controller](../api/Controller.md) despacha actions, o que torna essa página útil para entender
quais actions você está vendo. Aqui observamos as actions comuns de [fetch](../api/Controller.md#fetch)
e [setResponse](../api/Controller.md#setResponse).

:::note

Por padrão, a integração com as devtools filtra actions de [fetch](../api/Controller.md#fetch) duplicadas.
Isso pode ser alterado com a opção [skipLogging](../api/DevToolsManager.md#skiplogging).

:::

### Fluxo de controle {#control-flow}

O <abbr title="Reactive Data Client">Data Client</abbr> usa o padrão de [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/), tornando a depuração
simples, já que cada mudança é rastreável e descritiva.

<div style={{textAlign:'center'}}>
<ThemedImage
  alt="FLUX"
  sources={{
    light: useBaseUrl('/img/diagrams/flux-simple.png'),
    dark: useBaseUrl('/img/diagrams/flux-simple-dark.png'),
  }}
  style={{maxHeight:"260px"}}
/>
</div>

> [Mais sobre o fluxo de controle](../concepts/managers.md)

### Inspeção de estado {#state-inspection}

Quando [schemas](/rest/api/schema) são usados, as respostas são [normalizadas](../concepts/normalization.md) nas tabelas `entities`
e `endpoints`. Isso traz vantagens automáticas de desempenho em relação a caches de fetch simples de chave-valor, especialmente
benéficas com dados dinâmicos (que mudam). Isso também elimina bugs de inconsistência de dados.

![Inspetor de estado das devtools](/img/devtool-state.png 'Inspetor de estado das devtools do Reactive Data Client')

Clique na aba **'state'**
nas devtools para ver todo o estado do store. Isso pode ser útil para determinar exatamente onde os dados estão. Há
também uma seção 'meta' do cache com informações como quando a requisição ocorreu (útil para [TTL](../concepts/expiry-policy.md)).

### Diff de estado {#state-diff}

Para monitorar a resposta de um fetch específico, pode ser mais útil ver como o store é atualizado.
Clique na aba 'Diff' para ver o que mudou.

![Inspetor de diff das devtools](/img/devtool-diff.png 'Diff das devtools do Reactive Data Client')

Aqui alternamos o status 'completed' de um todo usando uma [atualização otimista](/rest/guides/optimistic-updates).

### Rastreamento de actions {#action-tracing}

O rastreamento não vem habilitado por padrão, pois é computacionalmente muito custoso. No entanto, pode ser muito útil
para descobrir de onde as [actions](../api/Actions.md) são despachadas. Personalize o [DevToolsManager](../api/DevToolsManager.md)
definindo a opção trace como `true` com [getDefaultManagers](../api/getDefaultManagers.md):

:::react

```tsx title="index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import App from './App.vue';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');
```

:::

</SiteOnly>
