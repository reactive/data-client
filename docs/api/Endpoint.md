---
title: Endpoint
---

### 1) Define the function

```typescript
import { Endpoint } from '@rest-hooks/endpoint';

const UserDetail = new Endpoint(({ id }) ⇒ fetch(`/users/${id}`).then(res => res.json()));
```

### 2) Reuse with different hooks

```tsx
function UserProfile() {
  const user = useResource(UserDetail, { id });
  const updateUser = useFetcher(UserDetail);

  return <UserForm user={user} onSubmit={updateUser} />
}
```

### 3) Or call directly

```typescript
const user = await UserDetail({ id: '5' });
console.log(user);
```

## Why

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

## API

`@rest-hooks/endpoint` defines a standard `interface`

```typescript
interface EndpointInterface {
    (params?: any, body?: any): Promise<any>;
    key(parmas?: any): string;
    schema?: Readonly<S>;
    sideEffects?: true;
    // other optionals like 'optimistic'
}
```

as well as a helper `class` to make construction easier.

```typescript
class Endpoint<F extends () => Promise<any>> {
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

### Members

Members double as options (second constructor arg). While none are required, the first few
have defaults.

#### key: (params) => string

Serializes the parameters. This is used to build a lookup key in global stores.

Default:

```typescript
`${this.fetch.name} ${JSON.stringify(params)}`
```

### sideEffect: true | undefined

Disallows usage in hooks like `useResource()` since they might call fetch
an unpredictable number of times. Use this for APIs with mutation side-effects like update, create, deletes.

Defaults to undefined meaning no side effects.

### schema: Schema

Declarative definition of where `Entities` appear in the fetch response.

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

#### extend(EndpointOptions): Endpoint

Can be used to further customize the endpoint definition

```typescript
const UserDetail = new Endpoint(({ id }) ⇒ fetch(`/users/${id}`));


const UserDetailNormalized = UserDetail.extend({ schema: User });
```

#### dataExpiryLength?: number

Custom data cache lifetime for the fetched resource. Will override the value set in NetworkManager.

#### errorExpiryLength?: number

Custom data error lifetime for the fetched resource. Will override the value set in NetworkManager.

#### pollFrequency: number

Frequency in millisecond to poll at. Requires using [useSubscription()](./useSubscription.md) to have
an effect.

#### invalidIfStale: boolean

Indicates stale data should be considered unusable and thus not be returned from the cache. This means
that useResource() will suspend when data is stale even if it already exists in cache.

#### optimisticUpdate: (params, body) => fakePayload

When provided, any fetches with this shape will behave as though the `fakePayload` return value
from this function was a succesful network response. When the actual fetch completes (regardless
of failure or success), the optimistic update will be replaced with the actual network response.
