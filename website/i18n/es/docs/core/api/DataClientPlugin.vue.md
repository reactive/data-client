---
frameworks: [vue]
framework_equivalent: api/DataProvider
title: DataClientPlugin - Gestión de datos asíncronos normalizados en Vue
sidebar_label: DataClientPlugin
description: Gestión de datos de alto rendimiento y globalmente consistente en Vue
---

import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';

# DataClientPlugin

[Plugin de Vue](https://vuejs.org/guide/reusability/plugins.html) que crea el store y el
[Controller](./Controller.md), y los proporciona a todos los componentes de la aplicación. Instálalo una sola vez,
antes de `app.mount()`; los composables solo funcionan en componentes de una aplicación en la que esté instalado.

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);
app.use(DataClientPlugin);
app.mount('#app');
```

Los [Managers](./Manager.md) se inician cuando se instala el plugin y se detienen cuando la aplicación se desmonta.

## Opciones {#options}

```ts
app.use(DataClientPlugin, options);
```

```typescript
interface ProvideOptions {
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: new (props: { gcPolicy: GCInterface }) => Controller;
  gcPolicy?: GCInterface;
}
```

### managers?: Manager[] {#managers}

Lista de [Managers](./Manager.md) que se usarán. Es el principal punto de extensibilidad del store.

Por defecto es [getDefaultManagers()](./getDefaultManagers.md), que también puede usarse para ampliar los valores predeterminados.

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import App from './App.vue';
import MyManager from './MyManager';

const app = createApp(App);
app.use(DataClientPlugin, {
  managers: [...getDefaultManagers(), new MyManager()],
});
```

Predeterminado en producción:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

Predeterminado en desarrollo:

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### initialState?: State&lt;unknown\> {#initialState}

En lugar de empezar con una caché vacía, puedes proporcionar tu propio estado inicial. Esto puede
ser útil para pruebas o para rehidratar el estado de la caché al usar renderizado del lado del servidor.
[mockInitialState()](./mockInitialState.md) construye uno a partir de fixtures.

```ts title="main.ts"
app.use(DataClientPlugin, { initialState: window.__INITIAL_STATE__ });
```

<StateType />

### Controller?: clase Controller {#Controller}

Te permite extender [Controller](./Controller.md) para ofrecer funcionalidad adicional.
Puede ser útil si tienes acciones adicionales que quieres despachar a [Managers](./Manager.md) personalizados.

```ts title="main.ts"
import { createApp } from 'vue';
import { Controller, DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

export class MyController extends Controller {
  doSomething = () => {
    console.log('hi');
  };
}

const app = createApp(App);
app.use(DataClientPlugin, { Controller: MyController });
```

[useController()](./useController.md) y `$dataClient` devuelven entonces una instancia de `MyController`,
pero siguen tipados como `Controller`. Usa una conversión de tipo para acceder a los miembros añadidos:

```ts
import { useController } from '@data-client/vue';
import type { MyController } from './main';

const ctrl = useController() as MyController;
ctrl.doSomething();
```

### gcPolicy?: GCInterface {#gcPolicy}

Elimina datos del store cuando ningún componente los usa y se han vuelto obsoletos. El valor predeterminado es
`new GCPolicy()`; pasa uno para cambiar la frecuencia del barrido o cuánto tiempo se conservan los datos sin usar.

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, GCPolicy } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);
app.use(DataClientPlugin, {
  // sweep every 10 minutes
  gcPolicy: new GCPolicy({ intervalMS: 60 * 1000 * 10 }),
});
```

<GCPolicyOptions />

## $dataClient {#dataclient}

El plugin también añade el [Controller](./Controller.md) como propiedad global `$dataClient`, de modo que
las plantillas y los componentes con Options API (como `this.$dataClient`) pueden usarlo sin
[useController()](./useController.md). Está tipado como [Controller](./Controller.md) sin configuración adicional.

```html title="DeleteTodo.vue"
<script setup lang="ts">
  import { TodoResource } from '@/resources/Todo';

  defineProps<{ id: number }>();
</script>

<template>
  <button @click="$dataClient.fetch(TodoResource.delete, { id })">
    Delete
  </button>
</template>
```

## Uso de composables {#using-composables}

Los composables como [useSuspense()](./useSuspense.md) deben ejecutarse durante el `setup` de un componente, para que Vue
sepa qué store de qué aplicación usar. Esperarlos con await requiere `<script setup>`: en un
`async setup()` escrito a mano, los composables llamados después del primer `await` pierden la instancia del componente y lanzan un error.

```html title="TodoDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { TodoResource } from '@/resources/Todo';
  import { UserResource } from '@/resources/User';

  const todo = await useSuspense(TodoResource.get, { id: 1 });
  // still works after the await
  const user = await useSuspense(UserResource.get, {
    id: todo.value.userId,
  });
</script>
```

Los componentes que hacen `await` deben renderizarse dentro de un límite de [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html).
