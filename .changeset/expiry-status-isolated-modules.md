---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

`ExpiryStatus` works with TypeScript's `isolatedModules`

Its typings declared a `const enum`, so `ExpiryStatus.Valid` failed to compile with `isolatedModules` (the default in Vite and Next.js apps): `TS2748: Cannot access ambient const enums`. It is now a regular `enum`, matching the object the packages already export at runtime.

```ts
import { ExpiryStatus } from '@data-client/react';

const { expiryStatus } = ctrl.getResponse(
  IssueResource.get,
  args,
  ctrl.getState(),
);
if (expiryStatus === ExpiryStatus.Valid) render(data);
```
