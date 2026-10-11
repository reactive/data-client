---
title: DevToolsManager
sidebar_label: DevToolsManager
---

import ProviderManagers from '../shared/_provider_managers.mdx';

```typescript
class DevToolsManager implements Manager
```

Se integra con [Redux DevTools](https://github.com/reduxjs/redux-devtools) para hacer seguimiento del
estado y las [acciones](./Actions.md). Nota: no se integra con el viaje en el tiempo.

Agrega la [extensión de Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
o la [extensión de Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/) a tu
navegador para empezar.

:::info implements

`DevToolsManager` implementa [Manager](./Manager.md)

:::

## constructor(options?, skipLogging?) {#constructoroptions-skiplogging}

### options {#options}

[Argumentos](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
que se envían a redux devtools.

Por ejemplo, podemos habilitar la opción [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) para ayudar a rastrear desde dónde se despachan las acciones.

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

Permite omitir algunas acciones para que no se registren en las devtools del navegador.

Por defecto omite las [acciones fetch](./Controller.md#fetch) en curso

<ProviderManagers imports={['DevToolsManager', 'getDefaultManagers']}>

```ts
// production builds leave out DevToolsManager
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: new DevToolsManager(undefined, () => true),
});
```

</ProviderManagers>

#### Omitir actualizaciones de alta frecuencia {#skipping-high-frequency-updates}

Al usar [WebSockets](../concepts/managers.md#data-stream) u otras fuentes de datos en tiempo real,
las actualizaciones de alta frecuencia pueden saturar la extensión DevTools. Usa la opción `predicate` para
filtrar tipos de acciones o schemas específicos:

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

## Acceso programático al store {#controllers}

En modo de desarrollo, `DevToolsManager` registra cada [Controller](/docs/api/Controller) en
`globalThis.__DC_CONTROLLERS__`, un `Map` cuya clave es el nombre de la conexión de devtools. Esto funciona
en navegadores, React Native y Node.

```js title="Browser DevTools console"
// List all registered providers
__DC_CONTROLLERS__.keys();

// Get state from the first provider
__DC_CONTROLLERS__.values().next().value.getState();

// Get state by name
__DC_CONTROLLERS__.get('Data Client: My App').getState();
```

Esto es útil para que los asistentes de programación con IA que usan [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp)
o [Expo MCP](https://docs.expo.dev/eas/ai/mcp/) inspeccionen e interactúen programáticamente
con el store. Cada :react[[DataProvider](/docs/api/DataProvider)]:vue[[DataClientPlugin](./DataClientPlugin.md) instalado] se registra de forma independiente, por lo que
se admiten sin problema varios :react[providers]:vue[apps] en la misma página.

Los controllers se eliminan del mapa cuando se llama a `cleanup()`.

## Más información {#more-info}

Usar este Manager permite [depurar e inspeccionar el store](../getting-started/debugging.md) en el navegador.
