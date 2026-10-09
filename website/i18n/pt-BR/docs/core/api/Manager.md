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

`Managers` são singletons que lidam com efeitos colaterais globais. Uma espécie de :react[[useEffect()](https://react.dev/reference/react/useEffect)]:vue[[watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect)] para o store
de dados central.

Os managers padrão orquestram o comportamento assíncrono complexo que o <abbr title="Reactive Data Client">Data Client</abbr>
fornece de fábrica. Eles podem ser facilmente configurados com [getDefaultManagers()](./getDefaultManagers.md) e
estendidos com seus próprios `Managers` personalizados.

Managers devem implementar [middleware](#middleware), que os conecta ao
[fluxo de controle](#control-flow) do store central. Além disso, [cleanup()](#cleanup) e [init()](#init) se conectam ao
ciclo de vida do store para comportamentos de configuração/encerramento.

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## Ciclo de vida {#lifecycle}

### middleware {#middleware}

`middleware` é muito parecido com um [middleware do redux](https://redux.js.org/advanced/middleware).
A única diferença é que a função `next()` retorna uma `Promise`.

:::react

Essa promise resolve quando a atualização do reducer é
[confirmada (commit)](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
ao usar o &lt;DataProvider /\>. Isso é necessário porque a fase de commit é agendada de forma assíncrona. Isso permite criar
managers que executam trabalho depois que o DOM é atualizado e também com o estado recém-computado.

:::

:::vue

Essa promise resolve quando a atualização do reducer é confirmada no store do
[DataClientPlugin](./DataClientPlugin.md). Isso permite criar managers que executam trabalho com o
estado recém-computado.

:::

Como o redux é totalmente síncrono, é preciso colocar um adaptador na frente dos middlewares no estilo do Reactive Data Client para
garantir que eles possam consumir uma promise. Inversamente, os middlewares do redux precisam ser alterados para repassar promises.

Middlewares [interceptam actions](#reading-and-consuming-actions) que são despachadas e, em seguida, podem também [despachar suas próprias actions](#dispatching-actions).
Para saber mais sobre middlewares, veja a [documentação do redux](https://redux.js.org/advanced/middleware).

### init(state) {#init}

Chamado com o estado inicial depois que o provider é montado. Pode ser útil para executar, no início, uma configuração
que depende de o estado realmente existir.

### cleanup() {#cleanup}

Realiza a limpeza de quaisquer recursos pendentes depois que o manager não está mais em uso.

## Adicionando managers ao Reactive Data Client {#adding}

:::react

Use a prop [managers](../api/DataProvider.md#managers) do [DataProvider](../api/DataProvider.md). Certifique-se
de elevá-los ao _nível do módulo_ ou envolvê-los em um _useMemo()_ para garantir que não sejam recriados. Managers
têm estado interno, então é importante não recriá-los constantemente.

:::

:::vue

Use a opção [managers](./DataClientPlugin.md#managers) do [DataClientPlugin](./DataClientPlugin.md). O plugin é
instalado uma vez por app, então os managers são criados uma única vez.

:::

<ProviderManagers imports={['getDefaultManagers']}>

```ts
import MyManager from './MyManager';

// highlight-next-line
const managers = [...getDefaultManagers(), new MyManager()];
```

</ProviderManagers>

## Fluxo de controle {#control-flow}

Managers se integram ao store do :react[DataProvider]:vue[DataClientPlugin] por meio de seus ciclos de vida e middleware. Eles orquestram fluxos
de controle complexos interceptando e despachando [actions](./Actions.md), além de lerem o estado interno.

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
import type { Manager, Middleware } from '@data-client/react';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  declare protected intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware = controller => {
    this.intervalID = setInterval(() => {
      controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
    }, 1000);

    return next => async action => next(action);
  };

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

Em blocos condicionais, o [tipo da action é restringido (narrowing)](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types),
incentivando o acesso seguro aos seus membros.

Caso queiramos 'tratar' uma determinada [action](./Actions.md), podemos 'consumi-la' não chamando next.

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

Ao usar `return Promise.resolve();` em vez de chamar `next(action)`, impedimos que os managers listados
depois deste vejam essa [action](./Actions.md).

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
