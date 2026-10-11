---
title: schema.Object - 面向 React 的声明式对象数据
vue_title: schema.Object - 面向 Vue 的声明式对象数据
sidebar_label: schema.Object
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

# schema.Object

定义一个普通对象映射，其中的值需要被规范化为 Entity。_注意：同样的行为也可以用简写语法定义：`{ ... }`_

- `definition`: **必填** 此对象中嵌套 Entity 的定义。默认为空对象。
  除了存放其他 Entity 的键之外，你_无需_在对象中定义任何键。其他所有值都会被复制到规范化后的输出中。

:::tip

`Objects` 的成员是静态已知的。对于不限定成员的对象（任意 `string` 键），请使用 [Values](./Values.md)

:::

#### 实例方法 {#instance-methods}

- `define(definition)`: 调用时，传入的 `definition` 会与传给 `Object` 构造函数的原始定义合并。这个方法通常用于在 schema 中创建循环引用。

#### 用法 {#usage}

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: { users: [{ id: '123', name: 'Beth' }] },
delay: 150,
},
]}>

:::react

```tsx title="UsersPage.tsx"
import { Entity, RestEndpoint, schema } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

class User extends Entity {
  id = '';
  name = '';
}
const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Object({ users: new schema.Array(User) }),
});
function UsersPage() {
  const { users } = useSuspense(getUsers);
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

class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Object({ users: new schema.Array(User) }),
});
```

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUsers } from './api/User';

  const data = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in data.users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>
