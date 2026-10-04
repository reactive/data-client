---
'@data-client/rest': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
---

Speed up TypeScript checking of `RestEndpoint`, `resource()` and `.extend()`

Editors and `tsc` check code that defines or calls endpoints faster and with less memory. In our stress tests, a file of 150 RestEndpoints with long paths, `.extend()` and `.paginated()` checked in about half the time (3.4s → 1.7s) and memory (365MB → 211MB). Files that use `resource()` with React or Vue hooks did about 25% less type work. TypeScript reports the same errors as before.

On TypeScript 5.x and earlier, methods passed to `.extend()`, like `process()`, now get their parameter types from the endpoint, as they already did on TypeScript 6+. TypeScript 4.0 also accepts a chained `.extend().extend()`.

```ts
const getUser = new RestEndpoint({ path: '/users/:id', schema: User });

// Before (TypeScript 5.x and earlier): error TS7006: Parameter 'value' implicitly has an 'any' type.
// After: no error; `params` is typed as { id: string | number }
const getUserName = getUser.extend({
  process(value, params) {
    return value.name;
  },
});
```
