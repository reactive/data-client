---
title: GQLEndpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info extends

`GQLEndpoint` extends [Endpoint](./Endpoint.md)

:::

## Fetch Lifecycle

GQLEndpoint adds to Endpoint by providing customizations for a provided fetch method.

1. _Prepare fetch_
   1. url
   1. [getRequestInit()](#getRequestInit)
      - [getQuery()](#getQuery)
      - [getHeaders()](#getHeaders)
1. _Perform fetch_
   1. [fetchResponse()](#fetchResponse)
   1. [parseResponse()](#parseResponse)
   1. [process()](#process)

```ts title="fetch implementation for GQLEndpoint"
async function fetch(variables) {
  return this.fetchResponse(this.url, this.getRequestInit(variables)).then(
    res => this.process(res, variables),
  );
}
```

## Prepare Fetch

Members double as options (second constructor arg). While none are required, the first few
have defaults.

### url: string {#path}

GraphQL uses one url for all operations.


### getRequestInit(body): RequestInit {#getRequestInit}

Prepares [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) used in fetch.
This is sent to [fetchResponse](#fetchResponse)

### getQuery(variables): string {#getQuery}

Prepare the query, to be sent as part of the body payload.

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

Called by [getRequestInit](#getRequestInit) to determine [HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

This is often useful for [authentication](../auth)

:::caution

Don't use hooks here.

:::

## Handle fetch

### fetchResponse(input, init): Promise {#fetchResponse}

Performs the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) call

### parseResponse(response): Promise {#parseResponse}

Takes the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) and parses via .text() or .json()

### process(value, ...args): any {#process}

Perform any transforms with the parsed result. Defaults to identity function.

## Endpoint Life-Cycles

### schema: Schema {#schema}

Declarative definition of how to [process responses](./schema)

- [where](./schema) to expect [Entities](./Entity.md)
- Classes to deserialize fields

Not providing this option means no entities will be extracted.

```tsx
import { GQLEntity, GQLEndpoint } from '@rest-hooks/graphql';
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

class User extends GQLEntity {
  username = '';
}

export const getUser = gql.query(
  (v: { name: string }) => `query GetUser($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);
```

### dataExpiryLength?: number {#dataexpirylength}

Custom data cache lifetime for the fetched resource. Will override the value set in NetworkManager.

[Learn more about expiry time](/docs/getting-started/expiry-policy#expiry-time)

### errorExpiryLength?: number {#errorexpirylength}

Custom data error lifetime for the fetched resource. Will override the value set in NetworkManager.

### errorPolicy?: (error: any) => 'soft' | undefined {#errorpolicy}

'soft' will use stale data (if exists) in case of error; undefined or not providing option will result
in error.

[Learn more about errorPolicy](/docs/getting-started/expiry-policy#error-policy)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

### invalidIfStale: boolean {#invalidifstale}

Indicates stale data should be considered unusable and thus not be returned from the cache. This means
that useSuspense() will suspend when data is stale even if it already exists in cache.

### pollFrequency: number {#pollfrequency}

Frequency in millisecond to poll at. Requires using [useSubscription()](/docs/api/useSubscription) to have
an effect.

### getOptimisticResponse: (snap, ...args) => fakePayload {#getoptimisticresponse}

When provided, any fetches with this endpoint will behave as though the `fakePayload` return value
from this function was a succesful network response. When the actual fetch completes (regardless
of failure or success), the optimistic update will be replaced with the actual network response.

### update(normalizedResponseOfThis, ...args) => ({ [endpointKey]: (normalizedResponseOfEndpointToUpdate) => updatedNormalizedResponse) }) {#update}

```ts title="UpdateType.ts"
type UpdateFunction<
  Source extends EndpointInterface,
  Updaters extends Record<string, any> = Record<string, any>,
> = (
  source: ResultEntry<Source>,
  ...args: Parameters<Source>
) => { [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K] };
```

## extend(options): Endpoint {#extend}

Can be used to further customize the endpoint definition

```typescript
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

const authGQL = gql.extend({
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  },
});
```
