---
'@data-client/rest': patch
'@rest-hooks/rest': patch
---

Fix case where sometimes paginating would not update a collection

This was due to the comparison not using string serialization (canonical form for collection comparisons)