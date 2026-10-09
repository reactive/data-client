---
title: Depuração e inspeção
sidebar_label: Depuração
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

## Depuração com agents {#debugging-with-agents}

Para muitas tarefas de depuração, o caminho mais rápido é usar um agent que já conheça o fluxo de depuração do
:react[`@data-client/react`]:vue[`@data-client/vue`].

Instale a :react[[skill `data-client-react`](https://skills.sh/reactive/data-client/data-client-react)]:vue[[skill `data-client-vue`](https://skills.sh/reactive/data-client/data-client-vue)]
no seu agent de código e então peça a ele que inspecione a página atual ou o estado do app.

### Como funciona a depuração com agents {#how-agent-debugging-works}

No modo de desenvolvimento, o [DevToolsManager](../api/DevToolsManager.md) expõe instâncias ativas de `Controller` para que um agent possa inspecionar
o estado do cache, os metadados dos endpoints e as actions despachadas diretamente do app em execução.

Tecnicamente, esses controllers ficam armazenados em [`globalThis.__DC_CONTROLLERS__`](../api/DevToolsManager.md#controllers), que é um
`Map` global do navegador. Você pode pensar nele como um registro temporário do modo de desenvolvimento que permite que ferramentas
e agents localizem os stores ativos do :react[`DataProvider`]:vue[`DataClientPlugin`] da página atual.

Em alto nível, o agent pode:

- descobrir os controllers ativos do :react[`DataProvider`]:vue[`DataClientPlugin`]
- ler o estado do cache normalizado ou desnormalizado
- inspecionar fetches, respostas, erros e invalidações recentes
- correlacionar mudanças no store com a atividade de rede do navegador
- acionar operações seguras do controller, como invalidação ou expiração, para investigação

Isso é útil quando você quer uma resposta rápida para perguntas como "por que isso não fez refetch?",
"o que há no cache agora?" ou "qual action atualizou esta entity?" sem precisar
navegar manualmente por cada painel do inspetor.

A skill faz isso por meio do [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp).

## Depuração manual {#manual-debugging}

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
