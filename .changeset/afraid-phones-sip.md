---
'@data-client/use-enhanced-reducer': patch
'@data-client/normalizr': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/hooks': patch
'@data-client/react': patch
'@data-client/redux': patch
'@data-client/core': patch
'@data-client/rest': patch
'@data-client/img': patch
'@data-client/ssr': patch
---

Fix unpkg bundles and update names

- Client packages namespace into RDC
  - @data-client/react - RDC
  - @data-client/core - RDC.Core
  - @data-client/redux - RDC.Redux
- Definition packages namespace top level
  - @data-client/rest - Rest
  - @data-client/graphql - GraphQL
  - @data-client/img - Img
  - @data-client/endpoint - Endpoint
- Utility
  - @data-client/normalizr - normalizr
  - @data-client/use-enhanced-reducer - EnhancedReducer
