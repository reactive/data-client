---
title: Invalidate Schema - 使 Entity 失效
sidebar_label: Invalidate
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

# Invalidate

描述需要被标记为 [INVALID](/docs/concepts/expiry-policy#invalid) 的 Entity。这会把条目从
collection 中移除，或者对那些需要该 Entity 的 endpoint [强制触发 suspense](/docs/concepts/expiry-policy#invalidate-entity)。

## 构造函数 {#constructor}

```typescript
new Invalidate(entity)
new Invalidate(union)
new Invalidate(entityMap, schemaAttribute)
```

- `entity`：要使其失效的单个 [Entity](./Entity.md)。
- `union`：用于多态失效的 [Union](./Union.md) schema。
- `entityMap`：schema 键到 [Entity](./Entity.md) 的映射。
- `schemaAttribute`：_可选_（使用 `entityMap` 时必填）每个 Entity 上的一个属性，用于决定规范化时按照 entityMap 使用哪个 schema。
  可以是字符串或函数。如果是函数，它接收以下参数：
  - `value`：该 Entity 的输入值。
  - `parent`：输入数组的父对象。
  - `key`：输入数组在父对象上对应的键。

## 用法 {#usage}

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
    { id: '555', name: 'Phone' },
  ],
delay: 150,
},
{
  endpoint: new RestEndpoint({path: '/users/:id', method: 'DELETE' }),
  response({id}) {
    return {id}
  },
  delay: 150,
}
]}>

```typescript title="api/User"
import { Entity, RestEndpoint, Collection, Invalidate } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new Collection([User]),
});
export const deleteUser = new RestEndpoint({
  path: '/users/:id',
  method: 'DELETE',
  schema: new Invalidate(User),
});
```

:::react

```tsx title="UserPage"
import { useSuspense, useController } from '@data-client/react';
import { getUsers, deleteUser } from './api/User';

function UsersPage() {
  const users = useSuspense(getUsers);
  const ctrl = useController();
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>
          {user.name}{' '}
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => ctrl.fetch(deleteUser, { id: user.id })}
          >
            ❌
          </span>
        </div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense, useController } from '@data-client/vue';
  import { getUsers, deleteUser } from './api/User';

  const users = await useSuspense(getUsers);
  const ctrl = useController();
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">
      {{ user.name }}
      <span
        style="cursor: pointer"
        @click="ctrl.fetch(deleteUser, { id: user.id })"
      >
        ❌
      </span>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### 批量失效 {#batch-invalidation}

这里我们通过把 `Invalidate` 包裹在数组中，再添加一个可一次删除多个 Entity 的 endpoint。
这样 `Data Client` 就能对响应中的每个 Entity 执行 `invalidate`。

<EndpointPlayground
input="/posts"
init={
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(['5', '13', '7']),
  }
}
status={200}
response={[{ id: '5' }, { id: '13' }, { id: '7' }]}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
}
```

```typescript title="Resource" {9}
import { resource, Invalidate } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  body: [] as string[],
  method: 'DELETE',
  schema: [new Invalidate(Post)],
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.deleteMany(['5', '13', '7']);
```

</EndpointPlayground>

有时后端对 'DELETE' 请求什么也不返回。这种
情况下，我们可以使用 [process](./RestEndpoint.md#process)，根据参数 `body`
构造一个可用的响应。

<EndpointPlayground
input="/posts"
init={
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(['5', '13', '7']),
  }
}
status={204}
response={undefined}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
}
```

```typescript title="Resource" {10-13}
import { resource, Invalidate } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  body: [] as string[],
  method: 'DELETE',
  schema: [new Invalidate(Post)],
  process(value, body) {
    // use the body payload to inform which entities to delete
    return body.map(id => ({ id }));
  }
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.deleteMany(['5', '13', '7']);
```

</EndpointPlayground>

如果要在没有 endpoint 的情况下删除多个 Entity（例如处理 websocket 消息时），可以把同样的 schema 传给
[Controller.set()](/docs/api/Controller#set-array)：

```ts
ctrl.set([new Invalidate(Post)], [{ id: '5' }, { id: '13' }, { id: '7' }]);
```

或者删除单个 Entity：

```ts
ctrl.set(new Invalidate(Post), { id: '5' });
```

### 多态类型 {#polymorphic-types}

如果你的 endpoint 可以删除不止一种类型的 Entity，就可以使用多态失效。

#### 使用 Union schema {#with-union-schema}

最简单的方式是直接传入已有的 [Union](./Union.md) schema：

```typescript
import { Entity, RestEndpoint, Union, Invalidate } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
  readonly type = 'users';
}
class Group extends Entity {
  id = '';
  groupname = '';
  readonly type = 'groups';
}

const MemberUnion = new Union(
  { users: User, groups: Group },
  'type'
);

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(MemberUnion),
});
```

#### 字符串 schemaAttribute {#string-schemaattribute}

或者，也可以用一个字符串属性内联定义多态映射：

```typescript
import { RestEndpoint, Invalidate } from '@data-client/rest';

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(
    { users: User, groups: Group },
    'type'
  ),
});
```

#### 函数 schemaAttribute {#function-schemaattribute}

返回值应与 entity map 中的某个键相匹配。这适用于更复杂的区分逻辑：

```typescript
import { RestEndpoint, Invalidate } from '@data-client/rest';

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(
    { users: User, groups: Group },
    (input, parent, key) => input.memberType === 'user' ? 'users' : 'groups'
  ),
});
```

### 对 useSuspense() 的影响 {#impact-on-usesuspense}

当 :react[React]:vue[Vue] 中当前正在展示的结果里有 Entity 失效时，useSuspense()
会将它们视为无效

- 对于可选的 Entity，只是将其移除
- 对于必需的 Entity，这会使整个响应失效，从而重新触发 suspense。
