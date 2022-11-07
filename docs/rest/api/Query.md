---
title: Query
slug: Query
---

<head>
  <title>Query - Programmatic retrieval of cache state</title>
</head>

import { RestEndpoint } from '@rest-hooks/rest';
import HooksPlayground from '@site/src/components/HooksPlayground';

`Query` provides programmatic access to the Rest Hooks cache while maintaining
the same high performance and referential equality guarantees expected of Rest Hooks.

```typescript
class Query<S extends SchemaSimple, P extends any[] = []> {
  constructor(
    schema: S,
    process?: (entries: Denormalize<S>, ...args: P) => Denormalize<S>,
  );

  schema: S;
  key(...args: P): string;

  process: (entries: Denormalize<S>, ...args: P) => Denormalize<S>;
}
```

`Query` implements the [EndpointInterface](./Endpoint.md) but without the fetch function, which
means it can only be passed to the [data binding hook useCache()](/docs/api/useCache)

## Usage

### Simplest

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
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

```ts title="api/User.ts" collapsed
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

```tsx title="UsersPage.tsx" {4}
import { Query, schema } from '@rest-hooks/rest';
import { UserResource, User } from './api/User';

const allUsers = new Query(new schema.All(User));

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useCache(allUsers);
  if (!users) return <div>No users in cache yet</div>;
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

</HooksPlayground>

### Sorting

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
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

```ts title="api/User.ts" collapsed
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

```tsx title="UsersPage.tsx"
import { Query, schema } from '@rest-hooks/rest';
import { UserResource, User } from './api/User';

const sortedUsers = new Query(
  new schema.All(User),
  (entries, { asc } = { asc: false }) => {
    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (asc) return sorted;
    return sorted.reverse();
  }
);

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useCache(sortedUsers, { asc: true });
  if (!users) return <div>No users in cache yet</div>;
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

</HooksPlayground>

### Filtering

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
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

```ts title="api/User.ts" collapsed
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

```tsx title="UsersPage.tsx"
import { Query, schema } from '@rest-hooks/rest';
import { UserResource, User } from './api/User';

const usersByAdmin = new Query(
  new schema.All(User),
  (entries, { isAdmin }: { isAdmin?: boolean } = {}) => {
    if (isAdmin === undefined) return entries;
    return entries.filter(user => user.isAdmin === isAdmin);
  }
);

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useCache(usersByAdmin, { isAdmin: true });
  if (!users) return <div>No users in cache yet</div>;
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

</HooksPlayground>

## Query members

### schema

[Schema](./schema.md) used to retrieve/denormalize data from the Rest Hooks cache.
Most cases will use [schema.All](./All.md), which retrieves all entities of a given type found
in the cache.

### process(entries, ...args) {#process}

Takes the (denormalized) response as entries and arguments and returns the new
response for use with [useCache](/docs/api/useCache)

### key(...args) {#key}

Implements [Endpoint.key](./Endpoint.md#key) Used to determine recomputation of memoized values.
