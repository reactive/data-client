---
'@data-client/rest': patch
---

Fix `searchParams: undefined` being widened to `any` in TypeScript 6 non-strict mode

TypeScript 6.0 widens `undefined` to `any` during generic inference when `strictNullChecks` is off.
This caused `RestEndpoint` with `searchParams: undefined` to incorrectly accept arbitrary arguments.
