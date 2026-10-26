---
title: DevToolsManager
sidebar_label: DevToolsManager
---

import ProviderManagers from '../shared/_provider_managers.mdx';

```typescript
class DevToolsManager implements Manager
```

Integra-se ao [Redux DevTools](https://github.com/reduxjs/redux-devtools) para acompanhar o
estado e as [actions](./Actions.md). Nota: não integra o time-travel.

Adicione a [extensão do Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
ou a [extensão do Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/) ao seu
navegador para começar.

:::info implementa

`DevToolsManager` implementa [Manager](./Manager.md)

:::

## constructor(options?, skipLogging?) {#constructoroptions-skiplogging}

### options {#options}

[Argumentos](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
a enviar ao redux devtools.

Por exemplo, podemos habilitar a opção [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) para ajudar a descobrir de onde as actions são despachadas.

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

</ProviderManagers>

### skipLogging {#skiplogging}

`(action: ActionTypes) => boolean`

Permite ignorar o registro de algumas actions no devtool do navegador.

Por padrão, ignora as [fetch actions](./Controller.md#fetch) em andamento

<ProviderManagers imports={['DevToolsManager', 'getDefaultManagers']}>

```ts
// production builds leave out DevToolsManager
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: new DevToolsManager(undefined, () => true),
});
```

</ProviderManagers>

#### Ignorando atualizações de alta frequência {#skipping-high-frequency-updates}

Ao usar [WebSockets](../concepts/managers.md#data-stream) ou outras fontes de dados em tempo real,
atualizações de alta frequência podem sobrecarregar a extensão DevTools. Use a opção `predicate` para
filtrar tipos de action ou schemas específicos:

```ts title="managers.ts" framework-imports
import { getDefaultManagers, actionTypes } from '@data-client/react';
import { Ticker } from './resources/Ticker';

const managers = getDefaultManagers({
  devToolsManager: {
    // Increase latency buffer for high-frequency updates
    latency: 1000,
    // Skip WebSocket SET actions for Ticker to reduce log spam
    // (including batched set([Ticker], rows) writes)
    // highlight-start
    predicate: (state, action) =>
      action.type !== actionTypes.SET ||
      (action.schema !== Ticker && action.schema[0] !== Ticker),
    // highlight-end
  },
});
```

## Acesso programático à store {#controllers}

Em modo de desenvolvimento, o `DevToolsManager` coloca a store da página em `globalThis.__DC__`: `__DC__.controller` é o seu
[Controller](/docs/api/Controller) e `__DC__.actions` são as ações despachadas mais recentes, incluindo as do
carregamento da página. Isso funciona em navegadores, React Native e Node, com ou sem a extensão Redux DevTools.

```js title="Browser DevTools console"
__DC__.controller.getState();

// Last 10 actions
__DC__.actions.slice(-10);

// Response for a key in the action log, without importing its endpoint
const c = __DC__.controller;
const a = __DC__.actions.findLast(
  a => a.args && !a.endpoint?.sideEffect && a.key?.includes('/todos'),
);
c.getResponse(a.endpoint, ...a.args, c.getState()).data;

// With several stores, pick one by key
__DC__.stores; // ['Data Client: My App', 'Data Client: My App (2)']
__DC__.store = 'Data Client: My App (2)';
```

Isso é útil para assistentes de programação com IA que usam uma ferramenta de navegador que executa JavaScript da página (como
o navegador integrado do Cursor, o [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp) ou o [Playwright MCP](https://github.com/microsoft/playwright-mcp)),
ou o [Expo MCP](https://docs.expo.dev/eas/ai/mcp/) para inspecionar e interagir programaticamente
com a store. Cada :react[[DataProvider](/docs/api/DataProvider)]:vue[[DataClientPlugin](./DataClientPlugin.md) instalado] se registra de forma independente, portanto
vários :react[providers]:vue[apps] na mesma página são suportados. Quando um nome já está em uso, o próximo
se registra como `'Data Client: My App (2)'`, e assim por diante; defina `name` para dar a cada um uma chave reconhecível. Onde não há `window`, como na
renderização no servidor, um store substitui o anterior com o mesmo nome, já que os stores por requisição nunca são limpos.

O log de ações mantém até o dobro de [`maxAge`](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage)
ações (100 por padrão) e ignora os mesmos fetches duplicados que a extensão ignora. Para manter o uso de memória baixo, apenas as
20 ações mais recentes mantêm seu `response`; as mais antigas mantêm `type`, `key`, `endpoint`, `meta`, as respostas
de erro e os `args` de endpoints sem efeitos colaterais. Enquanto um endpoint faz [polling](/rest/api/RestEndpoint#pollfrequency), o log mantém apenas as últimas
`maxPollingActions` ações de cada chave (endpoint e args) (4 por padrão, os dois últimos polls), para que o polling não expulse todo o resto:

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { maxPollingActions: 10 },
});
```

</ProviderManagers>

Os Controllers e seus logs são removidos quando `cleanup()` é chamado. Nada disso existe em builds de produção.

## Mais informações {#more-info}

Usar este Manager permite [depurar e inspecionar a store](../getting-started/debugging.md) no navegador.
