---
"@data-client/core": patch
"@data-client/react": patch
---

Fix CommonJS compatibility for `/mock` subpath exports.

Jest and other CommonJS consumers can now import from `@data-client/react/mock` and `@data-client/core/mock` without ESM parsing errors.
