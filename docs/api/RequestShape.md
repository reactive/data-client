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
export interface RequestShape<
S extends Schema,
Params extends Readonly<object>,
Body extends Readonly<object> | void,
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(url: string, body: Body): Promise<any>;
  getUrl(params: Params): string;
  readonly schema: S;
  readonly options?: RequestOptions;
}
```

### type: 'read' | 'mutate' | 'delete'

Defines the type of the shape, informing how it should be used.

#### 'read'

This uses the response body to update which results are returned by a particular url.

#### 'mutate'

Mutate will look at the response for updated entities to update the normalized
cache from. This is useful to ensure that whatever entities are changed by the
mutation update properly in the cache without having to do another request.

#### 'delete'

It sends a request and represents a success response to mean that entity is deleted.
Upon success it will purge that entity from the cache.

### fetch(url: string, body: Payload): Promise\<any>

Handles performing an actual network request. This usually just proxies to the `Resource`
fetch method with a defined `method`.

### getUrl(params: Param): string

Turns the provided object params into a url to fetch.

### schema: Schema

Schemas define the shape of the response data and are used to parse and update
the normalized cache. Read more about [schemas at the normalizr documentation](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#schema).

### options?: RequestOptions


# RequestOptions

Additional optional request options passed on to network manager and reducer.

```typescript
export interface RequestOptions {
  readonly dataExpiryLength?: number;
  readonly errorExpiryLength?: number;
  readonly pollFrequency?: number;
}
```

### dataExpiryLength?: number

Custom data cache lifetime for the fetched resource. Will override the value set in NetworkManager.

### errorExpiryLength?: number

Custom data error lifetime for the fetched resource. Will override the value set in NetworkManager.

### pollFrequency: number

Frequency in millisecond to poll at. Requires using [useSubscription()](./useSubscription.md) to have
an effect.
