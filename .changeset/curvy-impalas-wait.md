---
'@rest-hooks/core': major
'@rest-hooks/react': major
'@data-client/react': minor
'@data-client/core': minor
---

Deprecations:
- controller.receive, controller.receiveError
- RECEIVE_TYPE
- MiddlewareAPI.controller (MiddlewareAPI is just controller itself)
  - ({controller}) => {} -> (controller) => {}
