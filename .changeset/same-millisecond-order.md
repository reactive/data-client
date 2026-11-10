---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix an item showing twice when a create and a list fetch start in the same millisecond

Clicking create and then showing a list often starts both requests in the same millisecond. When the list response already had the new item, the create's [push](https://dataclient.io/rest/api/Collection#push) or [unshift](https://dataclient.io/rest/api/Collection#unshift) added it again, so the list showed it twice. React then warned about duplicate keys and could render rows in the wrong place, like a later optimistic create not showing at the top.

Now fetches, [set](https://dataclient.io/docs/api/Controller#set) calls and [resets](https://dataclient.io/docs/api/Controller#resetEntireStore) started in the same millisecond keep their order. So the create's response counts as older than the list and adds only items the list doesn't have. This also drops a response to a fetch started just before a reset, and lets two optimistic creates to the same endpoint in one millisecond settle separately.

`fetchedAt` can now be a fraction of a millisecond above `Date.now()`. Tests that freeze time and expect `meta.fetchedAt` to equal `Date.now()` for a second fetch in the same millisecond should compare against the action's own `meta.fetchedAt` instead.
