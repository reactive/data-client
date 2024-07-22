---
'@data-client/core': patch
'@data-client/react': patch
---

state.endpoints moved above indexes

`entites` and `endpoints` are the most commonly inspected
parts of state when debugging, so it is better to have endpoints
above indexes.