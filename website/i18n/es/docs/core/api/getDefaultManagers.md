---
title: getDefaultManagers() - Configuración de managers para DataProvider
vue_title: getDefaultManagers() - Configuración de managers para DataClientPlugin
sidebar_label: getDefaultManagers
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# getDefaultManagers()

`getDefaultManagers` devuelve un Array de [Managers](./Manager.md) para enviar a :react[[&lt;DataProvider />](./DataProvider.md)]:vue[[DataClientPlugin](./DataClientPlugin.md)].

Esto facilita configurar y agregar [Managers](./Manager.md) personalizados, a la vez que te protege frente a
posibles cambios en los managers por defecto.

Actualmente devuelve \[[DevToolsManager](./DevToolsManager.md)\*, [NetworkManager](./NetworkManager.md), [SubscriptionManager](./SubscriptionManager.md)\].

\*(`DevToolsManager` se excluye en las compilaciones de producción.)

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

Cuando se omite `managers`, `DataClientPlugin` usa `getDefaultManagers()` sin argumentos.
Consulta [DataClientPlugin](./DataClientPlugin.md#options) para ver las
demás opciones.

:::

## Argumentos {#arguments}

Cada argumento representa la configuración de un manager. Puede ser de tres tipos:

- Cualquier objeto plano se usa como opciones que se envían al constructor del manager.
- Una instancia del manager que se usará directamente.
- `null`. Al enviarlo, se excluye el manager.

```ts
getDefaultManagers({
  devToolsManager: { trace: true },
  networkManager: new NetworkManager({ errorExpiryLength: 1 }),
  subscriptionManager: null,
});
```

### networkManager {#networkmanager}

:::note

`null` no está permitido aquí porque NetworkManager es obligatorio

:::

`dataExpiryLength` se usa como valor de respaldo cuando un Endpoint no tiene definido [dataExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointdataexpirylength).

`errorExpiryLength` se usa como valor de respaldo cuando un Endpoint no tiene definido [errorExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointerrorexpirylength).

### devToolsManager {#devtoolsmanager}

[Argumentos](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
que se envían a redux devtools.

### subscriptionManager {#subscriptionmanager}

Una clase que implementa `SubscriptionConstructable`, como [PollingSubscription](./PollingSubscription.md)

## Ejemplos {#examples}

### Rastreo de acciones {#tracing-actions}

Por ejemplo, podemos habilitar la opción [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) para ayudar a rastrear desde dónde se despachan las acciones. Esto tiene un gran impacto en el rendimiento, por lo que normalmente está deshabilitada.

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

### Herencia de managers {#manager-inheritance}

Enviar instancias de manager nos permite personalizar los managers mediante herencia.

:::react

```ts
import { getDefaultManagers, IdlingNetworkManager } from '@data-client/react';

const managers = getDefaultManagers({
  networkManager: new IdlingNetworkManager(),
});
```

`IdlingNetworkManager` puede evitar los tirones retrasando los fetch sin [sideEffect](/rest/api/Endpoint#sideeffect) (de solo lectura/GET)
hasta que terminen las animaciones. Funciona en la web mediante [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback), y en React Native mediante InteractionManager.runAfterInteractions.

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

### Deshabilitar {#disabling}

Usar `null` elimina los managers por completo. [NetworkManager](./NetworkManager.md) no se puede eliminar de esta forma.

```ts
const managers = getDefaultManagers({
  devToolsManager: null,
  subscriptionManager: null,
});
```

Aquí deshabilitamos todos los managers excepto [NetworkManager](./NetworkManager.md).

:::react

### Coin App {#coin-app}

Se transmiten nuevos precios muchas veces por segundo; para reducir el ruido en las devtools, lo configuramos
para ignorar las acciones [SET](./Controller.md#set) de `Ticker`.

<StackBlitz app="coin-app" file="src/index.tsx,src/resources/StreamManager.ts,src/getManagers.ts" height="580" />

:::
