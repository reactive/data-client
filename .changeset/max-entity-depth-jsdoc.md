---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Fix `Entity.maxEntityDepth` docs: the default is 64, not 128

Editor hover docs for `static maxEntityDepth` now show the real default. Runtime behavior is unchanged; set `maxEntityDepth` explicitly if you relied on 128.
