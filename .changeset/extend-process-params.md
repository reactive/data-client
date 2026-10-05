---
'@data-client/rest': patch
---

Type the `params` and `body` that `process()` receives in `.extend()`

A `process(value, params)` method passed to `RestEndpoint.extend()` or `resource().extend('get', {...})` used to get `params` typed as `any`, so a typo or a wrong assumption about a path parameter went unnoticed until runtime. They are now typed from the extended endpoint's `path`, `searchParams` and `body`, including a `path` set in the same `.extend()` call.

```ts
const getUser = new RestEndpoint({ path: '/users/:id' });

const getUserById = getUser.extend({
  path: '/users/by-id/:userId',
  process(value, params) {
    params.userId; // string | number
    params.id; // TypeScript error: 'id' is not a param of '/users/by-id/:userId'
    return value;
  },
});
```

Endpoints whose params are optional pass `params` as possibly `undefined`, so read it with `params?.page`.

This can surface new TypeScript errors in existing `process()` methods that read a param the endpoint doesn't have, or that read optional `params` without a check. Each is a read that could be `undefined` or throw at runtime, so fix the param name or add the check.

On TypeScript 5.x and earlier, `process(value, params)` in an `.extend()` that also sets `path` no longer fails with "implicitly has an 'any' type" under `strict`.
