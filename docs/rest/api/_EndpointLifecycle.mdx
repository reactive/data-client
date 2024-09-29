import Link from '@docusaurus/Link';
import VoteDemo from '../../core/shared/\_VoteDemo.mdx';


### dataExpiryLength?: number {#dataexpirylength}

Custom data cache lifetime for the fetched resource. Will override the value set in NetworkManager.

[Learn more about expiry time](/docs/concepts/expiry-policy#expiry-time)

### errorExpiryLength?: number {#errorexpirylength}

Custom data error lifetime for the fetched resource. Will override the value set in NetworkManager.

### errorPolicy?: (error: any) => 'soft' | undefined {#errorpolicy}

'soft' will use stale data (if exists) in case of error; undefined or not providing option will result
in error.

[Learn more about errorPolicy](/docs/concepts/error-policy)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

### invalidIfStale: boolean {#invalidifstale}

Indicates stale data should be considered unusable and thus not be returned from the cache. This means
that useSuspense() will suspend when data is stale even if it already exists in cache.

### pollFrequency: number {#pollfrequency}

Frequency in millisecond to poll at. Requires using [useSubscription()](/docs/api/useSubscription) or
[useLive()](/docs/api/useLive) to have an effect.

### getOptimisticResponse: (snap, ...args) => expectedResponse {#getoptimisticresponse}

When provided, any fetches with this endpoint will behave as though the `expectedResponse` return value
from this function was a succesful network response. When the actual fetch completes (regardless
of failure or success), the optimistic update will be replaced with the actual network response.

<VoteDemo />

<center>
<Link className="button button--secondary button--sm" to="../guides/optimistic-updates">Optimistic update guide</Link>
</center>

### update() {#update}

```ts
(normalizedResponseOfThis, ...args) =>
  ({ [endpointKey]: (normalizedResponseOfEndpointToUpdate) => updatedNormalizedResponse) })
```

:::tip

Try using [Collections](./Collection.md) instead.

They are much easier to use and more robust!

:::

```ts title="UpdateType.ts"
type UpdateFunction<
  Source extends EndpointInterface,
  Updaters extends Record<string, any> = Record<string, any>,
> = (
  source: ResultEntry<Source>,
  ...args: Parameters<Source>
) => { [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K] };
```

Simplest case:

```ts title="userEndpoint.ts"
const createUser = new RestEndpoint({
  path: '/user',
  method: 'POST',
  schema: User,
  update: (newUserId: string) => ({
    [userList.key()]: (users = []) => [newUserId, ...users],
  }),
});
```

More updates:

```typescript title="Component.tsx"
const allusers = useSuspense(userList);
const adminUsers = useSuspense(userList, { admin: true });
```

The endpoint below ensures the new user shows up immediately in the usages above.

```ts title="userEndpoint.ts"
const createUser = new RestEndpoint({
  path: '/user',
  method: 'POST',
  schema: User,
  update: (newUserId, newUser)  => {
    const updates = {
      [userList.key()]: (users = []) => [newUserId, ...users],
    ];
    if (newUser.isAdmin) {
      updates[userList.key({ admin: true })] = (users = []) => [newUserId, ...users];
    }
    return updates;
  },
});
```
