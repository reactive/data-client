---
title: 计算属性
---

import { All, Query, RestEndpoint } from '@data-client/rest';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

## 单个 Entity 的计算 {#singular-computations}

[Entity](../api/Entity.md) 类就是普通的类，因此任何常见的派生数据都可以直接作为
getter 添加到类本身上。

```typescript
import { All, Entity, Query } from '@data-client/rest';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  username = '';
  email = '';

  // highlight-start
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  // highlight-end

  static key = 'User';
}
```

如果计算开销较大，可以随意加上一些
[记忆化](https://github.com/anywhichway/nano-memoize)。

```typescript
import { All, Entity, Query } from '@data-client/rest';
import memoize from 'nano-memoize';

class User extends Entity {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```

:::tip

如果你只是想把某个字段[反序列化](./network-transform.md#deserializing-fields)为更有用的形式，例如 [Temporal.Instant](https://tc39.es/proposal-temporal/docs/instant.html) 或 [BigNumber](https://github.com/MikeMcl/bignumber.js)，可以使用
声明式的 [static schema](./network-transform.md#deserializing-fields)。

```typescript
import { All, Entity, Query } from '@data-client/rest';
import BigNumber from 'bignumber.js';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  lifetimeBlinkCount = BigNumber(0);

  static key = 'User';

  // highlight-start
  static schema = {
    createdAt: Temporal.Instant.from,
    lifetimeBlinkCount: BigNumber,
  };
  // highlight-end
}
```

:::

## 全局计算 {#global-computations}

[Query](../api/Query.md) 可用于基于多个 Entity 计算派生数据。
我们通常把这类计算称为聚合。

<FrameworkPlayground row fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
{ id: '777', name: 'Albatras', isAdmin: true },
],
delay: 150,
},
]}>

```ts title="resources/User" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
```

:::react

```tsx title="UsersPage"
import { All, Query, schema } from '@data-client/rest';
import { useQuery, useSuspense } from '@data-client/react';
import { UserResource, User } from './resources/User';

const getUserCount = new Query(
  new All(User),
  (entries, { isAdmin } = {}) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

function UsersPage() {
  useSuspense(UserResource.getList);
  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
  // this should never happen since we suspense but typescript does not know that
  if (userCount === undefined) return null;
  return (
    <div>
      <div>Total users: {userCount}</div>
      <div>Total admins: {adminCount}</div>
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="UsersPage.vue"
<script lang="ts">
  import { All, Query, schema } from '@data-client/rest';
  import { UserResource, User } from './resources/User';

  const getUserCount = new Query(
    new All(User),
    (entries, { isAdmin } = {}) => {
      if (isAdmin !== undefined)
        return entries.filter(user => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );
</script>

<script setup lang="ts">
  import { useQuery, useSuspense } from '@data-client/vue';

  await useSuspense(UserResource.getList);
  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
</script>

<template>
  <!-- userCount is never undefined since we suspense, but typescript does not know that -->
  <div v-if="userCount !== undefined">
    <div>Total users: {{ userCount }}</div>
    <div>Total admins: {{ adminCount }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>
