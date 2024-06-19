---
'@data-client/react': patch
---

Remove need for dispatch in StoreContext as it is never used

This should have no affect unless you're working with internals of Data Client