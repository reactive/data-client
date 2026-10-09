---
title: Propriedades computadas
---

import { All, Query, RestEndpoint } from '@data-client/rest';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

## Computações singulares {#singular-computations}

As classes [Entity](../api/Entity.md) são apenas classes normais, então qualquer dado derivado comum pode ser adicionado como
getters na própria classe.

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

Se as computações forem custosas, sinta-se à vontade para adicionar alguma
[memoização](https://github.com/anywhichway/nano-memoize).

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

Se você simplesmente quer [desserializar um campo](./network-transform.md#deserializing-fields) para uma forma mais útil, como [Temporal.Instant](https://tc39.es/proposal-temporal/docs/instant.html) ou [BigNumber](https://github.com/MikeMcl/bignumber.js), pode usar
o [static schema](./network-transform.md#deserializing-fields) declarativo.

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

## Computações globais {#global-computations}

O [Query](../api/Query.md) pode ser usado para computar dados derivados de mais de
uma entity. Geralmente chamamos isso de agregados.

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
