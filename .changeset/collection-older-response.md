---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Fix Collection updates whose response arrives after a newer list response

A response counts as older when its request started first. This happens when two adds race, or when a list refetch (polling, revalidation) starts after an add and returns first. Before, an older [push](https://dataclient.io/rest/api/Collection#push) added its item at the start of the list and an older [unshift](https://dataclient.io/rest/api/Collection#unshift) at the end. When the newer list already had the item, it showed twice. An older [remove](https://dataclient.io/rest/api/Collection#remove) or [move](https://dataclient.io/rest/api/Collection#move) emptied the list instead of removing one item. An older [getPage](https://dataclient.io/rest/api/RestEndpoint#getpage) put its page at the start of the list.

Now these updates always apply to the stored list. An older push, unshift or getPage leaves out the items the newer list already has, and adds the rest at its end.

```ts
// add A, then B; B's response arrives first
// before: [A, ...list, B]
// after:  [...list, B, A]
```
