---
id: resource
title: Resource
---

import LanguageTabs from '@site/src/components/LanguageTabs';

`Resource` is an [Entity](./Entity) with multiple [Endpoint](./Endpoint)s that operate on the data. All additional members are provided to make CRUD or other REST-like API definitions easy and terse.

For other patterns, feel free to use [Endpoint](./Endpoint)s on their own or in any other way you see fit.

<LanguageTabs>

```typescript
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
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
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
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

`Resource` extends [BaseResource](./BaseResource.md)

Package: [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)

There are two sides to `Resource` definition - the static and instance side.

## Endpoints

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoints](../api/Endpoint)s common in [REST](https://www.restapitutorial.com/) APIs. Feel free to customize or add
new endpoints based to match your API.

### detail(): Endpoint {#detail}

A GET request using standard `url()` that receives a detail body.
Mostly useful with [useSuspense](../api/useSuspense)

- Uses [url()](#url)
- Compatible with all hooks

#### Implementation:

```typescript
static detail<T extends typeof SimpleResource>(this: T) {
  return this.memo('#detail', () =>
    this.endpoint().extend({
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    }),
  );
}
```

### list(): Endpoint {#list}

A GET request using `listUrl()` that receives a list of entities.
Mostly useful with [useSuspense](../api/useSuspense)

- Uses [listUrl()](#listUrl)
- Compatible with all hooks

#### Implementation:

```typescript
static list<T extends typeof SimpleResource>(this: T) {
  return this.memo('#list', () =>
    this.endpoint().extend({
      schema: [this] as SchemaList<Readonly<AbstractInstanceType<T>>>,
      url: this.listUrl.bind(this),
    }),
  );
}
```

### create(): Endpoint {#create}

A POST request sending a payload to `listUrl()` with empty params, and expecting a detail body response.
Mostly useful with [Controller.fetch](../api/Controller.md#fetch)

Uses [listUrl()](#listUrl)

Not compatible with:

- [useSuspense()](../api/useSuspense)
- [useFetch()](../api/useFetch.md)

#### Implementation:

```typescript
static create<T extends typeof SimpleResource>(this: T) {
  return this.memo('#create', () =>
    this.endpointMutate().extend({
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
      url: this.listUrl.bind(this),
    }),
  );
}
```

### update(): Endpoint {#update}

A PUT request sending a payload to a `url()` expecting a detail body response.
Mostly useful with [Controller.fetch](../api/Controller.md#fetch)

Uses [url()](#url)

Not compatible with:

- [useSuspense()](../api/useSuspense)
- [useFetch()](../api/useFetch.md)

#### Implementation:

```typescript
static update<T extends typeof SimpleResource>(this: T) {
  return this.memo('#update', () =>
    this.endpointMutate().extend({
      method: 'PUT',
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    }),
  );
}
```

### partialUpdate(): Endpoint {#partialUpdate}

A PATCH request sending a partial payload to `url()` expecting a detail body response.
Mostly useful with [Controller.fetch](../api/Controller.md#fetch)

Uses [url()](#url)

Not compatible with:

- [useSuspense()](../api/useSuspense)
- [useFetch()](../api/useFetch.md)

#### Implementation:

```typescript
static partialUpdate<T extends typeof SimpleResource>(this: T) {
  return this.memo('#partialUpdate', () =>
    this.endpointMutate().extend({
      method: 'PATCH',
      schema: this as SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    }),
  );
}
```

### delete(): Endpoint {#delete}

A DELETE request sent to `url()`
Mostly useful with [Controller.fetch](../api/Controller.md#fetch)

Uses [url()](#url)

Not compatible with:

- [useSuspense()](../api/useSuspense)
- [useFetch()](../api/useFetch.md)

#### Implementation:

```typescript
static delete<T extends typeof SimpleResource>(this: T) {
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
