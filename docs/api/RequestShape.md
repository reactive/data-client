# RequestShape

`RequestShape` is the most basic interface sent to hooks telling rest-hooks how to
handle the request. Several methods of `Resource` return `RequestShapes`, which offers a bridge between
both APIs. In fact, using `Resource` is not even needed to work with `RestProvider` and
simply operates as a convenience to organize schemas.

Because of the different capabilities of each shape, some shapes won't be usable with
certain hooks and their interaction is not well defined. For instance, `useCache()`
only works with `ReadShape`s because this is the only shape that specifies the
specific results needed.

```typescript
export type RequestShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> =
  | ReadShape<Params, Body, S>
  | MutateShape<Params, Body, S>
  | DeleteShape<Params, Body>;
```

## DeleteShape

```typescript
/** Purges a value from the server */
export interface DeleteShape<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void
> {
  getUrl(params: Params): string;
  fetch(url: string, body: Body): Promise<any>;
}
```

Delete shape is the simplest shape. It sends a request and represents a success
response to mean that entity is deleted.

### fetch(url: string, body: Payload): Promise\<any>

Handles performing an actual network request. This usually just proxies to the `Resource`
fetch method with a defined `method`.

### getUrl(params: Param): string

Turns the provided object params into a url to fetch.

## MutateShape

```typescript
/** To change values on the server */
export interface MutateShape<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
> extends DeleteShape<Params, Body> {
  readonly schema: S;
}
```

Mutate will look at the response for updated entities to update the normalized
cache from. This is useful to ensure that whatever entities are changed by the
mutation update properly in the cache without having to do another request.

### schema: Schema

Schemas define the shape of the response data and are used to parse and update
the normalized cache. Read more about [schemas at the normalizr documentation](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#schema).

## ReadShape

```typescript
/** For retrieval requests */
export interface ReadShape<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
> extends MutateShape<Params, Body, S> {
  select(state: State<any>, params: Params): SchemaOf<S> | null;
}
```

By providing a select function, `ReadShape` is able to be used with `useCache()`
and thus also `useResource()` (that uses useCache() under the hood) to inspect
particular results from the url.

This also has the effect of using the response body to update which results
are returned by a particular url.

The provided `listRequest()` and `singleRequest()` Resource methods that return
`ReadShape`s use [makeSchemaSelector](./makeSchemaSelector.md) to build a selector from the schema
and getUrl function already provided. This is highly recommended for custom
`ReadShape`s you might want to build. You'll also need to use this when customizing
schema for any `ReadShape`. See [pagination](../guides/pagination.md) for a common example.

## Example

This is the code for the default listRequest() implementation. Note the explicit return type of
`ReadShape`. This is important to ensure the type is wide enough that it can be overridden
in descendants.

```typescript
  /** Shape to get a list of entities */
  static listRequest<T extends typeof Resource>(this: T): ReadShape<Readonly<object>, Readonly<object>, SchemaArray<AbstractInstanceType<T>>> {
    const self = this;
    const getUrl = (params: Readonly<object>) => {
      return this.listUrl(params);
    };
    const schema: SchemaArray<AbstractInstanceType<T>> = [this.getEntitySchema()];
    return {
      select: makeSchemaSelector({ getUrl, schema }),
      schema,
      getUrl,
      fetch(url: string, body?: Readonly<object>) {
        return self.fetch('get', url, body);
      },
    };
  }
```
