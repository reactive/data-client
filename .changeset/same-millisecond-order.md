---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix an item showing twice when a list fetch starts in the same millisecond as a create

When the list fetch started after the create and its response already had the new item, the create's [push](https://dataclient.io/rest/api/Collection#push) or [unshift](https://dataclient.io/rest/api/Collection#unshift) added it again. React then warned about duplicate keys and could render rows in the wrong place. Now the item shows once.

Also fixed for requests in the same millisecond: a response to a fetch started just before [`resetEntireStore()`](https://dataclient.io/docs/api/Controller#resetEntireStore) is dropped, and two optimistic creates to one endpoint settle separately.

Tests that freeze time can now see `meta.fetchedAt` a fraction of a millisecond above `Date.now()`: every fetch, set and reset at the same frozen time moves it up by 1/1024 ms, even across tests. Compare with the action's own `meta.fetchedAt` instead.

Custom Managers should pass the fetch action's `meta.fetchedAt` to [`controller.resolve()`](https://dataclient.io/docs/api/Controller#resolve), as documented. A `fetchedAt: Date.now()` passed in the same millisecond as a reset is now dropped.
