---
'@data-client/rest': patch
---

Fix `ProgressEndpoint` incorrectly tagging `TypeError` from `onDownloadProgress` callback with `status = 500`

Previously, any `TypeError` thrown inside `readWithProgress` (including from the user's `onDownloadProgress` callback) was caught and tagged with `status = 500`, causing `errorPolicy` to treat it as a transient network error eligible for retry. Now only `TypeError` from `reader.read()` (actual stream/network errors) receives the `status = 500` tag; callback errors propagate unmodified.
