---
title: Endpoint
---

Endpoint defines a standard interface that describes the nature of an networking endpoint.
It is both strongly typed, and encapsulates runtime-relevant information.

<!--DOCUSAURUS_CODE_TABS-->
<!--Interface-->

```typescript
interface EndpointInterface extends EndpointExtraOptions   {
  (params?: any, body?: any): Promise<any>;
  key(parmas?: any): string;
  schema?: Readonly<S>;
  sideEffects?: true;
  // other optionals like 'optimistic'
}
```

<!--Class-->

```typescript
class Endpoint<F extends (...args: any) => Promise<any>> implements EndpointInterface {
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

<!--EndpointExtraOptions-->

```typescript
export interface EndpointExtraOptions {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly optimisticUpdate?: (
    params: Readonly<object>,
    body: Readonly<object | string> | void,
  ) => any;
  /** User-land extra data to send */
  readonly extra?: any;
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

Package: [@rest-hooks/endpoint](https://www.npmjs.com/package/@rest-hooks/endpoint)

## Endpoint Members

Members double as options (second constructor arg). While none are required, the first few
have defaults.

### key: (params) => string

Serializes the parameters. This is used to build a lookup key in global stores.

Default:

```typescript
`${this.fetch.name} ${JSON.stringify(params)}`;
```

### sideEffect: true | undefined

Used to indicate endpoint might have side-effects (non-idempotent). This restricts it
from being used with [useResource()](./useresource) or [useRetrieve()](useRetrieve) as those can hit the
endpoint an unpredictable number of times.

### schema: Schema

Declarative definition of how to [process responses](./schema)

- [where](./schema) to expect [Entities](./Entity)
- Classes to [deserialize fields](../guides/network-transform#deserializing-fields)

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

### extend(EndpointOptions): Endpoint

Can be used to further customize the endpoint definition

```typescript
const UserDetail = new Endpoint(({ id }) ⇒ fetch(`/users/${id}`));


const UserDetailNormalized = UserDetail.extend({ schema: User });
```

In addition to the members, `fetch` can be sent to override the fetch function.

### EndpointExtraOptions

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

When provided, any fetches with this endpoint will behave as though the `fakePayload` return value
from this function was a succesful network response. When the actual fetch completes (regardless
of failure or success), the optimistic update will be replaced with the actual network response.

## Examples

<!--DOCUSAURUS_CODE_TABS-->
<!--Basic-->

```typescript
import { Endpoint } from '@rest-hooks/endpoint';

const UserDetail = new Endpoint(
  ({ id }) ⇒ fetch(`/users/${id}`).then(res => res.json())
);
```

<!--With Schema-->

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

<!--List-->
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
<!--END_DOCUSAURUS_CODE_TABS-->

<!--DOCUSAURUS_CODE_TABS-->
<!--React-->


```tsx
function UserProfile() {
  const user = useResource(UserDetail, { id });
  const updateUser = useFetcher(UserDetail);

  return <UserForm user={user} onSubmit={updateUser} />;
}
```

<!--JS/Node-->

```typescript
const user = await UserDetail({ id: '5' });
console.log(user);
```
<!--END_DOCUSAURUS_CODE_TABS-->

### Additional

- [Custom endpoints](../guides/extending-endpoints)
- [Pagination](../guides/pagination)
- [Mocking unfinished endpoints](../guides/mocking-unfinished)
- [Optimistic updates](../guides/optimistic-updates)


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
