---
frameworks: [vue]
framework_equivalent: api/DataProvider
title: DataClientPlugin - Normalized async data management in Vue
sidebar_label: DataClientPlugin
description: High performance, globally consistent data management in Vue
---

import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';

# DataClientPlugin

[Vue plugin](https://vuejs.org/guide/reusability/plugins.html) that creates the store and
[Controller](./Controller.md), and provides them to every component in the app. Install it once,
before `app.mount()`; composables only work in components of an app it is installed on.

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);
app.use(DataClientPlugin);
app.mount('#app');
```

[Managers](./Manager.md) start when the plugin is installed, and stop when the app is unmounted.

## Options

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

List of [Managers](./Manager.md) to use. This is the main extensibility point of the store.

Defaults to [getDefaultManagers()](./getDefaultManagers.md), which can also be used to extend the defaults.

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

Default Production:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

Default Development:

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### initialState?: State&lt;unknown\> {#initialState}

Instead of starting with an empty cache, you can provide your own initial state. This can
be useful for testing, or rehydrating the cache state when using server side rendering.
[mockInitialState()](./mockInitialState.md) builds one from fixtures.

```ts title="main.ts"
app.use(DataClientPlugin, { initialState: window.__INITIAL_STATE__ });
```

<StateType />

### Controller?: Controller class {#Controller}

This allows you to extend [Controller](./Controller.md) to provide additional functionality.
This might be useful if you have additional actions you want to dispatch to custom [Managers](./Manager.md).

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

[useController()](./useController.md) and `$dataClient` then return a `MyController` instance,
but they are still typed as `Controller`. Cast to reach the added members:

```ts
import { useController } from '@data-client/vue';
import type { MyController } from './main';

const ctrl = useController() as MyController;
ctrl.doSomething();
```

### gcPolicy?: GCInterface {#gcPolicy}

Removes data from the store once no component uses it and it has gone stale. Defaults to
`new GCPolicy()`; pass one to change how often it sweeps or how long unused data is kept.

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

The plugin also adds the [Controller](./Controller.md) as the `$dataClient` global property, so
templates and Options API components (as `this.$dataClient`) can use it without
[useController()](./useController.md). It is typed as [Controller](./Controller.md) with no extra setup.

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

## Using composables

Composables like [useSuspense()](./useSuspense.md) must run during a component's `setup`, so Vue
knows which app's store to use. Awaiting them requires `<script setup>`: in a hand-written
`async setup()`, composables called after the first `await` lose the component instance and throw.

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

Components that `await` must render inside a [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html)
boundary.
