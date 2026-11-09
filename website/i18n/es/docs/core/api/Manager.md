---
title: Manager - Middlewares potentes con conocimiento global del store
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

Los `Managers` manejan efectos secundarios globales. Algo parecido a :react[[useEffect()](https://react.dev/reference/react/useEffect)]:vue[[watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect)] para el store de datos
central.

Los managers predeterminados orquestan el complejo comportamiento asíncrono que <abbr title="Reactive Data Client">Data Client</abbr>
ofrece de serie. Se pueden configurar fácilmente con [getDefaultManagers()](./getDefaultManagers.md) y
ampliar con tus propios `Managers` personalizados.

Los managers deben implementar [middleware](#middleware), que los engancha al
[flujo de control](#control-flow) del store central. Además, [cleanup()](#cleanup) e [init()](#init) se enganchan al
ciclo de vida del store para los comportamientos de preparación y desmontaje.

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## Duraciones {#lifetimes}

Cada store obtiene sus propios Managers. El código de un Manager vive en una de tres duraciones:

| Duración   | Dura                                                              | Contiene                                                                |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Config     | la página                                                         | opciones pasadas al constructor, como una URL o callbacks               |
| Store      | un store, desde la función [managers](#adding) hasta el desmontaje | campos de instancia sobre el store, como los fetches en curso           |
| Activa     | de [init()](#init) a [cleanup()](#cleanup)                        | temporizadores, conexiones y listeners                                  |

Por eso un constructor solo guarda sus opciones. :react[React puede construir Managers para un store que luego descarta, así que un
constructor no debe abrir nada.]

## Ciclo de vida {#lifecycle}

### middleware {#middleware}

`middleware` es muy parecido a un [middleware de redux](https://redux.js.org/advanced/middleware).
La única diferencia es que la función `next()` devuelve una `Promise`.

:::react

Esta promesa se resuelve cuando la actualización del reducer se
[confirma (commit)](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
al usar &lt;DataProvider /\>. Esto es necesario porque la fase de commit se programa de forma asíncrona. Permite construir
managers que realizan trabajo una vez actualizado el DOM y con el estado recién calculado.

:::

:::vue

Esta promesa se resuelve cuando la actualización del reducer se confirma en el store de
[DataClientPlugin](./DataClientPlugin.md). Permite construir managers que realizan trabajo con el
estado recién calculado.

:::

Como redux es totalmente síncrono, hay que colocar un adaptador delante de los middlewares al estilo de Reactive Data Client para
que puedan consumir una promesa. A la inversa, los middlewares de redux deben modificarse para que dejen pasar las promesas.

Los middlewares [interceptan las acciones](#reading-and-consuming-actions) que se despachan y, además, pueden [despachar sus propias acciones](#dispatching-actions).
Para saber más sobre los middlewares, consulta la [documentación de redux](https://redux.js.org/advanced/middleware).

### init(state) {#init}

Se llama cuando los Managers :react[se inician o se reanudan]:vue[se inician]. Inicia aquí los temporizadores y las conexiones.

### cleanup() {#cleanup}

Se llama cuando los Managers :react[se pausan o se detienen]:vue[se detienen]. Detén aquí los temporizadores y las conexiones.

:::react

[DataProvider](./DataProvider.md) llama a `init()` y `cleanup()` desde un Effect, así que siguen el
[ciclo de vida del Effect](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development).
React StrictMode, y [`<Activity>`](https://react.dev/reference/react/Activity) al ocultar `DataProvider`, pausan los Managers
con `cleanup()` y los reanudan con `init()` en el mismo store.

Mientras los Managers están en pausa, el store sigue aplicando acciones. Los fetches en curso aún se resuelven, y `middleware` todavía
los ve. Por lo tanto:

- No restablezcas en `cleanup()` el estado sobre el store, como los fetches en curso.
- Protege los efectos secundarios que `cleanup()` detuvo, como `this.channel?.postMessage()`.

`init()` recibe el estado actual del store, también al reanudarse.

:::

## Añadir managers a Reactive Data Client {#adding}

:::react

Pasa una función a la prop [managers](../api/DataProvider.md#managers) de [DataProvider](../api/DataProvider.md). Se
ejecuta una vez por cada store, así que un `DataProvider` que se vuelve a montar obtiene nuevos Managers.

:::

:::vue

Pasa una función a la opción [managers](./DataClientPlugin.md#managers) de [DataClientPlugin](./DataClientPlugin.md).
Se ejecuta una vez por cada app.

:::

<ProviderManagers imports={['getDefaultManagers']}>

```ts
import MyManager from './MyManager';

// highlight-next-line
const managers = () => [new MyManager(), ...getDefaultManagers()];
```

</ProviderManagers>

Define la función a nivel de módulo: solo contiene configuración.

Las acciones pasan por los managers en el orden del array. Coloca tus managers personalizados antes de los predeterminados: [NetworkManager](./NetworkManager.md)
resuelve él mismo la mayoría de las acciones FETCH en lugar de pasarlas al siguiente.

## Flujo de control {#control-flow}

Los managers se integran con el store de :react[DataProvider]:vue[DataClientPlugin] mediante sus ciclos de vida y su middleware. Orquestan flujos de control
complejos interceptando y despachando [acciones](./Actions.md), además de leer el estado interno.

<ThemedImage
alt="Flujo flux del Manager"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

El trabajo del `middleware` es despachar acciones, responder a las [acciones](./Actions.md), o ambas cosas.

### Despachar acciones {#dispatching-actions}

[Controller](./Controller.md) ofrece despachadores de acciones con tipado seguro.

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

### Leer y consumir acciones {#reading-and-consuming-actions}

`actionTypes` incluye todas las constantes para distinguir entre las distintas [acciones](./Actions.md).

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

En los bloques condicionales, el [tipo de la acción se acota](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types),
lo que favorece un acceso seguro a sus miembros.

Si queremos 'manejar' una [acción](./Actions.md) concreta, podemos 'consumirla' sin llamar a next.

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

Al hacer `return Promise.resolve();` en lugar de llamar a `next(action)`, evitamos que los managers listados
después de este vean esa [acción](./Actions.md).

Tipos: [`FETCH`](./Actions.md#fetch), [`SET`](./Actions.md#set), [`SET_RESPONSE`](./Actions.md#set_response),
[`RESET`](./Actions.md#reset), [`SUBSCRIBE`](./Actions.md#subscribe), [`UNSUBSCRIBE`](./Actions.md#unsubscribe),
[`INVALIDATE`](./Actions.md#invalidate), [`INVALIDATEALL`](./Actions.md#invalidateall), [`EXPIREALL`](./Actions.md#expireall)

## Casos de uso {#use-cases}

Ejemplos mínimos para casos de uso comunes de los Manager:

- [Registro de logs](../concepts/managers.md#middleware-logging)
- [Reporte de errores (monitorización)](../concepts/managers.md#error-reporting)
- [Métricas (tiempos de fetch)](../concepts/managers.md#metrics)
- [Notificaciones (toasts)](../concepts/managers.md#notifications)
- [Actualizar al recuperar el foco o al reconectar](../concepts/managers.md#refresh-on-focus)
- [Sincronización entre pestañas](../concepts/managers.md#cross-tab-sync)
- [Persistencia sin conexión](../concepts/managers.md#persistence)
- [Flujos de datos (websockets/SSE)](../concepts/managers.md#data-stream)
- [Autenticación: cerrar sesión ante un 401](./LogoutManager.md)
- [Actualizaciones periódicas (intervalo/ticker)](#dispatching-actions)
- [Suscripciones de transporte personalizadas](#reading-and-consuming-actions)
