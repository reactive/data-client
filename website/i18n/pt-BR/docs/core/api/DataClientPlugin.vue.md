---
frameworks: [vue]
framework_equivalent: api/DataProvider
title: DataClientPlugin - Gerenciamento de dados assíncronos normalizados no Vue
sidebar_label: DataClientPlugin
description: Gerenciamento de dados de alto desempenho e globalmente consistente no Vue
---

import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';

# DataClientPlugin

[Plugin do Vue](https://vuejs.org/guide/reusability/plugins.html) que cria o store e o
[Controller](./Controller.md) e os disponibiliza para todos os componentes do app. Instale-o uma única vez,
antes de `app.mount()`; os composables só funcionam em componentes de um app no qual ele esteja instalado.

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);
app.use(DataClientPlugin);
app.mount('#app');
```

Os [Managers](./Manager.md) iniciam quando o plugin é instalado e param quando o app é desmontado.

## Opções {#options}

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

Lista de [Managers](./Manager.md) a usar. Este é o principal ponto de extensibilidade do store.

O padrão é [getDefaultManagers()](./getDefaultManagers.md), que também pode ser usado para estender os padrões.

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

Padrão em produção:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

Padrão em desenvolvimento:

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### initialState?: State&lt;unknown\> {#initialState}

Em vez de começar com um cache vazio, você pode fornecer seu próprio estado inicial. Isso pode
ser útil para testes ou para reidratar o estado do cache ao usar renderização no servidor.
[mockInitialState()](./mockInitialState.md) cria um a partir de fixtures.

```ts title="main.ts"
app.use(DataClientPlugin, { initialState: window.__INITIAL_STATE__ });
```

<StateType />

### Controller?: classe Controller {#Controller}

Isso permite estender o [Controller](./Controller.md) para fornecer funcionalidades adicionais.
Pode ser útil se você tiver ações adicionais que deseja despachar para [Managers](./Manager.md) personalizados.

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

[useController()](./useController.md) e `$dataClient` passam então a retornar uma instância de `MyController`,
mas continuam tipados como `Controller`. Faça um cast para acessar os membros adicionados:

```ts
import { useController } from '@data-client/vue';
import type { MyController } from './main';

const ctrl = useController() as MyController;
ctrl.doSomething();
```

### gcPolicy?: GCInterface {#gcPolicy}

Remove dados do store quando nenhum componente os usa e eles ficaram desatualizados. O padrão é
`new GCPolicy()`; passe uma instância para mudar a frequência da varredura ou por quanto tempo os dados não utilizados são mantidos.

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

O plugin também adiciona o [Controller](./Controller.md) como a propriedade global `$dataClient`, de modo que
templates e componentes da Options API (como `this.$dataClient`) possam usá-lo sem
[useController()](./useController.md). Ele é tipado como [Controller](./Controller.md) sem nenhuma configuração extra.

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

## Usando composables {#using-composables}

Composables como [useSuspense()](./useSuspense.md) precisam ser executados durante o `setup` de um componente, para que o Vue
saiba qual store de qual app usar. Aguardá-los exige `<script setup>`: em um
`async setup()` escrito à mão, composables chamados depois do primeiro `await` perdem a instância do componente e lançam um erro.

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

Componentes que usam `await` devem ser renderizados dentro de um boundary [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html).
