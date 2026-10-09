---
title: Orquestación centralizada de efectos secundarios con React
vue_title: Orquestación centralizada de efectos secundarios con Vue
sidebar_label: Managers y Middleware
description: Acceso programático seguro al store global. Permite efectos secundarios totalmente extensibles y escalables.
image: /img/social/managers-card.png
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import StackBlitz from '@site/src/components/StackBlitz';
import BatchSetDemo from '../shared/\_BatchSetDemo.mdx';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Managers y Middleware

<!-- global useEffect - centralized orchestration (talk about the problem we're solving - global side effects) -->

<!-- controller.set -> dispatch(createSet()) -> DevToolsManager -> NetworkManager -> SubManager -> reducer -> state -->

Reactive Data Client usa el patrón de [store flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/), que se
caracteriza por ser fácil de [entender y depurar](../getting-started/debugging.md) gracias al [flujo de datos unidireccional](<https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)>) del store. Las actualizaciones de estado las realiza una [función reducer](https://github.com/reactive/data-client/blob/master/packages/core/src/state/reducer/createReducer.ts#L19).

<ThemedImage
alt="Flujo flux de los Managers"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

En las arquitecturas flux, es fundamental que todas las funciones del ciclo flux sean :react[[puras](https://react.dev/learn/keeping-components-pure)]:vue[[puras](https://en.wikipedia.org/wiki/Pure_function)].
Los Managers proporcionan una orquestación centralizada de los efectos secundarios. En otras palabras, son el medio para interactuar
con el mundo exterior a <abbr title="Reactive Data Client">Data Client</abbr>.

Por ejemplo, [NetworkManager](../api/NetworkManager.md) orquesta la obtención de datos y [SubscriptionManager](../api/SubscriptionManager.md)
lleva el registro de qué recursos están suscritos con [useLive](../api/useLive.md) o [useSubscription](../api/useSubscription.md). Al centralizar el control, [NetworkManager](../api/NetworkManager.md) deduplica automáticamente los fetches, y [SubscriptionManager](../api/SubscriptionManager.md)
mantendrá actualizados solo los recursos que se están renderizando activamente.

Esto convierte a los [Managers](../api/Manager.md) en la mejor forma de integrar efectos secundarios adicionales como
[registro (logging)](#middleware-logging), [reporte de errores](#error-reporting), [métricas](#metrics),
[notificaciones](#notifications), [flujos de datos](#data-stream), [actualización al recuperar el foco o la conexión](#refresh-on-focus),
[sincronización entre pestañas](#cross-tab-sync) y [persistencia sin conexión](#persistence).
También se pueden personalizar para cambiar comportamientos centrales.

| Managers por defecto                                 |                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NetworkManager](../api/NetworkManager.md)           | Convierte los dispatches de fetch en llamadas de red                                 |
| [SubscriptionManager](../api/SubscriptionManager.md) | Maneja las [suscripciones](../getting-started/data-dependency.md#subscriptions) de sondeo (polling) |
| [DevToolsManager](../api/DevToolsManager.md)         | Habilita la [depuración](../getting-started/debugging.md)                            |
| Managers adicionales                                 |
| [LogoutManager](../api/LogoutManager.md)             | Maneja el HTTP `401` (u otras condiciones de cierre de sesión)                       |

## Ejemplos {#examples}

Reactive Data Client mejora la seguridad de tipos y la ergonomía al realizar los dispatches y el acceso al store con
su [Controller](../api/Controller.md)

### Registro (logging) con middleware {#middleware-logging}

```typescript framework-imports
import type { Manager, Middleware } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    console.log('before', action, controller.getState());
    await next(action);
    console.log('after', action, controller.getState());
  };

  cleanup() {}
}
```

### Reporte de errores {#error-reporting}

Reporta los fetches fallidos a servicios de monitoreo como [Sentry](https://sentry.io) inspeccionando
las acciones [SET_RESPONSE](../api/Actions.md#set_response) con `error` definido.

:::react

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { captureException } from '@sentry/react';

export default class ErrorReportManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.SET_RESPONSE && action.error)
      captureException(action.response, {
        extra: { endpoint: action.endpoint.name, args: action.args },
      });
    return next(action);
  };

  cleanup() {}
}
```

:::

:::vue

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/vue';
import { captureException } from '@sentry/vue';

export default class ErrorReportManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.SET_RESPONSE && action.error)
      captureException(action.response, {
        extra: { endpoint: action.endpoint.name, args: action.args },
      });
    return next(action);
  };

  cleanup() {}
}
```

:::

### Métricas {#metrics}

Mide los tiempos de los fetches observando las acciones [FETCH](../api/Actions.md#fetch). `action.meta.promise`
se resuelve cuando el fetch termina.

```typescript framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { trackTiming } from './analytics';

export default class MetricsManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.FETCH) {
      const start = performance.now();
      action.meta.promise
        .finally(() => {
          trackTiming(action.endpoint.name, performance.now() - start);
        })
        // the fetch's caller handles errors; this only observes timing
        .catch(() => {});
    }
    return next(action);
  };

  cleanup() {}
}
```

### Notificaciones (toasts) {#notifications}

Muestra un toast cuando cualquier [mutación](/rest/guides/side-effects) tiene éxito o falla.

```typescript framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { toast } from './toast';

export default class ToastManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (
      action.type === actionTypes.SET_RESPONSE &&
      action.endpoint.sideEffect
    ) {
      if (action.error) toast.error(`${action.endpoint.name} failed`);
      else toast.success(`${action.endpoint.name} succeeded`);
    }
    return next(action);
  };

  cleanup() {}
}
```

### Actualizar al recuperar el foco o la conexión {#refresh-on-focus}

[Controller.expireAll()](../api/Controller.md#expireAll) marca los datos como [obsoletos](../concepts/expiry-policy.md#stale),
lo que dispara una nueva obtención de cualquier dato que se esté _renderizando activamente_ sin suspender ([stale-while-revalidate](./expiry-policy.md)).
[init()](../api/Manager.md#init) y [cleanup()](../api/Manager.md#cleanup) administran los listeners de eventos.

```typescript framework-imports
import type { Manager, Middleware, Controller } from '@data-client/react';

export default class RefreshManager implements Manager {
  declare protected controller: Controller;
  protected handle = () =>
    this.controller.expireAll({ testKey: () => true });

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    window.addEventListener('focus', this.handle);
    window.addEventListener('online', this.handle);
  }

  cleanup() {
    window.removeEventListener('focus', this.handle);
    window.removeEventListener('online', this.handle);
  }
}
```

### Sincronización entre pestañas {#cross-tab-sync}

Cuando una mutación tiene éxito en una pestaña, marca los datos como obsoletos en todas las demás pestañas usando
[BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel).

```typescript framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';

export default class TabSyncManager implements Manager {
  protected channel = new BroadcastChannel('data-client');

  middleware: Middleware = controller => {
    this.channel.onmessage = () =>
      controller.expireAll({ testKey: () => true });
    return next => async action => {
      if (
        action.type === actionTypes.SET_RESPONSE &&
        action.endpoint.sideEffect &&
        !action.error
      )
        this.channel.postMessage('mutation');
      return next(action);
    };
  };

  cleanup() {
    this.channel.close();
  }
}
```

### Persistencia sin conexión {#persistence}

Persiste el store con [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
(aquí mediante [idb-keyval](https://www.npmjs.com/package/idb-keyval)); restáuralo con
:react[[el initialState de DataProvider](../api/DataProvider.md#initialState)]:vue[[la opción `initialState` de DataClientPlugin](../api/DataClientPlugin.md#initialState)]. Las escrituras en IndexedDB son
asíncronas y usan [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
en lugar de bloquear el hilo principal con la serialización JSON, como haría `localStorage`.
Aplicar debounce a las escrituras mantiene económicas las ráfagas rápidas de acciones. Ten en cuenta los [tiempos de caducidad](./expiry-policy.md)
al restaurar.

```typescript framework-imports
import type { Manager, Middleware } from '@data-client/react';
import { set } from 'idb-keyval';

export default class PersistManager implements Manager {
  declare protected timer?: ReturnType<typeof setTimeout>;

  middleware: Middleware = controller => next => async action => {
    await next(action);
    // debounce: persist at most once per second
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      // in-flight optimistic updates reference functions, so are not persistable
      const state = { ...controller.getState(), optimistic: [] };
      set('data-client', state);
    }, 1000);
  };

  cleanup() {
    clearTimeout(this.timer);
  }
}
```

:::react

```tsx title="index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { createRoot } from 'react-dom/client';
import { get } from 'idb-keyval';
import App from './App';
import PersistManager from './PersistManager';

const managers = [...getDefaultManagers(), new PersistManager()];
const initialState = await get('data-client');

createRoot(document.body).render(
  <DataProvider initialState={initialState} managers={managers}>
    <App />
  </DataProvider>,
);
```

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import { get } from 'idb-keyval';
import App from './App.vue';
import PersistManager from './PersistManager';

const managers = [...getDefaultManagers(), new PersistManager()];
const initialState = await get('data-client');

const app = createApp(App);
app.use(DataClientPlugin, { initialState, managers });
app.mount('#app');
```

:::

### Flujo de datos con middleware (basado en push) {#data-stream}

Agregar un manager que procese los datos enviados por el servidor mediante [websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
o [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) garantiza
que podamos mantener los datos actualizados cuando las actualizaciones son independientes de la acción del usuario. Por ejemplo, el
precio en una aplicación de trading, o un editor colaborativo en tiempo real.

```typescript framework-imports
import type {
  Manager,
  Middleware,
  Controller,
  EntityInterface,
} from '@data-client/react';

export default class StreamManager implements Manager {
  declare protected controller: Controller;
  declare protected evtSource: WebSocket | EventSource;
  declare protected createEventSource: () => WebSocket | EventSource;
  declare protected entities: Record<string, EntityInterface>;

  constructor(
    createEventSource: () => WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.createEventSource = createEventSource;
    this.entities = entities;
  }

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  connect() {
    this.evtSource = this.createEventSource();
    // highlight-start
    this.evtSource.onmessage = (event: MessageEvent) => {
      try {
        const msg: { type: string; args: [any]; data: any } = JSON.parse(
          event.data,
        );
        if (msg.type in this.entities)
          this.controller.set(
            this.entities[msg.type],
            ...msg.args,
            msg.data,
          );
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    // highlight-end
  }

  init() {
    this.connect();
  }

  cleanup() {
    this.evtSource?.close();
  }
}
```

[Controller.set()](../api/Controller.md#set) permite actualizar directamente los [Schemas Querables](/rest/api/schema#queryable)
con `event.data`.

#### Agrupar actualizaciones de alta frecuencia {#batching}

Los flujos como los tickers de un exchange pueden enviar cientos de mensajes por segundo, y las conexiones suelen comenzar con una instantánea grande.
En lugar de llamar a `set()` por cada mensaje, guárdalos en un búfer y escribe cada lote con un schema [Array](/rest/api/Array).
[Controller.set([Entity], rows)](../api/Controller.md#set-array) normaliza todas las filas en una sola actualización del store.

```typescript
export default class StreamManager implements Manager {
  // ...
  protected buffer: Record<string, any[]> = {};
  declare protected flushTimeout?: ReturnType<typeof setTimeout>;

  connect() {
    this.evtSource = this.createEventSource();
    this.evtSource.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.type in this.entities) {
        (this.buffer[msg.type] ??= []).push(msg.data);
        this.flushTimeout ??= setTimeout(this.flush, 50);
      }
    };
  }

  // highlight-start
  flush = () => {
    const buffer = this.buffer;
    this.buffer = {};
    this.flushTimeout = undefined;
    for (const type in buffer) {
      this.controller.set([this.entities[type]], buffer[type]);
    }
  };
  // highlight-end

  cleanup() {
    this.evtSource?.close();
    clearTimeout(this.flushTimeout);
    this.flushTimeout = undefined;
    this.buffer = {};
  }
}
```

Las filas de un mismo lote que comparten una pk se combinan en orden y omiten [Entity.shouldReorder()](/rest/api/Entity#shouldreorder),
así que guarda en el búfer solo el último mensaje por pk cuando el orden importa.

:::react

<BatchSetDemo />

:::

#### Omitir DevTools en actualizaciones de alta frecuencia {#skipping-devtools-for-high-frequency-updates}

Al usar WebSockets u otras fuentes de datos en tiempo real, quizás quieras omitir el registro
de ciertas acciones de alta frecuencia en [DevToolsManager](../api/DevToolsManager.md) para evitar
saturar la extensión del navegador.

```typescript framework-imports
import { getDefaultManagers, actionTypes } from '@data-client/react';
import StreamManager from './StreamManager';
import { Ticker } from './Ticker';

export default function getManagers() {
  return [
    new StreamManager(() => new WebSocket('wss://ws-feed.example.com'), {
      ticker: Ticker,
    }),
    ...getDefaultManagers({
      devToolsManager: {
        // Increase latency buffer for high-frequency updates
        latency: 1000,
        // Skip WebSocket SET actions to avoid log spam
        // (batched writes use the [Ticker] schema)
        predicate: (state, action) =>
          action.type !== actionTypes.SET ||
          (action.schema !== Ticker && action.schema[0] !== Ticker),
      },
    }),
  ];
}
```

:::react

### Aplicación Coin {#coin-app}

<StackBlitz app="coin-app" file="src/getManagers.ts,src/resources/Ticker.ts,src/pages/AssetDetail/AssetPrice.tsx,src/resources/StreamManager.ts" height="600" />

:::
