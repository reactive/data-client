---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Fix `getOptimisticResponse()` accepting any return value

Unless an endpoint has a typed `process()`, its [getOptimisticResponse()](https://dataclient.io/rest/api/RestEndpoint#getoptimisticresponse)
could return anything, so a wrong field type only showed up as bad data in the UI until the server responded. The return
value is now checked against the endpoint's schema, like a [Controller.set()](https://dataclient.io/docs/api/Controller#set)
value: an Entity takes any of its fields, and a [Collection](https://dataclient.io/rest/api/Collection) takes a list of them.
This applies to `new RestEndpoint()`, `.extend()` and `resource().extend()`.

```ts
const toggleTodo = new RestEndpoint({
  path: '/todos/:id',
  method: 'PATCH',
  schema: Todo,
  getOptimisticResponse(snap, { id }) {
    const todo = snap.get(Todo, { id });
    if (!todo) throw snap.abort;
    // Before: compiled, then the checkbox stayed checked because 'false' is truthy
    // After: TypeScript error, completed is a boolean
    return { id, completed: todo.completed ? 'false' : 'true' };
  },
});
```

Return the field's real type instead (`completed: !todo.completed`). Endpoints with a typed `process()` keep checking
the return against what `process()` returns.
