---
frameworks: [vue]
framework_equivalent: api/DataProvider
title: DataClientPlugin - Vue 中的规范化异步数据管理
sidebar_label: DataClientPlugin
description: Vue 中高性能、全局一致的数据管理
---

import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';

# DataClientPlugin

一个 [Vue 插件](https://vuejs.org/guide/reusability/plugins.html)，负责创建 store 和
[Controller](./Controller.md)，并将它们提供给应用中的每个组件。请在 `app.mount()` 之前
安装一次；composable 只能在安装了它的应用的组件中使用。

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import App from './App.vue';

const app = createApp(App);
app.use(DataClientPlugin);
app.mount('#app');
```

[Manager](./Manager.md) 会在插件安装时启动，并在应用卸载时停止。

## 选项 {#options}

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

要使用的 [Manager](./Manager.md) 列表。这是 store 的主要扩展点。

默认为 [getDefaultManagers()](./getDefaultManagers.md)，它也可以用来扩展默认值。

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

生产环境默认值：

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

开发环境默认值：

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### initialState?: State&lt;unknown\> {#initialState}

你可以提供自己的初始状态，而不是从空缓存开始。这在
测试时很有用，也可用于在服务端渲染时恢复（rehydrate）缓存状态。
[mockInitialState()](./mockInitialState.md) 可以基于 fixture 构建初始状态。

```ts title="main.ts"
app.use(DataClientPlugin, { initialState: window.__INITIAL_STATE__ });
```

<StateType />

### Controller?: Controller 类 {#Controller}

这让你可以扩展 [Controller](./Controller.md) 来提供额外的功能。
如果你有额外的 action 想要 dispatch 给自定义 [Manager](./Manager.md)，这会很有用。

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

之后 [useController()](./useController.md) 和 `$dataClient` 会返回 `MyController` 实例，
但它们的类型仍然是 `Controller`。需要进行类型断言才能访问新增的成员：

```ts
import { useController } from '@data-client/vue';
import type { MyController } from './main';

const ctrl = useController() as MyController;
ctrl.doSomething();
```

### gcPolicy?: GCInterface {#gcPolicy}

当数据不再被任何组件使用且已经过时后，将其从 store 中移除。默认为
`new GCPolicy()`；传入一个实例可以更改清理频率或未使用数据的保留时长。

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

该插件还会将 [Controller](./Controller.md) 添加为全局属性 `$dataClient`，因此
模板和 Options API 组件（通过 `this.$dataClient`）无需
[useController()](./useController.md) 即可使用它。它的类型为 [Controller](./Controller.md)，无需额外配置。

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

## 使用 composable {#using-composables}

像 [useSuspense()](./useSuspense.md) 这样的 composable 必须在组件的 `setup` 期间运行，这样 Vue
才知道该使用哪个应用的 store。要 await 它们需要使用 `<script setup>`：在手写的
`async setup()` 中，在第一个 `await` 之后调用的 composable 会丢失组件实例并抛出错误。

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

使用 `await` 的组件必须在 [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html)
边界内渲染。
