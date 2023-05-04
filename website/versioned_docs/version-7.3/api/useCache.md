---
title: useCache()
---

<head>
  <title>useCache() - Normalized data store access in React</title>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@rest-hooks/rest';

Data rendering without the fetch.

General purpose store access can be useful when the data's existance is of interest (like if a user is authenticated),
or general purpose store access like [Query](/rest/api/Query)

## Usage

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/user'}),
args: [],
response: { id: '777', name: 'Albatras', isAdmin: true },
delay: 500,
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
export const UserResource = {
  ...createResource({
    path: '/users/:id',
    schema: User,
  }),
  current: new RestEndpoint({
    path: '/user',
    schema: User,
  }),
};
```

```tsx title="NotAuthorized" collapsed
import { useLoading } from '@rest-hooks/hooks';
import { UserResource } from './api/User';

export default function NotAuthorized() {
  const ctrl = useController();
  const [handleLogin, loading] = useLoading((e: any) => {
    e.preventDefault();
    return ctrl.fetch(UserResource.current);
  }, []);
  return (
    <div>
      <p>Not authorized</p>
      {loading ? (
        'logging in...'
      ) : (
        <a href="#" onClick={handleLogin}>
          Login
        </a>
      )}
    </div>
  );
}
```

```tsx title="AuthorizedUserOnlyControls" collapsed
import { User, UserResource } from './api/User';

export default function AuthorizedUserOnlyControls({ user }: { user: User }) {
  const ctrl = useController();
  const handleLogout = (e: any) => {
    e.preventDefault();
    return ctrl.invalidate(UserResource.current);
  };

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <a href="#" onClick={handleLogout}>
        Logout
      </a>
    </div>
  );
}
```

```tsx title="AuthorizedPage"
import { UserResource } from './api/User';
import NotAuthorized from './NotAuthorized';
import AuthorizedUserOnlyControls from './AuthorizedUserOnlyControls';

function AuthorizedPage() {
  // currentUser as User | undefined
  const currentUser = useCache(UserResource.current);
  // user is not logged in
  if (!currentUser) return <NotAuthorized />;
  // currentUser as User (typeguarded)
  return <AuthorizedUserOnlyControls user={currentUser} />;
}
render(<AuthorizedPage />);
```

</HooksPlayground>

See [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) for
more information about type handling

## Behavior

| Expiry Status | Returns      | Conditions                                                                                                                                                                   |
| ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | `undefined`  | not in store, [deletion](/rest/api/createResource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | denormalized | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                                                                 |
| Valid         | denormalized | fetch completion                                                                                                                                                             |
|               | `undefined`  | `null` used as second argument                                                                                                                                               |

<ConditionalDependencies hook="useCache" />

## Types

<GenericsTabs>

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema> | null;
```

```typescript
function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined>,
    'key' | 'schema' | 'invalidIfStale'
  >,
  Args extends readonly [...Parameters<E['key']>] | readonly [null],
>(endpoint: E, ...args: Args): DenormalizeNullable<E['schema']>;
```

</GenericsTabs>

## Examples

### Query arbitrary Entities

[Query](/rest/api/Query) provides programmatic access to the Rest Hooks store.

<HooksPlayground fixtures={[
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

```tsx title="UsersPage.tsx" {15}
import { Query, schema } from '@rest-hooks/rest';
import { UserResource, User } from './api/User';

const sortedUsers = new Query(
  new schema.All(User),
  (entries, { asc } = { asc: false }) => {
    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
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

### Todo App

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" />

Explore more [Rest Hooks demos](/demos)
