---
'@data-client/rest': patch
---

Send the body of a `DELETE` endpoint that declares `body`

A `DELETE` endpoint with a `body` dropped it: the request went out with no body, and the last argument was sent as url params instead (`DELETE /posts?0=5&1=13`). It now sends the body, as its types already said.

If a `DELETE` endpoint declares `body` but you call it without one, remove `body` or set `body: undefined`. `DELETE` endpoints without `body`, like `resource().delete`, send no body as before.
