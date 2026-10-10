---
title: Entity 与数据规范化
sidebar_label: 数据规范化
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import Link from '@docusaurus/Link';
import SchemaTable from '../shared/\_schema_table.mdx';

[Entity](/rest/api/Entity) 拥有主键，因此可以通过查找表轻松访问。
这样一来，无论同一份数据出现在哪个 endpoint 中，你都能方便地查找、更新、创建或删除它。

<!--
<LanguageTabs>

```ts
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;
}
```

```js
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
}
```

</LanguageTabs>
-->

<Tabs
defaultValue="State"
values={[
{ label: 'State', value: 'State' },
{ label: 'Response', value: 'Response' },
{ label: 'Endpoint', value: 'Endpoint' },
{ label: 'Entity', value: 'Entity' },
{ label: 'Component', value: 'Component' },
]}>
<TabItem value="State">

![Entity 缓存](/img/entities.png 'Entity 缓存')

</TabItem>
<TabItem value="Response">

```json
[
  { "id": 1, "title": "this is an entity" },
  { "id": 2, "title": "this is the second entity" }
]
```

</TabItem>
<TabItem value="Endpoint">

```typescript
const getPresentations = new Endpoint(
  () => fetch(`/presentations`).then(res => res.json()),
  { schema: new Collection([Presentation]) },
);
```

</TabItem>
<TabItem value="Entity">

```typescript
class Presentation extends Entity {
  id = '';
  title = '';

  static key = 'Presentation';
}
```

</TabItem>
<TabItem value="Component">

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { getPresentations } from './api/Presentation';

export function PresentationsPage() {
  const presentation = useSuspense(getPresentations);
  return presentation.map(presentation => (
    <div key={presentation.pk()}>{presentation.title}</div>
  ));
}
```

:::

:::vue

```html title="PresentationsPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getPresentations } from './api/Presentation';

  const presentations = await useSuspense(getPresentations);
</script>

<template>
  <div v-for="presentation in presentations" :key="presentation.pk()">
    {{ presentation.title }}
  </div>
</template>
```

:::

</TabItem>
</Tabs>

从响应中提取 entity 的过程称为 `normalization`（规范化）。访问响应时则通过 `denormalization`（反规范化）
逆转这一过程。

:::info[全局引用相等]

使用 entity 可以将 Reactive Data Client 的全局引用相等保证扩展到比整个 endpoint 响应
更细的粒度。

:::

## 变更与动态数据 {#mutations-and-dynamic-data}

当 endpoint 修改数据时，这称为[副作用](/rest/guides/side-effects)。用 [sideEffect: true](/rest/api/Endpoint#sideeffect) 标记 endpoint
会告诉 Reactive Data Client 该 endpoint 不是幂等的，因此不应在可能任意多次调用该 endpoint 的 hook 中使用它，
例如 [useSuspense()](../api/useSuspense.md) 或 [useFetch()](../api/useFetch.md)

只要在 endpoint 的响应中包含被修改的数据，并指定 schema，Reactive Data Client 就能
更新它从中提取的所有 entity。

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```typescript
import { RestEndpoint, schema } from '@data-client/rest';

const todoCreate = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  method: 'POST',
  schema: new Collection([Todo]).push,
});
```

<details>
<summary><b>使用示例</b></summary>

:::react

```tsx
import { useController } from '@data-client/react';
import { todoCreate } from './api/Todo';
import Form from './Form';
import FormField from './FormField';

export default function NewTodoForm() {
  const ctrl = useController();
  return (
    <Form
      onSubmit={e => ctrl.fetch(todoCreate, new FormData(e.target))}
    >
      <FormField name="title" />
    </Form>
  );
}
```

:::

:::vue

```html title="NewTodoForm.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { todoCreate } from './api/Todo';
  import Form from './Form.vue';
  import FormField from './FormField.vue';

  const ctrl = useController();
  const handleSubmit = (e: Event) =>
    ctrl.fetch(todoCreate, new FormData(e.target as HTMLFormElement));
</script>

<template>
  <Form @submit="handleSubmit">
    <FormField name="title" />
  </Form>
</template>
```

:::

</details>

</TabItem>
<TabItem value="Update">

```typescript
import { RestEndpoint } from '@data-client/rest';

const todoUpdate = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'PUT',
  schema: Todo,
});
```

<details>
<summary><b>使用示例</b></summary>

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { todoDetail, todoUpdate } from './api/Todo';
import Form from './Form';
import FormField from './FormField';

export default function UpdateTodoForm({ id }: { id: number }) {
  const todo = useSuspense(todoDetail, { id });
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(todoUpdate, { id }, new FormData(e.target))
      }
      initialValues={todo}
    >
      <FormField name="title" />
    </Form>
  );
}
```

:::

:::vue

```html title="UpdateTodoForm.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { todoDetail, todoUpdate } from './api/Todo';
  import Form from './Form.vue';
  import FormField from './FormField.vue';

  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(todoDetail, () => ({ id: props.id }));
  const ctrl = useController();
  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      todoUpdate,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <Form @submit="handleSubmit" :initialValues="todo">
    <FormField name="title" />
  </Form>
</template>
```

:::

</details>

</TabItem>
<TabItem value="Delete">

```typescript
import { Invalidate, RestEndpoint } from '@data-client/rest';

const todoDelete = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'DELETE',
  schema: new Invalidate(Todo),
});
```

<details>
<summary><b>使用示例</b></summary>

:::react

```tsx
import { useController } from '@data-client/react';
import { todoDelete, type Todo } from './api/Todo';

export default function TodoWithDelete({ todo }: { todo: Todo }) {
  const ctrl = useController();
  return (
    <div>
      {todo.title}
      <button onClick={() => ctrl.fetch(todoDelete, { id: todo.id })}>
        Delete
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="TodoWithDelete.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { todoDelete, type Todo } from './api/Todo';

  defineProps<{ todo: Todo }>();
  const ctrl = useController();
</script>

<template>
  <div>
    {{ todo.title }}
    <button @click="ctrl.fetch(todoDelete, { id: todo.id })">Delete</button>
  </div>
</template>
```

:::

</details>

</TabItem>
</Tabs>

:::info

变更会自动更新规范化缓存，从而保证数据一致且新鲜。

:::

## Schema {#schema}

schema 以声明式的方式定义如何[处理响应](/rest/api/schema)

- 在[何处](/rest/api/schema)预期出现 [Entity](/rest/api/Entity)
- 用于[反序列化字段](/rest/guides/network-transform#deserializing-fields)的函数

```typescript
import { RestEndpoint, Collection } from '@data-client/rest';

const getTodoList = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  // highlight-next-line
  schema: new Collection([Todo]),
});
```

将 [Entity](/rest/api/Entity) `Todo` 放入数组 [Collection](/rest/api/Collection) 中，就可以轻松地
向其中 [push](/rest/api/RestEndpoint#push) 或 [unshift](/rest/api/RestEndpoint#unshift) 新的 `Todos`。

除了数组之外，还提供了另外几种适用于不同模式的 schema。前两种（Object 和 Array）
可以简写为对象字面量和数组字面量。

<SchemaTable/>

[了解更多](/rest/api/schema)

### 嵌套 {#nesting}

此外，[Entity](/rest/api/Entity) 本身也可以通过声明 [static schema](/rest/api/Entity#schema) 成员
来指定[嵌套 schema](/rest/guides/relational-data)。

<Tabs
defaultValue="Entity"
values={[
{ label: 'Entity', value: 'Entity' },
{ label: 'Response', value: 'Response' },
]}>
<TabItem value="Entity">

```typescript
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;

  static key = 'Todo';

  // highlight-start
  static schema = {
    user: User,
  };
  // highlight-end
}

class User extends Entity {
  id = 0;
  username = '';

  static key = 'User';
}
```

</TabItem>
<TabItem value="Response">

```json
{
  "id": 5,
  "user": {
    "id": 10,
    "username": "bob"
  },
  "title": "Write some Entities",
  "completed": false
}
```

</TabItem>
</Tabs>

[了解更多](/rest/guides/relational-data)

### 数据表示 {#data-representations}

此外，函数也可以[用作 schema](/rest/guides/network-transform#deserializing-fields)，它会在反规范化期间被调用。
这对于 [bignumber](https://mikemcl.github.io/bignumber.js/) 或 [temporal instant](https://tc39.es/proposal-temporal/docs/instant.html) 这类表示形式可能很有用

```ts
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;
  // highlight-next-line
  dueDate = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Todo';

  static schema = {
    user: User,
    // highlight-next-line
    dueDate: Temporal.Instant.from,
  };
}
```

:::info

得益于全局引用相等保证，每次更新时成员只会构造一次。

:::

## 检查 store（调试） {#store-inspection-debugging}

可以安装 [DevTools 浏览器扩展](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
来检查和[调试 store](../getting-started/debugging.md)。

![browser-devtools](/img/devtool-state.png 'Reactive Data Client devtools')

<center>

<Link className="button button--secondary" to="../getting-started/debugging">Data Client 调试指南 »</Link>

</center>

## 基准测试 {#benchmarks}

与非规范化方案相比，entity 级别的记忆化可带来高达 **20 倍**的反规范化性能提升，以及快 **90 倍**的变更传播速度。
完整的规范化基准测试结果以及完整的 React 集成基准测试，请参阅[性能](./performance.md)页面。