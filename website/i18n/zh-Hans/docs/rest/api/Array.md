---
title: schema.Array - 面向 React 的声明式列表数据
vue_title: schema.Array - 面向 Vue 的声明式列表数据
sidebar_label: schema.Array
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# schema.Array

创建一个用于规范化 schema 数组的 schema。如果输入值是 [Object](./Object.md) 而不是 `Array`，
规范化的结果将是由该 [Object](./Object.md) 的值组成的 `Array`。

_注意：同样的行为也可以用简写语法定义：`[ mySchema ]`_

- `definition`：**必填** 该数组所包含的单个 schema，_或_属性值到 schema 的映射。
- `schemaAttribute`：_可选_（当 `definition` 不是单个 schema 时必填）每个 Entity 上的一个属性，根据 definition 映射决定规范化时使用哪个 schema。
  可以是字符串或函数。如果是函数，它接收以下参数：
  _ `value`：该 Entity 的输入值。
  _ `parent`：输入数组的父对象。\* `key`：输入数组在父对象上所处的键。

:::tip

对于以 `string` 为键的无界集合，请使用 [schema.Values](./Values.md)

:::

:::tip

使用 [Collections](./Collection.md) 让它变为可变的（可以 [push](./Collection.md#push)/[unshift](./Collection.md#unshift) 新条目）

:::

## 实例方法 {#instance-methods}

- `define(definition)`：调用时，传入的 `definition` 会与传给 `Array` 构造函数的原始 definition 合并。此方法通常用于在 schema 中创建循环引用。

## 用法 {#usage}

描述由单一 Entity 类型组成的简单数组：

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
],
delay: 150,
},
]}>

:::react

```tsx title="Users.tsx"
import { Entity, RestEndpoint, schema } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```ts title="api/User"
import { Entity, RestEndpoint, schema } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
```

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUsers } from './api/User';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### 更新多个 Entity {#updating-many-entities}

将 Array 与 [Controller.set()](/docs/api/Controller#set-array) 配合使用，无需 endpoint，
即可在一次 store 更新中写入多个 Entity。

```ts
ctrl.set(
  [User],
  [
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
  ],
);
```

### 多态类型 {#polymorphic-types}

如果输入数据是包含多种 Entity 类型的数组，就需要定义 schema 映射。

:::note

如果数据中返回了你没有提供映射的对象，结果中会返回原始对象，并且不会创建 Entity。

:::

#### 字符串形式的 schemaAttribute {#string-schemaattribute}

<PolymorphicFeedDemo schema="schema.Array" attribute="string" />

#### 函数形式的 schemaAttribute {#function-schemaattribute}

返回值应与 `definition` 中的某个键匹配。这里展示与“字符串”情形相同的行为，
只是会在末尾追加一个 's'。

<PolymorphicFeedDemo schema="schema.Array" attribute="function" />
