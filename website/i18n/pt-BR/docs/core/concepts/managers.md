---
title: Orquestração centralizada de efeitos colaterais com React
vue_title: Orquestração centralizada de efeitos colaterais com Vue
sidebar_label: Managers e Middleware
description: Acesso programático e seguro ao store global. Permite efeitos colaterais totalmente extensíveis e escaláveis.
image: /img/social/managers-card.png
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import StackBlitz from '@site/src/components/StackBlitz';
import BatchSetDemo from '../shared/\_BatchSetDemo.mdx';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Managers e Middleware

<!-- global useEffect - centralized orchestration (talk about the problem we're solving - global side effects) -->

<!-- controller.set -> dispatch(createSet()) -> DevToolsManager -> NetworkManager -> SubManager -> reducer -> state -->

O Reactive Data Client usa o padrão de [store flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/), caracterizado pelo [fluxo de dados unidirecional](<https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)>) do store, fácil de [entender e depurar](../getting-started/debugging.md). As atualizações de estado são realizadas por uma [função reducer](https://github.com/reactive/data-client/blob/master/packages/core/src/state/reducer/createReducer.ts#L19).

<ThemedImage
alt="Fluxo flux do Manager"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

Em arquiteturas flux, é fundamental que todas as funções do ciclo flux sejam :react[[puras](https://react.dev/learn/keeping-components-pure)]:vue[[puras](https://en.wikipedia.org/wiki/Pure_function)].
Os Managers fornecem a orquestração centralizada de efeitos colaterais. Em outras palavras, são o meio de interagir
com o mundo fora do <abbr title="Reactive Data Client">Data Client</abbr>.

Por exemplo, o [NetworkManager](../api/NetworkManager.md) orquestra a busca de dados e o [SubscriptionManager](../api/SubscriptionManager.md)
acompanha quais recursos estão assinados com [useLive](../api/useLive.md) ou [useSubscription](../api/useSubscription.md). Ao centralizar o controle, o [NetworkManager](../api/NetworkManager.md) deduplica fetches automaticamente, e o [SubscriptionManager](../api/SubscriptionManager.md)
mantém atualizados apenas os recursos renderizados ativamente.

Isso torna os [Managers](../api/Manager.md) a melhor forma de integrar efeitos colaterais adicionais, como
[logging](#middleware-logging), [relatório de erros](#error-reporting), [métricas](#metrics),
[notificações](#notifications), [fluxos de dados](#data-stream), [atualização ao focar ou reconectar](#refresh-on-focus),
[sincronização entre abas](#cross-tab-sync) e [persistência offline](#persistence).
Eles também podem ser personalizados para alterar comportamentos centrais.

| Managers padrão                                      |                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NetworkManager](../api/NetworkManager.md)           | Transforma dispatches de fetch em chamadas de rede                                   |
| [SubscriptionManager](../api/SubscriptionManager.md) | Trata [assinaturas](../getting-started/data-dependency.md#subscriptions) de polling |
| [DevToolsManager](../api/DevToolsManager.md)         | Habilita a [depuração](../getting-started/debugging.md)                              |
| Managers extras                                      |
| [LogoutManager](../api/LogoutManager.md)             | Trata HTTP `401` (ou outras condições de logout)                                     |

## Examples {#examples}

O Reactive Data Client melhora a tipagem segura e a ergonomia ao realizar dispatches e o acesso ao store por meio
do seu [Controller](../api/Controller.md)

### Logging com middleware {#middleware-logging}

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

### Relatório de erros {#error-reporting}

Reporte fetches com falha a serviços de monitoramento como o [Sentry](https://sentry.io) inspecionando
as actions [SET_RESPONSE](../api/Actions.md#set_response) com `error` definido.

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

Acompanhe o tempo dos fetches observando as actions [FETCH](../api/Actions.md#fetch). `action.meta.promise`
é resolvida quando o fetch termina.

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

### Notificações (toasts) {#notifications}

Exiba um toast quando qualquer [mutação](/rest/guides/side-effects) for bem-sucedida ou falhar.

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

### Atualizar ao focar ou reconectar {#refresh-on-focus}

[Controller.expireAll()](../api/Controller.md#expireAll) marca os dados como [Stale](../concepts/expiry-policy.md#stale),
disparando um novo fetch de qualquer dado _renderizado ativamente_ sem suspender ([stale-while-revalidate](./expiry-policy.md)).
[init()](../api/Manager.md#init) e [cleanup()](../api/Manager.md#cleanup) gerenciam os event listeners.

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

### Sincronização entre abas {#cross-tab-sync}

Quando uma mutação é bem-sucedida em uma aba, marque os dados como desatualizados em todas as outras abas usando
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

### Persistência offline {#persistence}

Persista o store com [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
(aqui via [idb-keyval](https://www.npmjs.com/package/idb-keyval)); restaure-o com
:react[[initialState do DataProvider](../api/DataProvider.md#initialState)]:vue[[opção `initialState` do DataClientPlugin](../api/DataClientPlugin.md#initialState)]. As escritas no IndexedDB são
assíncronas e usam [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
em vez de bloquear a thread principal com serialização JSON, como o `localStorage` faria.
Aplicar debounce às escritas mantém barato o custo de rajadas rápidas de actions. Considere os [tempos de expiração](./expiry-policy.md)
ao restaurar.

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

### Fluxo de dados com middleware (baseado em push) {#data-stream}

Adicionar um manager para processar dados enviados pelo servidor via [websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
ou [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) garante
que possamos manter os dados atualizados quando as atualizações independem de ações do usuário. Por exemplo, o
preço em um aplicativo de negociação ou um editor colaborativo em tempo real.

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

[Controller.set()](../api/Controller.md#set) permite atualizar diretamente [Schemas Querable](/rest/api/schema#queryable)
com `event.data`.

#### Agrupando atualizações de alta frequência {#batching}

Streams como tickers de bolsa podem enviar centenas de mensagens por segundo, e as conexões costumam começar com um snapshot grande.
Em vez de chamar `set()` a cada mensagem, armazene-as em buffer e escreva cada lote com um schema [Array](/rest/api/Array).
[Controller.set([Entity], rows)](../api/Controller.md#set-array) normaliza todas as linhas em uma única atualização do store.

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

Linhas de um mesmo lote que compartilham uma pk são mescladas em ordem e ignoram [Entity.shouldReorder()](/rest/api/Entity#shouldreorder),
portanto armazene em buffer apenas a mensagem mais recente por pk quando a ordem importar.

:::react

<BatchSetDemo />

:::

#### Ignorando o DevTools em atualizações de alta frequência {#skipping-devtools-for-high-frequency-updates}

Ao usar WebSockets ou outras fontes de dados em tempo real, pode ser interessante não registrar
certas actions de alta frequência no [DevToolsManager](../api/DevToolsManager.md), para evitar
sobrecarregar a extensão do navegador.

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

### Coin App {#coin-app}

<StackBlitz app="coin-app" file="src/getManagers.ts,src/resources/Ticker.ts,src/pages/AssetDetail/AssetPrice.tsx,src/resources/StreamManager.ts" height="600" />

:::
