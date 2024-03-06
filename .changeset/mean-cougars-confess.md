---
"@data-client/react": patch
"@data-client/core": patch
---

Improve controller.getResponse() type matching

Uses function overloading to more precisely match argument
expectations for fetchable Endpoints vs only keyable Endpoints.