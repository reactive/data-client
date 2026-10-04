---
'@data-client/endpoint': patch
'@data-client/normalizr': patch
'@data-client/rest': patch
'@data-client/graphql': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix types for TypeScript 4.x when `skipLibCheck` is off

TypeScript 4.0 through 4.7 no longer report `Cannot find name 'NoInfer'` from `@data-client/endpoint` or `@data-client/normalizr`, and TypeScript 4.0 through 4.9 no longer report `Only named exports may use 'export type'` from `@data-client/normalizr`.

```ts
import { Entity } from '@data-client/endpoint';
import { normalize } from '@data-client/normalizr';

// Before (TypeScript 4.7, skipLibCheck: false):
//   error TS2304: Cannot find name 'NoInfer'.
//   error TS1383: Only named exports may use 'export type'.
// After: no errors
```
