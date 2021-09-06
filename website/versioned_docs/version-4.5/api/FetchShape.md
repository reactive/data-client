---
title: FetchShape
id: FetchShape
original_id: FetchShape
---

`FetchShape` is the most basic interface sent to hooks telling rest-hooks how to
handle the request. Several methods of `Resource` return `FetchShapes`, which offers a bridge between
both APIs. In fact, using `Resource` is not even needed to work with `CacheProvider` and
simply operates as a convenience to organize schemas.

Because of the different capabilities of each shape, some shapes won't be usable with
certain hooks and their interaction is not well defined. For instance, `useCache()`
only works with `ReadShape`s because this is the only shape that specifies the
specific results needed.

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
interface FetchShape {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(params: Readonly<object>, body: Readonly<object> | void): Promise<any>;
  getFetchKey(params: Readonly<object>): string;
  readonly schema: Schema;
  readonly options?: FetchOptions;
}
```

<!--With Generics-->

```typescript
interface FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(params: Params, body: Body): Promise<any>;
  getFetchKey(params: Params): string;
  readonly schema: S;
  readonly options?: FetchOptions;
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

## type: 'read' | 'mutate' | 'delete'

Defines the type of the shape, informing how it should be used.

### 'read'

This uses the response body to update which results are returned by a particular url.

### 'mutate'

Mutate will look at the response for updated entities to update the normalized
cache from. This is useful to ensure that whatever entities are changed by the
mutation update properly in the cache without having to do another request.

### 'delete'

It sends a request and represents a success response to mean that entity is deleted.
Upon success it will purge that entity from the cache.

## fetch(params: Param, body: Payload): Promise\<any\>

Handles performing an actual network request. This usually just proxies to the `Resource`
fetch method with a defined `method`.

## getFetchKey(params: Param): string

Serializes the params into a globally unique key. This is used to index into the `request`
table in the normalized cache.

## schema: Schema

Schemas define the shape of the response data and are used to parse and update
the normalized cache. Read more about [schemas at the normalizr documentation](https://github.com/ntucker/normalizr/blob/master/docs/api.md#schema).

## options?: FetchOptions

### FetchOptions

Additional optional request options passed on to network manager and reducer.

```typescript
export interface FetchOptions {
  readonly dataExpiryLength?: number;
  readonly errorExpiryLength?: number;
  readonly pollFrequency?: number;
  readonly invalidIfStale?: boolean;
  readonly optimisticUpdate?: (
    params: Readonly<object>,
    body: Readonly<object | string> | void,
  ) => any;
}
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

## Examples

- [Custom endpoints](../guides/endpoints)
- [Pagination](../guides/pagination)
- [Mocking unfinished endpoints](../guides/mocking-unfinished)
- [Optimistic updates](../guides/optimistic-updates)
