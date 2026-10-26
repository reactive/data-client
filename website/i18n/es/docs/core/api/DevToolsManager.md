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

En modo de desarrollo, `DevToolsManager` pone el store de la página en `globalThis.__DC__`: `__DC__.controller` es su
[Controller](/docs/api/Controller) y `__DC__.actions` sus acciones despachadas más recientes, incluidas las de la carga
de la página. Esto funciona en navegadores, React Native y Node, con o sin la extensión Redux DevTools.

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

Esto es útil para que los asistentes de programación con IA que usan una herramienta de navegador que ejecuta JavaScript de la página (como
el navegador integrado de Cursor, [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp) o [Playwright MCP](https://github.com/microsoft/playwright-mcp)),
o [Expo MCP](https://docs.expo.dev/eas/ai/mcp/) inspeccionen e interactúen programáticamente
con el store. Cada :react[[DataProvider](/docs/api/DataProvider)]:vue[[DataClientPlugin](./DataClientPlugin.md) instalado] se registra de forma independiente, por lo que
se admiten varios :react[providers]:vue[apps] en la misma página. Cuando un nombre ya está en uso, el siguiente
se registra como `'Data Client: My App (2)'`, y así sucesivamente; define `name` para dar a cada uno una clave reconocible. Donde no hay `window`, como en
el renderizado en el servidor, un store reemplaza al anterior con el mismo nombre, ya que los stores por petición nunca se limpian.

El registro de acciones conserva hasta el doble de [`maxAge`](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage)
acciones (100 por defecto) y omite los mismos fetches duplicados que omite la extensión. Para mantener bajo su uso de memoria, solo las
20 acciones más recientes conservan su `response`; las más antiguas conservan `type`, `key`, `endpoint`, `meta`, las respuestas
de error y los `args` de los endpoints sin efectos secundarios. Mientras un endpoint hace [polling](/rest/api/RestEndpoint#pollfrequency), el registro conserva solo sus últimas
`maxPollingActions` acciones por cada clave (endpoint y args) (4 por defecto, los dos últimos sondeos), para que el polling no desplace todo lo demás:

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { maxPollingActions: 10 },
});
```

</ProviderManagers>

Los controllers y sus registros se eliminan cuando se llama a `cleanup()`. Nada de esto existe en las compilaciones de producción.

## Más información {#more-info}

Usar este Manager permite [depurar e inspeccionar el store](../getting-started/debugging.md) en el navegador.
