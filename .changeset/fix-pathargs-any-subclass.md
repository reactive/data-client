---
'@data-client/rest': patch
---

Fix type errors when using concrete body types with subclassed RestEndpoint

Subclassing RestEndpoint (the standard pattern for adding auth headers, custom
serialization, etc.) could produce type errors when specifying concrete body types.

```ts
// Before: type error on body ❌
class AuthdEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {}
new AuthdEndpoint({
  method: 'PUT',
  path: '/users/:id',
  body: {} as { username: string; email: string },
});

// After: works correctly ✓
```
