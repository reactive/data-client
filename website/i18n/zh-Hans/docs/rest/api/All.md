---
title: All Schema - 访问 Reactive Data Client store 中的每一个 Entity
sidebar_label: All
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# All

以 Array 的形式获取缓存中的所有 Entity。

- `definition`：**必填** 该数组所包含的单个 [Entity](./Entity.md)，_或_属性值到 [Entity](./Entity.md) 的映射。
- `schemaAttribute`：_可选_（当 `definition` 不是单个 schema 时必填）每个 Entity 上的一个属性，根据 definition 映射决定规范化时使用哪个 schema。
  可以是字符串或函数。如果是函数，它接收以下参数：
  _ `value`：该 Entity 的输入值。
  _ `parent`：输入数组的父对象。\* `key`：输入数组在父对象上所处的键。

## 实例方法 {#instance-methods}

- `define(definition)`：调用时，传入的 `definition` 会与传给 `All` 构造函数的原始 definition 合并。此方法通常用于在 schema 中创建循环引用。

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
{
endpoint: new RestEndpoint({path: '/users', method:'POST'}),
args: [{ name: 'ABC' }],
response: { id: '777', name: 'ABC' },
delay: 150,
},
]}>

```tsx title="api/User" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
}
export const createUser = new RestEndpoint({
  path: '/users',
  schema: User,
  body: { name: '' },
  method: 'POST'
});
```

:::react

```tsx title="NewUser" collapsed
import React from 'react';
import { useController } from '@data-client/react';
import { createUser } from './api/User';

export default function NewUser() {
  const ctrl = useController();
  const handlePress = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ctrl.fetch(createUser, {name: e.currentTarget.value});
        e.currentTarget.value = '';
      }
    },
    [ctrl],
  );
  return <input onKeyPress={handlePress}/>;
}
```

```tsx title="UsersPage.tsx"
import { RestEndpoint, All } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import { User } from './api/User';
import NewUser from './NewUser';

const getUsers = new RestEndpoint({
  path: '/users',
  schema: new All(User),
});

function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
      <NewUser />
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="NewUser.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { createUser } from './api/User';

  const ctrl = useController();
  const name = ref('');

  const handleEnter = () => {
    ctrl.fetch(createUser, { name: name.value });
    name.value = '';
  };
</script>

<template>
  <input v-model="name" @keyup.enter="handleEnter" />
</template>
```

```html title="UsersPage.vue"
<script lang="ts">
  import { RestEndpoint, All } from '@data-client/rest';
  import { User } from './api/User';

  const getUsers = new RestEndpoint({
    path: '/users',
    schema: new All(User),
  });
</script>

<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import NewUser from './NewUser.vue';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
    <NewUser />
  </div>
</template>
```

:::

</FrameworkPlayground>

### 多态类型 {#polymorphic-types}

如果输入数据是包含多种 Entity 类型的数组，就需要定义 schema 映射。

:::note

如果数据中返回了你没有提供映射的对象，结果中会返回原始对象，并且不会创建 Entity。

:::

#### 字符串形式的 schemaAttribute {#string-schemaattribute}

<PolymorphicFeedDemo schema="All" attribute="string" />

#### 函数形式的 schemaAttribute {#function-schemaattribute}

返回值应与 `definition` 中的某个键匹配。这里展示与“字符串”情形相同的行为，
只是会在末尾追加一个 's'。

<PolymorphicFeedDemo schema="All" attribute="function" />
