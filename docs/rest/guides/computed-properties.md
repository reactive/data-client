---
title: Computed Properties
---

import { RestEndpoint } from '@data-client/rest';
import HooksPlayground from '@site/src/components/HooksPlayground';

## Singular computations

[Entity](../api/Entity.md) classes are just normal classes, so any common derived data can just be added as
getters to the class itself.

```typescript
import { Entity } from '@data-client/rest';

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

  pk() {
    return this.id;
  }
  static key = 'User';
}
```

If the computations are expensive feel free to add some
[memoization](https://github.com/anywhichway/nano-memoize).

```typescript
import { Entity } from '@data-client/rest';
import memoize from 'nano-memoize';

class User extends Entity {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```

:::tip

If you simply want to [deserialize a field](./network-transform.md#deserializing-fields) to a more useful form like [Temporal.Instant](https://tc39.es/proposal-temporal/docs/instant.html) or [BigNumber](https://github.com/MikeMcl/bignumber.js), you can use
the declarative [static schema](./network-transform.md#deserializing-fields).

```typescript
import { Entity } from '@data-client/rest';
import BigNumber from 'bignumber.js';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  lifetimeBlinkCount = BigNumber(0);

  pk() {
    return this.id;
  }
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

## Global computations

[Query](../api/Query.md) can be used for computations of derived data from more than
one entity. We generally call these aggregates.

<HooksPlayground row fixtures={[
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

```ts title="api/User" collapsed
export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
  pk() {
    return this.id;
  }
}
export const UserResource = createResource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage"
import { schema } from '@data-client/rest';
import { useQuery, useSuspense } from '@data-client/react';
import { UserResource, User } from './api/User';

const getUserCount = new schema.Query(
  new schema.All(User),
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
  if (userCount === undefined) return;
  return (
    <div>
      <div>Total users: {userCount}</div>
      <div>Total admins: {adminCount}</div>
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>
