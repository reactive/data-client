---
title: Reactive Data Client 简介
vue_title: 面向 Vue 的 Reactive Data Client 简介
sidebar_label: 简介
description: 使用 NextJS、Expo、React Native 等构建令人愉悦的动态应用。
vue_description: 使用 Vue 等构建令人愉悦的动态应用。
slug: /
id: introduction
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import ProtocolTabs from '@site/src/components/ProtocolTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import Link from '@docusaurus/Link';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Reactive Data Client

Reactive Data Client 为[远程数据协议](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/)提供安全、高性能的[客户端访问](./api/useSuspense.md)和[变更](./api/Controller.md#fetch)。
拉取/获取（[REST](/rest) 和 [GraphQL](/graphql)）与推送/流（[WebSockets 或 Server Sent Events](./concepts/managers.md#data-stream)）可以同时使用。

它的目标与
[关系型数据库](https://en.wikipedia.org/wiki/Relational_database)相似，
只不过面向的是交互式应用客户端。因此，**如果你的后端使用 [Postgres](https://www.postgresql.org/)
或 [MySQL](https://www.mysql.com/) 这样的 [RDBMS](https://en.wikipedia.org/wiki/Relational_database)，这很好地说明 Reactive Data Client 可能适合你**。相应地，
就像有人会选择[平面文件](https://www.techopedia.com/definition/25956/flat-file)而不是数据库存储一样，
有时一个功能较弱的客户端库就足够了。

这绝非易事。为此，Reactive Data Client 的设计目标是**像对待本地数据一样
对待远程数据**。这意味着组件逻辑不应比 useState 和 setState 更复杂。

## 定义 API {#endpoint}

[Endpoint](./getting-started/resource.md) 是你的数据的_方法_。从本质上讲，它们
只是异步函数。不过，它们还定义了与 [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/) 相关的其他一切，
例如[过期策略](./concepts/expiry-policy.md)、[数据模型](./concepts/normalization.md)、[校验](./concepts/validation.md)和[类型](/rest/api/RestEndpoint#typing)。

<ThemedImage
alt="在多种场景中使用的 Endpoint"
sources={{
    light: useBaseUrl('/img/endpoint-many.png'),
    dark: useBaseUrl('/img/endpoint-many.dark.png'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>

通过将 endpoint 的定义与其使用_解耦_，我们可以在多种场景中复用它们。

- 可以轻松地在不同**组件**中复用，便于将数据依赖就近放置
- 配合不同的 **:react[[hook](./api/useSuspense.md)]:vue[[composable](./api/useSuspense.md)]** 和**[命令式操作](./api/Controller.md)**复用，让同一个 endpoint 拥有不同的行为
- 跨不同的**[平台](./getting-started/installation.md)**复用，:react[例如 React Native、React web，甚至 React 之外的 Angular、Svelte、Vue 或 Node]:vue[例如 Vue web，甚至 Vue 之外的 React、Angular、Svelte 或 Node]
- 可以作为独立于使用方的**包**发布

Endpoint 是可扩展、可组合的，并提供多种协议实现（[REST](/rest)、[GraphQL](/graphql)、[Websockets+SSE](./concepts/managers.md#data-stream):react[、[图片/二进制](./guides/img-media.md)]），
帮助你快速上手、进行扩展并共享通用模式。

<ProtocolTabs>

```ts
import { RestEndpoint } from '@data-client/rest';

const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});
```

```ts
import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('/');
export const getTodo = gql.query(`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`);
```

</ProtocolTabs>

## 就近放置数据依赖 {#co-locate-data-dependencies}

只需一行 [useSuspense()](./api/useSuspense.md)，就能在[需要的地方](./getting-started/data-dependency.md)绑定数据，让你的组件可以复用。与 [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) 非常类似，
[useSuspense()](./api/useSuspense.md) 一旦返回，就保证数据可用。

:::react

```tsx {4}
import { useSuspense } from '@data-client/react';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, { id });

  return <div>{todo.title}</div>;
}
```

:::

:::vue

```html title="TodoDetail.vue" {6}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getTodo } from './api/Todo';

  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(getTodo, () => ({ id: props.id }));
</script>

<template>
  <div>{{ todo.title }}</div>
</template>
```

:::

不再需要 prop 层层传递，也不再需要繁琐的外部状态管理。Reactive Data Client 保证全局引用相等、
数据安全和性能。

:::react

就近放置还让[服务端渲染](./guides/ssr.md)可以增量地流式传输 HTML，大幅降低 [TTFB](https://web.dev/ttfb/)。
[Reactive Data Client SSR](./guides/ssr.md) 会自动对其 store 进行 hydrate，使首次加载时无需任何客户端
fetch 即可立即进行交互式变更。

:::

## 处理加载/错误 {#handle-loadingerror}

:::react

将 [AsyncBoundary](./api/AsyncBoundary.md) 放在多个会挂起的组件外层，避免出现成百上千个加载指示器。

通常它们会放在页面、路由或模态框等导航边界处或其上层。

```tsx {5,8}
import { AsyncBoundary } from '@data-client/react';

function App() {
  return (
    <AsyncBoundary>
      <AnotherRoute />
      <TodoDetail id={5} />
    </AsyncBoundary>
  );
}
```

在 React 16 和 17 的某些情况下，
也可以使用[非 Suspense 的 fallback 处理](./getting-started/data-dependency.md#stateful)

:::

:::vue

将 Vue 内置的 [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) 放在多个会挂起的组件外层，
避免出现成百上千个加载指示器。只要有任何后代组件仍在等待数据，就会渲染它的 `#fallback` 插槽。
错误可以通过 [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) 捕获。

通常它们会放在页面、路由或模态框等导航边界处或其上层。

```html title="App.vue" {7-10,15,20-22}
<script setup lang="ts">
  import { onErrorCaptured, ref } from 'vue';
  import AnotherRoute from './AnotherRoute.vue';
  import TodoDetail from './TodoDetail.vue';

  const error = ref<Error | null>(null);
  onErrorCaptured(err => {
    error.value = err;
    return false;
  });
</script>

<template>
  <div v-if="error">Error: {{ error.message }}</div>
  <Suspense v-else>
    <template #default>
      <AnotherRoute />
      <TodoDetail :id="5" />
    </template>
    <template #fallback>
      <Loading />
    </template>
  </Suspense>
</template>
```

在某些情况下，也可以使用
[非 Suspense 的 fallback 处理](./getting-started/data-dependency.md#stateful)。

:::

## 变更 {#mutations}

[变更](./getting-started/mutations.md)是另一种复用场景——这次复用的是我们的数据。这种情况更加关键，
因为它不仅会导致代码膨胀，还会引发数据完整性问题、数据撕裂以及应用整体的卡顿。

当我们调用变更方法/endpoint 时，需要确保该数据的**所有**使用处都得到更新。
否则，我们就只能尝试级联刷新 endpoint，
并承受由此带来的复杂性、性能问题和应用卡顿。

### 保持数据一致且新鲜 {#entities}

[Entity](./concepts/normalization.md) 定义了我们的数据模型。

这实现了一种 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) 的存储模式，
可以防止“数据撕裂”造成的卡顿，并提升性能。

<ProtocolTabs>

```ts
import { Entity } from '@data-client/rest';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}
```

```ts
import { GQLEntity } from '@data-client/graphql';

export class Todo extends GQLEntity {
  userId = 0;
  title = '';
  completed = false;
}
```

</ProtocolTabs>

[pk()](/rest/api/Entity#pk)（主键）方法用于构建查找表。这
通常称为数据规范化。为了避免 bug、应用卡顿和性能问题，
[选择正确的（规范化的）状态结构](https://react.dev/learn/choosing-the-state-structure)至关重要。

现在我们可以将 Entity 同时绑定到 get endpoint 和 update endpoint，从而获得运行时
数据完整性以及 TypeScript 定义。

<ProtocolTabs>

```ts {6}
import { RestEndpoint } from '@data-client/rest';

const get = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});

const update = getTodo.extend({
  method: 'PUT',
});

export const TodoResource = { get, update };
```

```ts {14,25}
import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('/');

const get = gql.query(
  `query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`,
  { todo: Todo },
);

const update = gql.mutation(
  `mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }`,
  { updateTodo: Todo },
);

export const TodoResource = { get, update };
```

</ProtocolTabs>

### 通知 :react[react]:vue[Vue] 进行更新 {#tell-react-to-update}

就像 :react[`setState()`]:vue[给 `ref()` 赋值]一样，我们必须让 :react[React]:vue[Vue] 感知到所有变更，以便它重新渲染。

[Controller](./api/Controller.md) 以类型安全的方式提供了这一功能。
[Controller.fetch()](./api/Controller.md#fetch) 让我们可以触发变更。

我们可以在 :react[React]:vue[Vue] 组件中通过 [useController](./api/useController.md) 访问它。

:::react

<ProtocolTabs>

```tsx
import { useController } from '@data-client/react';

function ArticleEdit({ id }: { id: number }) {
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id }, data);
  return <ArticleForm onSubmit={handleSubmit} />;
}
```

```tsx
import { useController } from '@data-client/react';

function ArticleEdit({ id }: { id: number }) {
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id, ...data });
  return <ArticleForm onSubmit={handleSubmit} />;
}
```

</ProtocolTabs>

:::

:::vue

<ProtocolTabs>

```html title="ArticleEdit.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: number }>();
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id: props.id }, data);
</script>

<template>
  <ArticleForm @submit="handleSubmit" />
</template>
```

```html title="ArticleEdit.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: number }>();
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id: props.id, ...data });
</script>

<template>
  <ArticleForm @submit="handleSubmit" />
</template>
```

</ProtocolTabs>

:::

<details>
<summary><b>跟踪命令式操作的加载/错误状态</b></summary>

[useLoading()](./api/useLoading.md) 通过跟踪异步函数的加载状态和错误状态来增强它们。

:::react

```tsx
import { useController, useLoading } from '@data-client/react';

function ArticleEdit({ id }: { id: number }) {
  const ctrl = useController();
  // highlight-next-line
  const [handleSubmit, loading, error] = useLoading(
    data => ctrl.fetch(TodoResource.update, { id }, data),
    [ctrl],
  );
  return <ArticleForm onSubmit={handleSubmit} loading={loading} />;
}
```

:::

:::vue

```html title="ArticleEdit.vue"
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: number }>();
  const ctrl = useController();
  // highlight-next-line
  const [handleSubmit, loading, error] = useLoading(data =>
    ctrl.fetch(TodoResource.update, { id: props.id }, data),
  );
</script>

<template>
  <ArticleForm @submit="handleSubmit" :loading="loading" />
</template>
```

:::

</details>

### 更多数据建模 {#more-data-modeling}

如果我们的 Entity 不是顶层项呢？这里我们定义了 `getList`
endpoint，并以 [new Collection([Todo])](/rest/api/Collection) 作为其 schema。[schema](./concepts/normalization.md#schema) 告诉 Reactive Data Client 去_哪里_找到
Entity。将其放在列表中后，Reactive Data Client 就知道响应应当是
一个列表，其中每一项都是指定的 Entity。

```typescript {6}
import { RestEndpoint, Collection } from '@data-client/rest';

// get and update definitions omitted

const getList = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  schema: new Collection([Todo]),
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});

export default (TodoResource = { getList, get, update });
```

[schema](./concepts/normalization.md) 还会自动推断并强制约束响应类型，确保
变量 `todos` 拥有精确的类型。

:::react

```tsx {4}
import { useSuspense } from '@data-client/react';

export default function TodoList() {
  const todos = useSuspense(TodoResource.getList);

  return (
    <div>
      {todos.map(todo => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
```

:::

:::vue

```html title="TodoList.vue" {6}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import TodoListItem from './TodoListItem.vue';

  const todos = await useSuspense(TodoResource.getList);
</script>

<template>
  <div>
    <TodoListItem v-for="todo in todos" :key="todo.pk()" :todo="todo" />
  </div>
</template>
```

:::

现在我们已经在三处使用了数据模型——`TodoResource.get`、`TodoResource.getList` 和 `TodoResource.update`。即使发生变更，
这些 endpoint 之间的数据一致性（以及引用相等）也能得到保证。

### 组织 Endpoint {#organizing-endpoints}

到目前为止，我们已经定义了 `TodoResource.get`、`TodoResource.getList` 和 `TodoResource.update`。你可能已经注意到，
这些 endpoint 定义之间共享了一些逻辑和信息。因此，Reactive Data Client
鼓励提取 endpoint 之间的共享逻辑。

[Resource](/rest/api/resource) 是一组操作同一份数据的 endpoint。

```typescript
import { Entity, resource } from '@data-client/rest';

class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}

const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});
```

[Resource 简介](./getting-started/resource.md)

<details>
<summary><b>Resource 的 Endpoint</b></summary>

:::react

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = useSuspense(TodoResource.getList);

// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todos = useSuspense(TodoResource.getList, { userId: 1 });

// mutate
const ctrl = useController();

// GET https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page: 2 });

// POST https://jsonplaceholder.typicode.com/todos
ctrl.fetch(TodoResource.getList.push, { title: 'my todo' });

// POST https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.push, { userId: 1 }, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.update, { id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.partialUpdate, { id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.delete, { id: 5 });
```

:::

:::vue

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = await useSuspense(TodoResource.get, { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = await useSuspense(TodoResource.getList);

// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todos = await useSuspense(TodoResource.getList, { userId: 1 });

// mutate
const ctrl = useController();

// GET https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page: 2 });

// POST https://jsonplaceholder.typicode.com/todos
ctrl.fetch(TodoResource.getList.push, { title: 'my todo' });

// POST https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.push, { userId: 1 }, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.update, { id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.partialUpdate, { id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.delete, { id: 5 });
```

:::

</details>

### 零延迟变更 {#optimistic-updates}

:::react

[Controller.fetch](./api/Controller.md#fetch) 会调用变更 endpoint，并根据响应更新 React。
虽然 [useTransition](https://react.dev/reference/react/useTransition) 能改善体验，
但 UI 最终仍需等待 fetch 完成才会更新。

:::

:::vue

[Controller.fetch](./api/Controller.md#fetch) 会调用变更 endpoint，并根据响应更新 Vue。
UI 最终仍需等待 fetch 完成才会更新。

:::

在很多场景下，例如切换 todo.completed、增加点赞数或拖放
一个框架，这样还是太慢了！

我们可以选择让 Reactive Data Client 立即执行 :react[React]:vue[Vue] 渲染。为此，
我们需要指定_如何_渲染。

[getOptimisticResponse](/rest/guides/optimistic-updates) 就像 :react[[使用更新函数的 setState](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)]:vue[一个更新函数]。我们使用 [snap](./api/Snapshot.md) 访问 store 以获取先前的
值，再结合 fetch 参数，返回_预期的_ fetch 响应。

```typescript
const update = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'PUT',
  schema: Todo,
  // highlight-start
  getOptimisticResponse(snap, { id }, body) {
    return {
      id,
      ...body,
    };
  },
  // highlight-end
});
```

Reactive Data Client 能[在任何可能的网络故障或竞态条件下确保数据完整性](/rest/guides/optimistic-updates#optimistic-transforms)，因此你
无需担心网络故障、多次变更调用编辑同一份数据，或异步编程中的其他常见
问题。

### 远程触发的变更 {#remotely-triggered-mutations}

有时数据变化是由远程发起的——可能来自网站上的其他用户、管理员等。声明式的
[过期策略](./concepts/expiry-policy.md)控制项可以严格控制由获取引起的更新。

然而，对于频繁变化的数据（例如交易所价格行情或实时对话），有时会使用基于推送的
协议，例如 Websockets 或 Server Sent Events。Reactive Data Client 拥有一个[强大的 middleware 层，称为 Manager](./api/Manager.md)，
可以在收到服务器推送的新数据时[发起数据更新](./concepts/managers.md#data-stream)。

<details>
<summary><b>StreamManager</b></summary>

```typescript framework-imports
import type { Manager, Middleware, ActionTypes } from '@data-client/react';
import { Controller, actionTypes } from '@data-client/react';
import type { EntityInterface } from '@data-client/rest';

export default class StreamManager implements Manager {
  declare protected evtSource: WebSocket | EventSource;
  declare protected entities: Record<string, EntityInterface>;

  constructor(
    evtSource: WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.evtSource = evtSource;
    this.entities = entities;
  }

  middleware: Middleware = controller => {
    this.evtSource.onmessage = event => {
      try {
        const msg: { type: string; args: [any]; data: any } = JSON.parse(
          event.data,
        );
        if (msg.type in this.entities)
          controller.set(this.entities[msg.type], ...msg.args, msg.data);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    return next => async action => next(action);
  };

  cleanup() {
    this.evtSource.close();
  }
}
```

</details>

如果我们不需要完整的数据流，可以使用 [useSubscription()](./api/useSubscription.md) 或 [useLive()](./api/useLive.md)，
确保只监听我们关心的数据。

设置了 [pollFrequency](/rest/api/RestEndpoint#pollfrequency) 的 Endpoint 可以复用现有的 HTTP endpoint，
无需额外的 websocket 或 SSE 后端。
轮询由 [SubscriptionManager](./api/SubscriptionManager.md) 全局编排，因此即使有许多
组件订阅，Reactive Data Client 也绝不会过度获取。

[//]: # 'TODO: ## Relational joins and nesting'

## 调试 {#debugging}

<img src={require('@site/static/img/redux-devtools-logo.jpg').default} width="75" height="75" alt="redux-devtools" style={{ float: 'left', "marginRight": "var(--ifm-paragraph-margin-bottom)" }} />

安装 Redux DevTools 的
[chrome 扩展](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
或
[firefox 扩展](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

点击图标即可打开[检查器](./getting-started/debugging.md)，你可以在其中观察已 dispatch 的 action、
它们对缓存状态的影响以及当前的缓存状态。

## 模拟数据 {#mock-data}

[fixture](./api/Fixtures.md) 是一种标准格式，可以在所有 `@data-client/test` 辅助工具以及你自己的场景中使用。

<Tabs
defaultValue="detail"
values={[
{ label: 'Detail', value: 'detail' },
{ label: 'Update', value: 'update' },
{ label: '404 error', value: 'detail404' },
{ label: 'Interceptor', value: 'interceptor' },
{ label: 'Interceptor (stateful)', value: 'interceptor-stateful' },
]}>
<TabItem value="detail">

```typescript
import type { Fixture } from '@data-client/test';
import { getTodo } from './todo';

const todoDetailFixture: Fixture = {
  endpoint: getTodo,
  args: [{ id: 5 }] as const,
  response: {
    id: 5,
    title: 'Star Reactive Data Client on Github',
    userId: 11,
    completed: false,
  },
};
```

</TabItem>
<TabItem value="update">

```typescript
import type { Fixture } from '@data-client/test';
import { updateTodo } from './todo';

const todoUpdateFixture: Fixture = {
  endpoint: updateTodo,
  args: [{ id: 5 }, { completed: true }] as const,
  response: {
    id: 5,
    title: 'Star Reactive Data Client on Github',
    userId: 11,
    completed: true,
  },
};
```

</TabItem>
<TabItem value="detail404">

```typescript
import type { Fixture } from '@data-client/test';
import { getTodo } from './todo';

const todoDetail404Fixture: Fixture = {
  endpoint: getTodo,
  args: [{ id: 9001 }] as const,
  response: { status: 404, response: 'Not found' },
  error: true,
};
```

</TabItem>
<TabItem value="interceptor">

```typescript
import type { Interceptor } from '@data-client/test';

const currentTimeInterceptor: Interceptor = {
  endpoint: new RestEndpoint({
    path: '/api/currentTime/:id',
  }),
  response({ id }) {
    return {
      id,
      updatedAt: new Date().toISOString(),
    };
  },
  delay: () => 150,
};
```

</TabItem>
<TabItem value="interceptor-stateful">

```typescript
import type { Interceptor } from '@data-client/test';

const incrementInterceptor: Interceptor = {
  endpoint: new RestEndpoint({
    path: '/api/count/increment',
    method: 'POST',
    body: undefined,
  }),
  response() {
    return {
      count: (this.count = this.count + 1),
    };
  },
  delay: () => 150,
};
```

</TabItem>
</Tabs>

- :react[[为 storybook 模拟数据](./guides/storybook.md)，使用 [MockResolver](./api/MockResolver.md)]:vue[使用 `@data-client/vue/test` 中的 `MockPlugin` 模拟数据]
- :react[[测试 hook](./guides/unit-testing-hooks.md)，使用 [renderDataHook()](./api/renderDataHook.md)]:vue[[测试 composable](./guides/unit-testing-composables.md)，使用 `renderDataCompose()`]
- :react[[测试组件](./guides/unit-testing-components.md)，使用 [MockResolver](./api/MockResolver.md)]:vue[[测试组件](./guides/unit-testing-components.md)，使用 `mountDataClient()`] 和 [mockInitialState()](./api/mockInitialState.md)

## 演示 {#demo}

:::react

<Tabs
defaultValue="todo"
values={[
{ label: 'Todo', value: 'todo' },
{ label: 'GitHub', value: 'github' },
{ label: 'NextJS SSR', value: 'nextjs' },
]}
groupId="Demos"

>   <TabItem value="todo">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?embed=1&file=src%2Fpages%2FHome%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/todo-app)
</TabItem>

  <TabItem value="github">
<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hidedevtools=1&view=preview&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/github-app)
</TabItem>
<TabItem value="nextjs">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?embed=1&file=components%2Ftodo%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&showSidebar=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/nextjs)
</TabItem>
</Tabs>

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/pages/UserTodos.vue,src/resources/TodoResource.ts" view="both" />

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/vue-todo-app)

:::

<div style={{ textAlign: 'center' }}>
<Link className="button button--secondary" to="/demos">更多演示</Link>&nbsp;
<Link className="button button--secondary" to="https://skills.sh/reactive/data-client"><img src="/img/anthropic.svg" alt="Agent Skills" style={{
          height: '1em',
          verticalAlign: '-0.125em',
          display: 'inline',
        }}
/> Agent Skills</Link>
</div>
