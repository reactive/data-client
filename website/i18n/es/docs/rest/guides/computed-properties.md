---
title: Propiedades calculadas
---

import { All, Query, RestEndpoint } from '@data-client/rest';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

## Cálculos singulares {#singular-computations}

Las clases [Entity](../api/Entity.md) son clases normales, así que cualquier dato derivado común puede añadirse simplemente como
getters de la propia clase.

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

Si los cálculos son costosos, siéntete libre de añadir algo de
[memoización](https://github.com/anywhichway/nano-memoize).

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

Si simplemente quieres [deserializar un campo](./network-transform.md#deserializing-fields) a una forma más útil, como [Temporal.Instant](https://tc39.es/proposal-temporal/docs/instant.html) o [BigNumber](https://github.com/MikeMcl/bignumber.js), puedes usar
el [static schema](./network-transform.md#deserializing-fields) declarativo.

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

## Cálculos globales {#global-computations}

[Query](../api/Query.md) puede usarse para calcular datos derivados a partir de más de
una entity. Generalmente llamamos a estos cálculos agregados.

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
