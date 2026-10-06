---
'@data-client/react': patch
'@data-client/test': patch
'@data-client/vue': patch
---

Fix `',' expected` errors on TypeScript 4.0 through 4.4

Importing `@data-client/react/redux`, `@data-client/react/nextjs` or `@data-client/test` failed to compile on TypeScript before 4.5, even with `skipLibCheck` on, because their declaration files used syntax those versions can't parse. They now compile on TypeScript 4.0 and later.

```ts
import { DataProvider } from '@data-client/react/nextjs';
import { renderDataHook } from '@data-client/test';

// Before (TypeScript 4.0 to 4.4):
//   node_modules/@data-client/react/lib/server/nextjs/DataProvider/DataProvider.d.ts(1,15): error TS1005: ',' expected.
//   node_modules/@data-client/test/lib/makeRenderDataClient/index.d.ts(3,33): error TS1005: ',' expected.
// After: no errors
```

`@data-client/vue/test` types now also resolve with `moduleResolution: "node"`. `@data-client/vue` needs TypeScript 4.5 or later, since Vue's own types do.
