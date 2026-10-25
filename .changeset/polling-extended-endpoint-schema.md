---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix polling losing the schema of endpoints made with `.extend()`

When [pollFrequency](https://dataclient.io/rest/api/RestEndpoint#pollfrequency) was added with `.extend()`, each poll
stored its response without normalizing it. Lists read with [useLive()](https://dataclient.io/docs/api/useLive) or
[useSubscription()](https://dataclient.io/docs/api/useSubscription) then stopped updating from mutations, optimistic
updates and Collection pushes until the next poll arrived. Polls now keep the endpoint's `schema`, `process()` and other
options.

```ts
const TodoResource = resource({ path: '/todos/:id', schema: Todo, optimistic: true });
const getTodos = TodoResource.getList.extend({ pollFrequency: 2000 });

const todos = useLive(getTodos);
// toggling a todo now re-renders this list right away, not on the next poll
ctrl.fetch(TodoResource.partialUpdate, { id }, { completed: true });
```
