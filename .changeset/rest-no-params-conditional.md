---
'@data-client/rest': patch
---

Fix TypeScript error conditionally fetching a `RestEndpoint` that takes no params

Passing `null` to skip a fetch is the same for every hook, but an endpoint without path or search params had no argument to put in the other branch, so `cond ? {} : null` was a TypeScript error. A `RestEndpoint` without params now also accepts `{}`, which fetches the same URL and shares the same cache entry as calling it with no arguments.

```ts
const getTeams = new RestEndpoint({ path: '/teams', schema: [Team] });

// Before: Argument of type '[{} | null]' is not assignable to parameter of type 'readonly [] | readonly [null]'
const teams = useSuspense(getTeams, showTeams ? {} : null);
```

Params it doesn't take, like `getTeams({ page: 1 })`, are still a TypeScript error.
