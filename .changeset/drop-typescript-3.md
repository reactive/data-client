---
'@data-client/core': minor
'@data-client/endpoint': minor
'@data-client/normalizr': minor
'@data-client/react': minor
'@data-client/graphql': minor
'@data-client/img': minor
'@data-client/test': minor
---

BREAKING: Require TypeScript 4.0 or later

The TypeScript 3.x type declarations are removed. They no longer type-checked on any TypeScript 3.x version, and
`@data-client/rest` already required TypeScript 4.0. Upgrade TypeScript to 4.0 or later.

```diff title="package.json"
- "typescript": "^3.9.0"
+ "typescript": "^4.0.0"
```
