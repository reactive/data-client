---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Fix the result type of [Controller.fetch()](https://dataclient.io/docs/api/Controller#fetch) when pushing several items at once

Sending an array to [RestEndpoint.push](https://dataclient.io/rest/api/RestEndpoint#push) or `unshift` resolves the created items as an array, but its type was one item, so reading the array was a TypeScript error while `created.id` compiled and was `undefined` at runtime. It is now typed as an array. A single item, `FormData`, or a body typed `any` still resolves one item.

```ts
// Before: TypeScript error, since the result was typed as one Todo
// After: an array of the created Todos
const [milk, dog] = await ctrl.fetch(TodoResource.getList.push, [
  { title: 'Buy milk' },
  { title: 'Walk dog' },
]);
```

The deprecated `resource().create` keeps typing its result as one item; use `getList.push` to get the array type.

[ctrl.set()](https://dataclient.io/docs/api/Controller#set) with [Collection.push](https://dataclient.io/rest/api/Collection#push) or `unshift` now takes the Collection's args, which pick the lists it adds to. Before, it took the Entity's fields, so args that matched no list compiled and silently added nothing.

```ts
const TodoResource = resource({
  path: '/groups/:group/todos/:id',
  schema: Todo,
});

// Before: TypeScript error, though this adds the todo to group five's lists
// After: compiles
ctrl.set(TodoResource.getList.schema.push, { group: 'five' }, todo);
```
