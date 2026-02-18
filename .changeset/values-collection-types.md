---
'@data-client/endpoint': patch
---

Fix Collection.remove and Collection.move types for Values collections

`remove` and `move` now correctly resolve for Values-based Collections instead of `undefined`/`never`.
