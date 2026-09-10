---
'@data-client/normalizr': patch
---

Fix `denormalize` from `@data-client/normalizr/imm` ignoring `args`

Args-dependent schemas (like [Scalar](https://dataclient.io/rest/api/Scalar)) resolved to `undefined`
when denormalized directly through the `/imm` entry point, because the endpoint
args were not threaded through. They now denormalize correctly, matching the
main entry point's behavior.
