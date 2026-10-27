---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Fix Collection push and unshift showing an item twice after it was deleted and added back

After an item was deleted, adding an item with the same id through [push](https://dataclient.io/rest/api/Collection#push) or [unshift](https://dataclient.io/rest/api/Collection#unshift) (for example `getList.push`) listed it twice, while [All](https://dataclient.io/rest/api/All) counted it once. This happens with lists keyed by another entity's id, like cart lines keyed by product or a list of followed users. Now, when an added item was deleted, its old id is dropped first, so it shows once: at the end (push) or start (unshift). Ids of items that weren't deleted are untouched, so pushing an id the list already shows still adds it again, as `Array.push()` would.

```ts
await ctrl.fetch(CartResource.delete, { id: 'mug' });
await ctrl.fetch(CartResource.getList.push, { id: 'mug', quantity: 1 });
// getList shows the mug once, at the end
```
