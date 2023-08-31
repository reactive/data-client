---
title: Computed Properties
---

import { RestEndpoint } from '@data-client/rest';
import HooksPlayground from '@site/src/components/HooksPlayground';

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
memoization.

```typescript
import { Entity } from '@data-client/rest';
import { memoize } from 'lodash';

class User extends Entity {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```

:::tip

If you simply want to [deserialize a field](./network-transform.md#deserializing-fields) to a more useful form like [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) or [BigNumber](https://github.com/MikeMcl/bignumber.js), you can use
the declarative [static schema](./network-transform.md#deserializing-fields).

```typescript
import { Entity } from '@data-client/rest';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  createdAt = Temporal.Instant.fromEpochSeconds(0);

  pk() {
    return this.id;
  }
  static key = 'User';

  // highlight-start
  static schema = {
    createdAt: Temporal.Instant.from,
  };
  // highlight-end
}
```

:::

## Global computations

[Query](../api/Query.md) can be used for computations of derived data from more than
one entity.

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
import { Query, schema } from '@data-client/rest';
import { UserResource, User } from './api/User';

const getUserCount = new Query(
  new schema.All(User),
  (entries, { isAdmin } = {}) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const userCount = useCache(getUserCount);
  const adminCount = useCache(getUserCount, { isAdmin: true });
  if (userCount === undefined)
    return <div>No users in cache yet</div>;
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
