---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix an item showing twice when a create and a list fetch start in the same millisecond

When the list response already had the new item, the create's [push](https://dataclient.io/rest/api/Collection#push) or [unshift](https://dataclient.io/rest/api/Collection#unshift) added it again. React then warned about duplicate keys and could render rows in the wrong place. Now the item shows once.

Also fixed for requests in the same millisecond: a response to a fetch started just before [`resetEntireStore()`](https://dataclient.io/docs/api/Controller#resetEntireStore) is dropped, and two optimistic creates to one endpoint settle separately.

Tests that freeze time can now see `meta.fetchedAt` above `Date.now()` after the first fetch in the same millisecond (about 1 ms per 1,024 fetches); compare with the action's own `meta.fetchedAt` instead.
