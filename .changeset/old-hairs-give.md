---
'@data-client/endpoint': patch
---

Optimistic creates no longer need a 'fake pk'

e.g.,

```ts
controller.fetch(TodoResource.getList.push, {
  // id: randomId(), THIS IS NO LONGER NEEDED
  userId,
  title: e.currentTarget.value,
});
```

This is achieved by computing a random id when a pk cannot be
computed. In development mode non-create endpoints will
still throw when pk fails.