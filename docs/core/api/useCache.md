---
title: useCache() - Normalized data store access in React
sidebar_label: useCache()
description: Data rendering without the fetch. Access any Endpoint's response.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';

# useCache()

Data rendering without the fetch.

Access any [Endpoint](/rest/api/Endpoint)'s response. If the response does not exist, returns
`undefined`. This can be used to check for an `Endpoint's` existance like for authentication.

`useCache()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary.

## Usage

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/user'}),
args: [],
response: { id: '777', name: 'Albatras', isAdmin: true },
delay: 500,
},
]} row>

```ts title="UserResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;

  static key = 'User';
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```

```tsx title="Unauthed" collapsed
import { useLoading } from '@data-client/react';
import { UserResource } from './UserResource';

export default function Unauthed() {
  const ctrl = useController();
  const [handleLogin, loading] = useLoading(
    (e: any) => ctrl.fetch(UserResource.current),
    [],
  );
  return (
    <div>
      <p>Not authorized</p>
      {loading ? (
        'logging in...'
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

```tsx title="Authorized" collapsed
import { User, UserResource } from './UserResource';

export default function Authorized({ user }: { user: User }) {
  const ctrl = useController();
  const handleLogout = (e: any) => ctrl.invalidate(UserResource.current);

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

```tsx title="Entry"
import { UserResource } from './UserResource';
import Unauthed from './Unauthed';
import Authorized from './Authorized';

function AuthorizedPage() {
  // currentUser as User | undefined
  const currentUser = useCache(UserResource.current);
  // user is not logged in
  if (!currentUser) return <Unauthed />;
  // currentUser as User (typeguarded)
  return <Authorized user={currentUser} />;
}
render(<AuthorizedPage />);
```

</HooksPlayground>

See [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) for
more information about type handling

## Behavior

| Expiry Status | Returns      | Conditions                                                                                                                                                                   |
| ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | `undefined`  | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
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

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" />

### Github Navbar login/logout

Our current user only exists when we are authenticated. Thus we can `useCache(UserResource.current)`
to determine whether to show the login or logout navigation buttons.

<StackBlitz app="github-app" file="src/resources/User.ts,src/navigation/NavBar.tsx" view="editor" />

### Github Comment Authorization

Here we only show commenting form if the user is authenticated.

<StackBlitz app="github-app" file="src/resources/User.ts,src/pages/IssueDetail/CreateComment.tsx" view="editor" />
