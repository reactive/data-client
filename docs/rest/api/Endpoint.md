---
title: Endpoint - Strongly typed API definitions
sidebar_label: Endpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import HooksPlayground from '@site/src/components/HooksPlayground';

# Endpoint

`Endpoint` are for any asynchronous function (one that returns a Promise).

`Endpoints` define a strongly typed standard interface of relevant metadata and lifecycles
useful for Reactive Data Client and other stores.

Package: [@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint)

:::tip

Endpoint is a protocol independent class. Try using the protocol specific patterns
[REST](./RestEndpoint.md), [GraphQL](/graphql/api/GQLEndpoint),
or [getImage](/docs/guides/img-media#just-images) instead.

:::

<details>
<summary><b>Interface</b></summary>

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
}
```

</TabItem>
</Tabs>

</details>

## Usage

`Endpoint` makes existing async functions usable in any Reactive Data Client context with full TypeScript enforcement.

<HooksPlayground defaultOpen="n">

```ts title="interface" collapsed
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
```

```ts title="api" {11}
import { Todo } from './interface';

const getTodoOriginal = (id: number): Promise<Todo> =>
  Promise.resolve({
    id,
    title: 'delectus aut autem ' + id,
    completed: false,
    userId: 1,
  });

export const getTodo = new Endpoint(getTodoOriginal);
```

```tsx title="React"
import { getTodo } from './api';

function TodoDetail() {
  const todo = useSuspense(getTodo, 1);
  return <div>{todo.title}</div>;
}
render(<TodoDetail />);
```

</HooksPlayground>

### Configuration sharing

Use [Endpoint.extend()](#extend) instead of `{...getTodo}` (spread)

```ts
const getTodoNormalized = getTodo.extend({ schema: Todo });
const getTodoUpdatingEveryFiveSeconds = getTodo.extend({ pollFrequency: 5000 });
```

## Lifecycle

### Success

import SuccessLifecycle from '../diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### Error

import ErrorLifecycle from '../diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## Endpoint Members

Members double as options (second constructor arg). While none are required, the first few
have defaults.

### key: (params) => string {#key}

Serializes the parameters. This is used to build a lookup key in global stores.

Default:

```typescript
`${this.name} ${JSON.stringify(params)}`;
```

:::warning Overrides

When overriding `key`, be sure to also include an updated [testKey](#testKey) if
you intend on using that method.

:::

### testKey(key): boolean {#testKey}

Returns `true` if the provided (fetch) [key](#key) matches this endpoint.

This is used for mock interceptors with with [&lt;MockResolver /&gt;](/docs/api/MockResolver)

### name: string {#name}

Used in [key](#key) to distinguish endpoints. Should be globally unique.

Defaults to `this.fetch.name`

:::warning

This may break in production builds that change function names.
This is often know as [function name mangling](https://terser.org/docs/api-reference#mangle-options).

In these cases you can override `name` or disable function mangling.

:::

### sideEffect: boolean {#sideeffect}

Used to indicate endpoint might have side-effects (non-idempotent). This restricts it
from being used with [useSuspense()](/docs/api/useSuspense) or [useFetch()](/docs/api/useFetch) as those can hit the
endpoint an unpredictable number of times.

### schema: Schema {#schema}

Declarative definition of how to [process responses](./schema)

- [where](./schema) to expect [Entities](./Entity.md)
- Functions to [deserialize fields](/rest/guides/network-transform#deserializing-fields)

Not providing this option means no entities will be extracted.

```tsx
import { Entity } from '@data-client/normalizr';
import { Endpoint } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new Endpoint(
    ({ id }) ⇒ fetch(`/users/${id}`),
    { schema: User }
);
```

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

### extend(options): Endpoint {#extend}

Can be used to further customize the endpoint definition

```typescript
const getUser = new Endpoint(({ id }) ⇒ fetch(`/users/${id}`));


const getUserNormalized = getUser.extend({ schema: User });
```

In addition to the members, `fetch` can be sent to override the fetch function.

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
import { Endpoint } from '@data-client/endpoint';

const UserDetail = new Endpoint(
  ({ id }) ⇒ fetch(`/users/${id}`).then(res => res.json())
);
```

</TabItem>
<TabItem value="With Schema">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserDetail = new Endpoint(
  ({ id }) ⇒ fetch(`/users/${id}`).then(res => res.json()),
  { schema: User }
);
```

</TabItem>
<TabItem value="List">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
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
  const ctrl = useController();

  return <UserForm user={user} onSubmit={() => ctrl.fetch(UserDetail)} />;
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

- [Pagination](../guides/pagination.md)
- [Mocking unfinished endpoints](../guides/mocking-unfinished.md)
- [Optimistic updates](../guides/optimistic-updates.md)

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
