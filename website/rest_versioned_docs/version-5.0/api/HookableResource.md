---
title: HookableResource
---

import LanguageTabs from '@site/src/components/LanguageTabs';

`HookableResource` is just like [Resource](./Resource.md) but its endpoints are hooks.

<LanguageTabs>

```typescript
import { HookableResource } from '@rest-hooks/rest';

export default class ArticleResource extends HookableResource {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/article/';
}
```

```js
import { HookableResource } from '@rest-hooks/rest';

export default class ArticleResource extends HookableResource {
  id = undefined;
  title = '';
  content = '';
  author = null;
  tags = [];

  pk() {
    return this.id;
  }

  static urlRoot = 'http://test.com/article/';
}
```

</LanguageTabs>

:::info extends

`Resource` extends [BaseResource](./BaseResource.md)

:::

:::tip

See [Resource](./Resource.md) for more information

:::

## Static network methods and properties

These are the basic building blocks used to compile the [Endpoint](./Endpoint.md) below.

### static useFetchInit(init: RequestInit): RequestInit {#useFetchInit}

Allows simple overrides to extend [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) sent to fetch.
This is called in endpoint methods ([list()](#list), [detail()](#detail)), which allows for hooks that
use React context.

This is often useful for [authentication](../guides/auth)

## Endpoints

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoints](./Endpoint.md)s common in [REST](https://www.restapitutorial.com/) APIs. Feel free to customize or add
new endpoints based to match your API.

### useDetail(): Endpoint {#detail}

A GET request using standard `url()` that receives a detail body.
Mostly useful with [useSuspense](/docs/api/useSuspense)

- Uses [url()](./BaseResource.md#url)
- Compatible with all hooks

#### Implementation:

```typescript
static useDetail<T extends typeof SimpleResource>(this: T) {
  return this.memo('#detail', () =>
    this.endpoint().extend({
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    }),
  );
}
```

### useList(): Endpoint {#list}

A GET request using `listUrl()` that receives a list of entities.
Mostly useful with [useSuspense](/docs/api/useSuspense)

- Uses [listUrl()](./BaseResource.md#listUrl)
- Compatible with all hooks

#### Implementation:

```typescript
static useList<T extends typeof SimpleResource>(this: T) {
  return this.memo('#list', () =>
    this.endpoint().extend({
      schema: [this] as SchemaList<Readonly<AbstractInstanceType<T>>>,
      url: this.listUrl.bind(this),
    }),
  );
}
```

### useCreate(): Endpoint {#create}

A POST request sending a payload to `listUrl()` with empty params, and expecting a detail body response.
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [listUrl()](./BaseResource.md#listUrl)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

#### Implementation:

```typescript
static useCreate<T extends typeof SimpleResource>(this: T) {
  return this.memo('#create', () =>
    this.endpointMutate().extend({
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
      url: this.listUrl.bind(this),
    }),
  );
}
```

### useUpdate(): Endpoint {#update}

A PUT request sending a payload to a `url()` expecting a detail body response.
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [url()](./BaseResource.md#url)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

#### Implementation:

```typescript
static useUpdate<T extends typeof SimpleResource>(this: T) {
  return this.memo('#update', () =>
    this.endpointMutate().extend({
      method: 'PUT',
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    }),
  );
}
```

### usePartialUpdate(): Endpoint {#partialUpdate}

A PATCH request sending a partial payload to `url()` expecting a detail body response.
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [url()](./BaseResource.md#url)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

#### Implementation:

```typescript
static usePartialUpdate<T extends typeof SimpleResource>(this: T) {
  return this.memo('#partialUpdate', () =>
    this.endpointMutate().extend({
      method: 'PATCH',
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    }),
  );
}
```

### useDelete(): Endpoint {#delete}

A DELETE request sent to `url()`
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [url()](./BaseResource.md#url)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

#### Implementation:

```typescript
static useDelete<T extends typeof SimpleResource>(this: T) {
  const endpoint = this.endpointMutate();
  return this.memo('#delete', () =>
    endpoint.extend({
      fetch(params: Readonly<object>) {
        return endpoint.fetch.call(this, params).then(() => params);
      },
      method: 'DELETE',
      schema: new schema.Delete(this),
    }),
  );
}
```
