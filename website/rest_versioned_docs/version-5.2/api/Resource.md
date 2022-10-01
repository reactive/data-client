---
id: resource
title: Resource
---

import LanguageTabs from '@site/src/components/LanguageTabs';

`Resource` is an [Entity](./Entity.md) with multiple [Endpoint](./Endpoint.md)s that operate on the data. All additional members are provided to make CRUD or other REST-like API definitions easy and terse.

For other patterns, feel free to use [Endpoint](./Endpoint.md)s on their own or in any other way you see fit.

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

:::info extends

`Resource` extends [BaseResource](./BaseResource.md)

:::

Package: [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)


There are two sides to `Resource` definition - the static and instance side.

### Static

Is used to define how you retrieve and mutate data across the network. There are several
static methods that do this, but their ultimate purpose is to build [Endpoint](./Endpoint.md)s, which
tell the [hooks](/docs/api/useSuspense) how to process requests. Endpoints are provided for the
common `REST` request types. However, it is encouraged to build your own or override the
provided ones to fit the needs of your API.

Resource extends from [BaseResource](./BaseResource.md) which extends from [Entity](./Entity.md), which includes many static methods defining how to process
network data to ensure performance and consistency. [Deserilization](../guides/network-transform#deserializing-fields)
for instance can be done using the [static schema](./Entity.md#schema).

### Instance

Instances are mostly for you to define how you want to interact with your data. This means
you should start off by defining the fields you expect to see, and provide defaults in case
they are not sent for some reason. `Resource` also requires that you define a method to
get an entity's (entity is an instance of a Resource) unique identifier. (This is used for
book-keeping the normalized cache.) Make sure to mark all members as readonly as all the data members
are immutable (this library enforces that)!

You are encouraged to add your own member methods. Often times it is useful to provide
methods for computed values that are commonly used in your React components.

A final note: `Resource` provides a factory method called `fromJS()` that will be used
to construct instances. This is the only supported way of created `Resource`s so please
don't use constructors.

## Factory method

### fromJS(props): Resource {#fromJS}

> Inherited from [Entity](./Entity.md)

```ts
static fromJS<T extends typeof SimpleRecord>(this: T, props: Partial<AbstractInstanceType<T>>): AbstractInstanceType<T>
```

Factory method called during denormalization. Use this instead of `new MyEntity()`

## Be sure to always provide:

### pk: (parent, key) => string {#pk}

> Inherited from [Entity](./Entity.md#pk)

PK stands for _primary key_ and is intended to provide a standard means of retrieving
a key identifier for any `Resource`. In many cases there will simply be an 'id' field
member to return. In case of multicolumn you can simply join them together.

#### Multi-column primary key:

Sometimes you have a resource that doesn't have its own primary key. This is typically found in `join tables` that express `many-to-many` relationships.

```typescript
export class VoteResource extends Resource {
  readonly userId: number | undefined = undefined;
  readonly postId: number | undefined = undefined;
  readonly createdAt: string = '1900-01-01T01:01:01Z';

  pk() {
    return [this.userId, this.postId].join(',');
  }
  static urlRoot = 'https://example.com/votes/';
}
```

#### undefined value

A `undefined` can be used as a default to indicate the resource has not been created yet.
This is useful when initializing a creation form using [Resource.fromJS()](#fromJS)
directly. If `pk()` resolves to null it is considered not persisted to the server,
and thus will not be kept in the cache.

#### Other uses

While the `pk()` definition is key (pun intended) for making the normalized cache work;
it also becomes quite convenient for sending to a react element when iterating on
list results:

```tsx
//....
return (
  <div>
    {results.map(result => (
      <TheThing key={result.pk()} thing={result} />
    ))}
  </div>
);
```

#### Singleton Resources

What if there is only ever once instance of a Resource for your entire application? You
don't really need to distinguish between each instance, so likely there was no `id` or
similar field defined in the API. In these cases you can just return a literal like
'the_only_one'.

```typescript
pk() {
  return 'the_only_one';
}
```

### static urlRoot: string {#urlRoot}

Used to build url patterns in `url()` and `listUrl()`. Used as the default in
[key](#key) so typically you'll want this to be globally unique per Resource.

### static get key(): string {#key}

> Inherited from [Entity](./Entity.md#key)

This defines the key for the Resource itself, rather than an instance. As seen below, by default it
simply returns the urlRoot since this is typically globally unique. However if you want to share
urlRoot across different Resources, be sure to override this.

```typescript
/** Returns the globally unique identifier for this Resource */
static get key(): string {
  return this.urlRoot;
}
```

## Static network methods and properties

These are the basic building blocks used to compile the [Endpoint](./Endpoint.md) below.

### static url(urlParams) => string {#url}

> Inherited from [BaseResource](./BaseResource.md)

```ts
static url<T extends typeof Resource>(urlParams: Partial<AbstractInstanceType<T>>) => string
```

Computes the url based on the parameters. Default implementation follows `/urlRoot/[pk]` pattern.

Used in [detail()](#detail), [update()](#update),
[partialUpdate()](#partialUpdate), and [delete()](#delete)

### static listUrl(searchParams) => string {#listUrl}

> Inherited from [BaseResource](./BaseResource.md)

```ts
static listUrl(searchParams: Readonly<Record<string, string>>) => string
```

Computes url for retrieving list items. Defaults to urlRoot with `searchParams` being sent as GET
parameters.

Used in [list()](#list) and [create()](#create)

### static fetch(requestInfo, requestInit) => Promise {#fetch}

> Inherited from [BaseResource](./BaseResource.md)

```ts
static fetch(info: RequestInfo, init: RequestInit) => Promise<any>
```

Performs the actual network fetch returning a promise that resolves to the network response or rejects
on network error. This can be useful to override to really customize your transport.

### static fetchResponse(requestInfo, requestInit) => Promise {#fetchResponse}

> Inherited from [BaseResource](./BaseResource.md)

```ts
static fetchResponse(info: RequestInfo, init: RequestInit) => Promise<any>
```

Used in `fetch()`. Resolves the HTTP [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response).

### static getFetchInit(init: RequestInit): RequestInit {#getFetchInit}

> Inherited from [BaseResource](./BaseResource.md)

Allows simple overrides to extend [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) sent to fetch.
This is called during the fetch callback. Don't use hooks here.

This is often useful for [authentication](../guides/auth)

### static getEndpointExtra() => EndpointExtraOptions | undefined {#getEndpointExtra}

> Inherited from [BaseResource](./BaseResource.md)

[Returns](./Endpoint.md#dataexpirylength) the default request options for this resource. By default this returns undefined

## Endpoints

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoints](./Endpoint.md)s common in [REST](https://www.restapitutorial.com/) APIs. Feel free to customize or add
new endpoints based to match your API.

### detail(): Endpoint {#detail}

A GET request using standard `url()` that receives a detail body.
Mostly useful with [useSuspense](/docs/api/useSuspense)

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
Mostly useful with [useSuspense](/docs/api/useSuspense)

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
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [listUrl()](#listUrl)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

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
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [url()](#url)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

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
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [url()](#url)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

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
Mostly useful with [Controller.fetch](/docs/api/Controller#fetch)

Uses [url()](#url)

Not compatible with:

- [useSuspense()](/docs/api/useSuspense)
- [useFetch()](/docs/api/useFetch)

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
