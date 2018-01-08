# RequestShape

`RequestShape` defines the attributes of a request needed for the `RestProvider` to handle
it. Several methods of `Resource` return `RequestShapes`, which offers a bridge between
both APIs. In fact, using `Resource` is not even needed to work with `RestProvider` and
simply operates as a convenience to organize schemas.

```typescript
export interface RequestShape<
  Param extends object,
  Payload extends object | void
> {
  select(state: State<Resource>, params: Param): any;
  readonly schema: Schema;
  fetch(url: string, body: Payload): Promise<any>;
  getUrl(params: Param): string;
  readonly mutate: boolean;
}
```

`Resource` comes with all the basic `REST` request types as [methods](./Resource.md#request-shapes) that return
`RequestShape`.

In turn, each hook will be expecting to receive a `RequestShape` to define its
operation.

You are encouraged to override or add new methods to your `Resources` to adapt
your APIs unique needs. Common customizations include [pagination](../guides/pagination.md), as well
as custom [RPC endpoints](../guides/rpc.md).

## Members

### select(state, params), schema

These define the transformations needed to normalize and denormalize the response json.
Learn more about [schemas at the normalizr documentation](https://github.com/paularmstrong/normalizr/blob/master/docs/api.md#schema).

### fetch(url: string, body: Payload): Promise\<any>

Handles performing an actual network request. This usually just proxies to the `Resource`
fetch method with a defined `method`.

### getUrl(params: Param): string

Turns the provided object params into a url to fetch.

### mutate: boolean

Whether the method has side effects. A `false` value here indicates that the response should
count as the canonical results for that url.
