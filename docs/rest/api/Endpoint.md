---
title: Endpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Endpoint defines a standard interface that describes the nature of an networking endpoint.
It is both strongly typed, and encapsulates runtime-relevant information.

<Tabs
defaultValue="Interface"
values={[
{ label: 'Interface', value: 'Interface' },
{ label: 'Class', value: 'Class' },
{ label: 'EndpointExtraOptions', value: 'EndpointExtraOptions' },
]}>
<TabItem value="Interface">

```typescript
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
```

</TabItem>
<TabItem value="Class">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>>
  implements EndpointInterface
{
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  fetch: F;

  extend(options: EndpointOptions): Endpoint;
}

export interface EndpointOptions extends EndpointExtraOptions {
  key?: (params: any) => string;
  sideEffect?: true | undefined;
  schema?: Schema;
}
```

</TabItem>
<TabItem value="EndpointExtraOptions">

```typescript
export interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
  /** Enables optimistic updates for this request - uses return value as assumed network response
   * @deprecated use https://resthooks.io./Endpoint.md#getoptimisticresponse instead
   */
  readonly optimisticUpdate?: (...args: Parameters<F>) => ResolveType<F>;
}
```

</TabItem>
</Tabs>

Package: [@rest-hooks/endpoint](https://www.npmjs.com/package/@rest-hooks/endpoint)

## Endpoint Members

Members double as options (second constructor arg). While none are required, the first few
have defaults.

### key: (params) => string {#key}

Serializes the parameters. This is used to build a lookup key in global stores.

Default:

```typescript
`${this.fetch.name} ${JSON.stringify(params)}`;
```

### sideEffect: true | undefined {#sideeffect}

Used to indicate endpoint might have side-effects (non-idempotent). This restricts it
from being used with [useSuspense()](/docs/api/useSuspense) or [useFetch()](/docs/api/useFetch) as those can hit the
endpoint an unpredictable number of times.

### schema: Schema {#schema}

Declarative definition of how to [process responses](./schema)

- [where](./schema) to expect [Entities](./Entity.md)
- Classes to [deserialize fields](/rest/guides/network-transform#deserializing-fields)

Not providing this option means no entities will be extracted.

```tsx
import { Entity } from '@rest-hooks/normalizr';
import { Endpoint } from '@rest-hooks/endpoint';

class User extends Entity {
  readonly id: string = '';
  readonly username: string = '';

  pk() { return this.id;}
}

const UserDetail = new Endpoint(
    ({ id }) ⇒ fetch(`/users/${id}`),
    { schema: User }
);
```

### extend(EndpointOptions): Endpoint {#extend}

Can be used to further customize the endpoint definition

```typescript
const UserDetail = new Endpoint(({ id }) ⇒ fetch(`/users/${id}`));


const UserDetailNormalized = UserDetail.extend({ schema: User });
```

In addition to the members, `fetch` can be sent to override the fetch function.

### EndpointExtraOptions

#### dataExpiryLength?: number {#dataexpirylength}

Custom data cache lifetime for the fetched resource. Will override the value set in NetworkManager.

[Learn more about expiry time](/docs/getting-started/expiry-policy#expiry-time)

#### errorExpiryLength?: number {#errorexpirylength}

Custom data error lifetime for the fetched resource. Will override the value set in NetworkManager.

#### errorPolicy?: (error: any) => 'soft' | undefined {#errorpolicy}

'soft' will use stale data (if exists) in case of error; undefined or not providing option will result
in error.

[Learn more about errorPolicy](/docs/getting-started/expiry-policy#error-policy)

#### invalidIfStale: boolean {#invalidifstale}

Indicates stale data should be considered unusable and thus not be returned from the cache. This means
that useSuspense() will suspend when data is stale even if it already exists in cache.

#### pollFrequency: number {#pollfrequency}

Frequency in millisecond to poll at. Requires using [useSubscription()](/docs/api/useSubscription) to have
an effect.

#### getOptimisticResponse: (snap, ...args) => fakePayload {#getoptimisticresponse}

When provided, any fetches with this endpoint will behave as though the `fakePayload` return value
from this function was a succesful network response. When the actual fetch completes (regardless
of failure or success), the optimistic update will be replaced with the actual network response.

[Optimistic update guide](/docs/guides/optimistic-updates)

#### optimisticUpdate: (...args) => fakePayload {#optimisticupdate}

:::caution Deprecated

Use [endpoint.getOptimisticResponse](#getOptimisticResponse) instead.

:::

#### update(normalizedResponseOfThis, ...args) => ({ [endpointKey]: (normalizedResponseOfEndpointToUpdate) => updatedNormalizedResponse) }) {#update}

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
const createUser = new Endpoint(postToUserFunction, {
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
const createUser = new Endpoint(postToUserFunction, {
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

This is usage with a [Resource](/rest/api/resource)

```typescript title="TodoResource.ts"
import { Resource } from '@rest-hooks/rest';

export default class TodoResource extends Resource {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  static create<T extends typeof Resource>(this: T) {
    const todoList = this.list();
    return super.create().extend({
      schema: this,
      // highlight-start
      update: (newResourceId: string) => ({
        [todoList.key({})]: (resourceIds: string[] = []) => [
          ...resourceIds,
          newResourceId,
        ],
      }),
      // highlight-end
    });
  }
}
```

## Examples

<Tabs
defaultValue="Basic"
values={[
{ label: 'Basic', value: 'Basic' },
{ label: 'With Schema', value: 'With Schema' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Basic">

```typescript
import { Endpoint } from '@rest-hooks/endpoint';

const UserDetail = new Endpoint(
  ({ id }) ⇒ fetch(`/users/${id}`).then(res => res.json())
);
```

</TabItem>
<TabItem value="With Schema">

```typescript
import { Endpoint } from '@rest-hooks/endpoint';
import { Entity } from 'rest-hooks';

class User extends Entity {
  readonly id: string = '';
  readonly username: string = '';

  pk() { return this.id; }
}

const UserDetail = new Endpoint(
  ({ id }) ⇒ fetch(`/users/${id}`).then(res => res.json()),
  { schema: User }
);
```

</TabItem>
<TabItem value="List">

```typescript
import { Endpoint } from '@rest-hooks/endpoint';
import { Entity } from 'rest-hooks';

class User extends Entity {
  readonly id: string = '';
  readonly username: string = '';

  pk() { return this.id; }
}

const UserList = new Endpoint(
  () ⇒ fetch(`/users/`).then(res => res.json()),
  { schema: [User] }
);
```

</TabItem>
</Tabs>

<Tabs
defaultValue="React"
values={[
{ label: 'React', value: 'React' },
{ label: 'JS/Node Schema', value: 'JS/Node' },
]}>
<TabItem value="React">

```tsx
function UserProfile() {
  const user = useSuspense(UserDetail, { id });
  const { fetch } = useController();

  return <UserForm user={user} onSubmit={() => fetch(UserDetail)} />;
}
```

</TabItem>
<TabItem value="JS/Node">

```typescript
const user = await UserDetail({ id: '5' });
console.log(user);
```

</TabItem>
</Tabs>

### Additional

- [Custom endpoints](/rest/guides/extending-endpoints)
- [Pagination](/rest/guides/pagination)
- [Mocking unfinished endpoints](/rest/guides/mocking-unfinished)
- [Optimistic updates](/docs/guides/optimistic-updates)

## Motivation

There is a distinction between

- What are networking API is
  - How to make a request, expected response fields, etc.
- How it is used
  - Binding data, polling, triggering imperative fetch, etc.

Thus, there are many benefits to creating a distinct seperation of concerns between
these two concepts.

With `TypeScript Standard Endpoints`, we define a standard for declaring in
TypeScript the definition of a networking API.

- Allows API authors to publish npm packages containing their API interfaces
- Definitions can be consumed by any supporting library, allowing easy consumption across libraries like Vue, React, Angular
- Writing codegen pipelines becomes much easier as the output is minimal
- Product developers can use the definitions in a multitude of contexts where behaviors vary
- Product developers can easily share code across platforms with distinct behaviors needs like React Native and React Web

### What's in an Endpoint

- A function that resolves the results
- A function to uniquely store those results
- Optional: information about how to store the data in a normalized cache
- Optional: whether the request could have side effects - to prevent repeat calls

## See also

- [Index](./Index.md)
