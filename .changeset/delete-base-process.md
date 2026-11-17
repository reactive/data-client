---
'@data-client/rest': patch
---

`resource().delete` runs the `Endpoint` class's `process()` (or the resource's `process` option)

A `resource()` `delete` sets its own `process()`, which used to replace the one from the `Endpoint` class, so a base class that unwrapped an envelope or converted key case returned the raw body for `delete` only. `delete` now passes a non-empty body through that `process()` first. An empty body still becomes the params.

```ts
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  process(value: any) {
    return value?.data;
  }
}

const UserResource = resource({
  path: '/users/:id',
  schema: User,
  Endpoint: ApiEndpoint,
});
// { "data": { "id": 5 } } -> { id: 5 }, like every other UserResource endpoint
await UserResource.delete({ id: 5 });
```
