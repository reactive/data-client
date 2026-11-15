---
title: Manager - Middlewares poderosos com conhecimento global do store
sidebar_label: Manager
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import ProviderManagers from '../shared/_provider_managers.mdx';

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

# Manager

`Managers` lidam com efeitos colaterais globais. Eles são como :react[[useEffect()](https://react.dev/reference/react/useEffect)]:vue[[watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect)], mas para o store
de dados central.

Os managers padrão executam o comportamento assíncrono que o <abbr title="Reactive Data Client">Data Client</abbr> fornece,
como fetching e subscriptions. Configure-os com [getDefaultManagers()](./getDefaultManagers.md) e adicione seus
próprios `Managers`.

Cada Manager implementa [middleware](#middleware), que o conecta ao [fluxo de controle](#control-flow) do store.
[init()](#init) e [cleanup()](#cleanup) o conectam ao ciclo de vida do store, para configuração e encerramento.

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## Tempos de vida {#lifetimes}

Cada store recebe seus próprios Managers. O código de um Manager vive em um de três tempos de vida:

| Tempo de vida | Dura                                                                  | Guarda                                                                  |
| ------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Config        | a página                                                              | opções passadas ao constructor, como uma URL ou callbacks               |
| Store         | um store, da função [managers](#adding) até a desmontagem             | campos da instância sobre o store, como fetches em andamento            |
| Ativo         | de [init()](#init) até [cleanup()](#cleanup)                          | timers, conexões e listeners                                            |

Portanto, um constructor apenas guarda suas opções. :react[O React pode construir Managers para um store que depois descarta, então um
constructor não deve abrir nada.]

## Ciclo de vida {#lifecycle}

### middleware {#middleware}

`middleware` funciona como um [middleware do redux](https://redux.js.org/advanced/middleware), exceto que `next()` retorna uma
`Promise`.

:::react

Com o &lt;DataProvider /\>, essa promise resolve quando o React
[confirma (commit)](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
a atualização. O React agenda commits de forma assíncrona, então um Manager pode aguardar `next()` para trabalhar com o novo estado depois que o
DOM é atualizado.

:::

:::vue

Essa promise resolve quando o store do [DataClientPlugin](./DataClientPlugin.md) confirma a atualização, então um Manager pode
aguardar `next()` para trabalhar com o novo estado.

:::

:::react

O redux despacha de forma síncrona, então um store do redux precisa de um adaptador depois dos Managers que retorne uma `Promise` a partir de
`next()`. O [prepareStore](../guides/redux.md) adiciona um e coloca os middlewares do redux depois dele.

:::

Um middleware pode [ler actions](#reading-and-consuming-actions) à medida que são despachadas e
[despachar as suas próprias](#dispatching-actions).

### init(state) {#init}

Chamado quando os Managers :react[iniciam ou retomam]:vue[iniciam]. Inicie timers e conexões aqui.

### cleanup() {#cleanup}

Chamado quando os Managers :react[pausam ou param]:vue[param]. Encerre timers e conexões aqui.

:::react

O [DataProvider](./DataProvider.md) chama `init()` e `cleanup()` a partir de um Effect, então eles seguem o
[ciclo de vida do Effect](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development).
O React StrictMode, e o [`<Activity>`](https://react.dev/reference/react/Activity) ocultando o `DataProvider`, pausam os Managers
com `cleanup()` e os retomam com `init()` no mesmo store.

Enquanto os Managers estão pausados, o store continua aplicando actions. Fetches em andamento ainda são resolvidos, e o `middleware` ainda
os vê. Portanto:

- Não redefina em `cleanup()` o estado sobre o store, como fetches em andamento.
- Proteja efeitos colaterais que `cleanup()` interrompeu, como `this.channel?.postMessage()`.

`init()` recebe o estado atual do store, inclusive ao retomar.

:::

## Adicionando managers ao Reactive Data Client {#adding}

:::react

Passe uma função para a prop [managers](../api/DataProvider.md#managers) do [DataProvider](../api/DataProvider.md). Ela
é executada uma vez para cada store, então um `DataProvider` remontado recebe novos Managers.

:::

:::vue

Passe uma função para a opção [managers](./DataClientPlugin.md#managers) do [DataClientPlugin](./DataClientPlugin.md).
Ela é executada uma vez para cada app.

:::

<ProviderManagers imports={['getDefaultManagers']}>

```ts
import MyManager from './MyManager';

// highlight-next-line
const managers = () => [new MyManager(), ...getDefaultManagers()];
```

</ProviderManagers>

Defina a função no nível do módulo: ela guarda apenas config.

As actions passam pelos managers na ordem do array. Liste os managers personalizados antes dos padrão: o [NetworkManager](./NetworkManager.md)
resolve a maioria das actions FETCH por conta própria, em vez de repassá-las.

## Fluxo de controle {#control-flow}

Managers se conectam ao store do :react[DataProvider]:vue[DataClientPlugin] por meio de seus métodos de ciclo de vida e
middleware. Eles leem e despacham [actions](./Actions.md) e leem o estado do store.

<ThemedImage
alt="Fluxo flux do Manager"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

O trabalho do `middleware` é despachar actions, responder a [actions](./Actions.md), ou ambos.

### Despachando actions {#dispatching-actions}

O [Controller](./Controller.md) fornece dispatchers de actions com tipagem segura.

<TypeScriptEditor>

```ts title="CurrentTime" collapsed
import { Entity } from '@data-client/rest';

export default class CurrentTime extends Entity {
  id = 0;
  time = 0;
}
```

```ts title="TimeManager" framework-imports
import type { Controller, Manager, Middleware } from '@data-client/react';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  declare protected controller: Controller;
  declare protected intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    this.intervalID = setInterval(() => {
      this.controller.set(
        CurrentTime,
        { id: 1 },
        { id: 1, time: Date.now() },
      );
    }, 1000);
  }

  cleanup() {
    clearInterval(this.intervalID);
  }
}
```

</TypeScriptEditor>

### Lendo e consumindo actions {#reading-and-consuming-actions}

`actionTypes` inclui todas as constantes para distinguir entre diferentes [actions](./Actions.md).

<TypeScriptEditor>

```ts framework-imports
import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SET_RESPONSE:
        if (action.endpoint.sideEffect) {
          console.info(
            `${action.endpoint.name} ${JSON.stringify(action.response)}`,
          );
          // wait for state update to be committed
          await next(action);
          // get the data from the store, which may be merged with existing state
          const { data } = controller.getResponse(
            action.endpoint,
            ...action.args,
            controller.getState(),
          );
          console.info(`${action.endpoint.name} ${JSON.stringify(data)}`);
          return;
        }
      // actions must be explicitly passed to next middleware
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

</TypeScriptEditor>

Dentro de cada `case`, o TypeScript [restringe (narrowing)](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types)
o tipo da action, então você pode acessar seus membros com segurança.

Para consumir uma [action](./Actions.md), não chame `next()`.

<TypeScriptEditor>

```ts title="isEntity" collapsed framework-imports
import type { Schema, EntityInterface } from '@data-client/react';

export default function isEntity(
  schema: Schema,
): schema is EntityInterface {
  return schema !== null && (schema as any).pk !== undefined;
}
```

```ts title="SubsManager" framework-imports
import type {
  Manager,
  Middleware,
  EntityInterface,
} from '@data-client/react';
import { actionTypes } from '@data-client/react';
import isEntity from './isEntity';

export default class CustomSubsManager implements Manager {
  declare protected entities: Record<string, EntityInterface>;

  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SUBSCRIBE:
      case actionTypes.UNSUBSCRIBE:
        const { schema } = action.endpoint;
        // only process registered entities
        if (schema && isEntity(schema) && schema.key in this.entities) {
          if (action.type === actionTypes.SUBSCRIBE) {
            this.subscribe(schema.key, action.args[0]?.product_id);
          } else {
            this.unsubscribe(schema.key, action.args[0]?.product_id);
          }

          // consume subscription if we use it
          return Promise.resolve();
        }
      default:
        return next(action);
    }
  };

  cleanup() {}

  subscribe(channel: string, product_id: string) {}
  unsubscribe(channel: string, product_id: string) {}
}
```

</TypeScriptEditor>

`return Promise.resolve();` em vez de `next(action)` impede que os managers listados depois deste vejam a
[action](./Actions.md).

Tipos: [`FETCH`](./Actions.md#fetch), [`SET`](./Actions.md#set), [`SET_RESPONSE`](./Actions.md#set_response),
[`RESET`](./Actions.md#reset), [`SUBSCRIBE`](./Actions.md#subscribe), [`UNSUBSCRIBE`](./Actions.md#unsubscribe),
[`INVALIDATE`](./Actions.md#invalidate), [`INVALIDATEALL`](./Actions.md#invalidateall), [`EXPIREALL`](./Actions.md#expireall)

## Casos de uso {#use-cases}

Exemplos mínimos para casos de uso comuns de Manager:

- [Logging](../concepts/managers.md#middleware-logging)
- [Relatório de erros (monitoramento)](../concepts/managers.md#error-reporting)
- [Métricas (tempo de fetch)](../concepts/managers.md#metrics)
- [Notificações (toasts)](../concepts/managers.md#notifications)
- [Atualizar ao focar ou reconectar](../concepts/managers.md#refresh-on-focus)
- [Sincronização entre abas](../concepts/managers.md#cross-tab-sync)
- [Persistência offline](../concepts/managers.md#persistence)
- [Streams de dados (websockets/SSE)](../concepts/managers.md#data-stream)
- [Autenticação: logout em 401](./LogoutManager.md)
- [Atualizações periódicas (interval/ticker)](#dispatching-actions)
- [Assinaturas de transporte personalizado](#reading-and-consuming-actions)
