---
title: getDefaultManagers() - Configurando managers para o DataProvider
vue_title: getDefaultManagers() - Configurando managers para o DataClientPlugin
sidebar_label: getDefaultManagers
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# getDefaultManagers()

`getDefaultManagers` retorna um Array de [Managers](./Manager.md) para ser enviado ao :react[[&lt;DataProvider />](./DataProvider.md)]:vue[[DataClientPlugin](./DataClientPlugin.md)].

Isso facilita configurar e adicionar [Managers](./Manager.md) personalizados, mantendo a robustez diante de
possíveis mudanças nos managers padrão.

Atualmente retorna \[[DevToolsManager](./DevToolsManager.md)\*, [NetworkManager](./NetworkManager.md), [SubscriptionManager](./SubscriptionManager.md)\].

\*(`DevToolsManager` é excluído nos builds de produção.)

## Uso {#usage}

<ProviderManagers imports={['getDefaultManagers']}>

```ts
// highlight-start
const managers = getDefaultManagers({
  // set fallback expiry time to an hour
  networkManager: { dataExpiryLength: 1000 * 60 * 60 },
});
// highlight-end
```

</ProviderManagers>

:::vue

Quando `managers` é omitido, o `DataClientPlugin` usa `getDefaultManagers()` sem argumentos.
Veja [DataClientPlugin](./DataClientPlugin.md#options) para as
outras opções.

:::

## Argumentos {#arguments}

Cada argumento representa a configuração de um manager. Ele pode ser de três tipos:

- Qualquer objeto simples é usado como opções a serem enviadas ao construtor do manager.
- Uma instância do manager, usada diretamente.
- `null`. Quando enviado, exclui o manager.

```ts
getDefaultManagers({
  devToolsManager: { trace: true },
  networkManager: new NetworkManager({ errorExpiryLength: 1 }),
  subscriptionManager: null,
});
```

### networkManager {#networkmanager}

:::note

`null` não é permitido aqui, pois o NetworkManager é obrigatório

:::

`dataExpiryLength` é usado como fallback quando um Endpoint não tem [dataExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointdataexpirylength) definido.

`errorExpiryLength` é usado como fallback quando um Endpoint não tem [errorExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointerrorexpirylength) definido.

### devToolsManager {#devtoolsmanager}

[Argumentos](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
a enviar ao redux devtools.

### subscriptionManager {#subscriptionmanager}

Uma classe que implementa `SubscriptionConstructable`, como [PollingSubscription](./PollingSubscription.md)

## Exemplos {#examples}

### Rastreando actions {#tracing-actions}

Por exemplo, podemos ativar a opção [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) para ajudar a descobrir de onde as actions são despachadas. Ela tem um grande impacto no desempenho, por isso normalmente fica desativada.

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

### Herança de managers {#manager-inheritance}

Enviar instâncias de managers nos permite personalizá-los por meio de herança.

:::react

```ts
import { getDefaultManagers, IdlingNetworkManager } from '@data-client/react';

const managers = getDefaultManagers({
  networkManager: new IdlingNetworkManager(),
});
```

O `IdlingNetworkManager` pode evitar travamentos ao adiar os fetches sem [sideEffect](/rest/api/Endpoint#sideeffect) (somente leitura/GET)
até que as animações terminem. Na web isso funciona com [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback), e no react native com InteractionManager.runAfterInteractions.

:::

:::vue

```ts
import {
  NetworkManager,
  getDefaultManagers,
  type FetchAction,
} from '@data-client/vue';

class LoggingNetworkManager extends NetworkManager {
  protected handleFetch(action: FetchAction) {
    console.log('fetching', action.key);
    return super.handleFetch(action);
  }
}

const managers = getDefaultManagers({
  networkManager: new LoggingNetworkManager(),
});
```

:::

### Desativando {#disabling}

Usar `null` remove os managers por completo. O [NetworkManager](./NetworkManager.md) não pode ser removido dessa forma.

```ts
const managers = getDefaultManagers({
  devToolsManager: null,
  subscriptionManager: null,
});
```

Aqui desativamos todos os managers, exceto o [NetworkManager](./NetworkManager.md).

:::react

### Coin App {#coin-app}

Novos preços chegam por streaming muitas vezes por segundo; para reduzir o spam nas devtools, configuramos
para ignorar as actions [SET](./Controller.md#set) de `Ticker`.

<StackBlitz app="coin-app" file="src/index.tsx,src/resources/StreamManager.ts,src/getManagers.ts" height="580" />

:::
