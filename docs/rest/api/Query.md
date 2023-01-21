---
title: Query
slug: Query
---

<head>
  <title>Query - Programmatic performant store access</title>
  <meta name="docsearch:pagerank" content="30"/>
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

### Sorting & Filtering

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

interface Args {
  asc: boolean;
  isAdmin?: boolean;
}
const sortedUsers = new Query(
  new schema.All(User),
  (entries, { asc, isAdmin }: Args = { asc: false }) => {
    let sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (isAdmin !== undefined)
      sorted = sorted.filter(user => user.isAdmin === isAdmin);
    if (asc) return sorted;
    return sorted.reverse();
  },
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

### Aggregates

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
import { Query, schema } from '@rest-hooks/rest';
import { UserResource, User } from './api/User';

const getUserCount = new Query(
  new schema.All(User),
  (entries, { isAdmin } = { }) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const userCount = useCache(getUserCount);
  const adminCount = useCache(getUserCount, { isAdmin: true });
  if (userCount === undefined) return <div>No users in cache yet</div>;
  return (
    <div>
    <div>
      Total users: {userCount}
    </div>
    <div>
      Total admins: {adminCount}
    </div>
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>

### Client side joins

Even if the network responses don't nest data, we can perform client-side joins by specifying
the relationship in [Entity.schema](./Entity.md#schema)

<HooksPlayground>

```ts title="api/User.ts" collapsed
export class User extends Entity {
  id = 0;
  name = '';
  email = '';
  website = '';
  pk() {
    return `${this.id}`;
  }
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```ts title="api/Todo.ts" collapsed
import { User } from './User';

export class Todo extends Entity {
  id = 0;
  userId = User.fromJS({});
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
  static schema = {
    userId: User,
  };
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```tsx title="TodoJoined.tsx"
import { Query, schema } from '@rest-hooks/rest';
import { TodoResource, Todo } from './api/Todo';
import { UserResource, User } from './api/User';

const todosWithUser = new Query(
  new schema.All(Todo),
  (entries, { userId = 0 }) => {
    return entries.filter(todo => todo.userId?.id === userId);
  },
);

function TodosPage() {
  useFetch(UserResource.getList);
  useFetch(TodoResource.getList);
  const todos = useCache(todosWithUser, { userId: 1 });
  if (!todos) return <div>No Todos in cache yet</div>;
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.pk()}>
          {todo.title} by {todo.userId.name}
        </div>
      ))}
    </div>
  );
}
render(<TodosPage />);
```

</HooksPlayground>
