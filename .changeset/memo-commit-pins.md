---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/react': patch
---

Keep results that a committed render read while a transition retries

`DataProvider` now tells the memo which store version committed, so results a committed render read stay cached through any number of pending-transition retries and optimistic updates. Custom `Controller` memos can implement the new optional `commit(entities, settled)` method; ones without it keep working.
