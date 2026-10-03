---
title: useCache() - Normalized data store access in React
vue_title: useCache() - Normalized data store access in Vue
sidebar_label: useCache()
description: Data rendering without the fetch. Access any Endpoint's response.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';

# useCache()

Data rendering without the fetch.

Access any [Endpoint](/rest/api/Endpoint)'s response. If the response does not exist, returns
`undefined`. This can be used to check for an `Endpoint's` existance like for authentication.

`useCache()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary.

## Usage

<FrameworkPlayground fixtures={[
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

:::react

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

:::

:::vue

```html title="Unauthed.vue" collapsed
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import { UserResource } from './UserResource';

  const ctrl = useController();
  const [handleLogin, loading] = useLoading(() =>
    ctrl.fetch(UserResource.current),
  );
</script>

<template>
  <div>
    <p>Not authorized</p>
    <template v-if="loading">logging in...</template>
    <button v-else @click="handleLogin">Login</button>
  </div>
</template>
```

```html title="Authorized.vue" collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { UserResource, type User } from './UserResource';

  defineProps<{ user: User }>();
  const ctrl = useController();
  const handleLogout = () => ctrl.invalidate(UserResource.current);
</script>

<template>
  <div>
    <p>Welcome, {{ user.name }}!</p>
    <button @click="handleLogout">Logout</button>
  </div>
</template>
```

```html title="AuthorizedPage.vue"
<script setup lang="ts">
  import { useCache } from '@data-client/vue';
  import { UserResource } from './UserResource';
  import Unauthed from './Unauthed.vue';
  import Authorized from './Authorized.vue';

  // currentUser as ComputedRef<User | undefined>
  const currentUser = useCache(UserResource.current);
</script>

<template>
  <!-- currentUser is unwrapped in the template -->
  <Authorized v-if="currentUser" :user="currentUser" />
  <!-- user is not logged in -->
  <Unauthed v-else />
</template>
```

:::

</FrameworkPlayground>

See [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) for
more information about type handling

## Behavior

:::vue

`useCache()` returns a [ComputedRef](https://vuejs.org/api/reactivity-core.html#computed). The table
below describes its `.value`.

:::

| Expiry Status | Returns      | Conditions                                                                                                                                                             |
| ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | `undefined`  | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | denormalized | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                                                           |
| Valid         | denormalized | fetch completion                                                                                                                                                       |
|               | `undefined`  | `null` used as second argument                                                                                                                                         |

<ConditionalDependencies hook="useCache" />

## Types

:::react

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

:::

:::vue

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint.key>> | [null]
): ComputedRef<DenormalizeNullable<typeof endpoint.schema>>;
```

Arguments can be plain values or [refs](https://vuejs.org/api/reactivity-core.html#ref) (including
[computed](https://vuejs.org/api/reactivity-core.html#computed)); the result updates when they change.

:::

:::react

## Examples

### Github Navbar login/logout

Our current user only exists when we are authenticated. Thus we can `useCache(UserResource.current)`
to determine whether to show the login or logout navigation buttons.

<StackBlitz app="github-app" file="src/resources/User.ts,src/navigation/NavBar.tsx" view="editor" />

### Github Comment Authorization

Here we only show commenting form if the user is authenticated.

<StackBlitz app="github-app" file="src/resources/User.ts,src/pages/IssueDetail/CreateComment.tsx" view="editor" />

:::
