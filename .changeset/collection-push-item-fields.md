---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Add created items to the lists their own fields match

[push](https://dataclient.io/rest/api/Collection#push), [unshift](https://dataclient.io/rest/api/Collection#unshift) and [assign](https://dataclient.io/rest/api/Collection#assign) picked lists only by the request's args and body. A todo created with `{ userId: 1 }` and the body `{ title }` skipped the stored `{ userId: 1, completed: false }` list, even though the server returned `completed: false`. Now a list key that neither the args nor the body has is matched against the created item's own field, so the todo joins that list too. Request values still win when both have the key, and `remove` still uses only the request.

```ts
// lists stored: getTodos({ userId: 1 }) and getTodos({ userId: 1, completed: false })
await ctrl.fetch(
  TodoResource.getList.push,
  { userId: 1 },
  { title: 'Buy milk' },
);
// server responds { id: 5, userId: 1, title: 'Buy milk', completed: false }
// both lists now show the new todo
```

A custom [createCollectionFilter](https://dataclient.io/rest/api/Collection#createcollectionfilter) now runs once per created item and gets it as a second argument: `(...args) => (collectionKey, item) => boolean`.
