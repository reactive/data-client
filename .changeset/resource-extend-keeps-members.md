---
'@data-client/rest': patch
---

Fix `resource().extend({ get: ... })` dropping endpoints added earlier from its type

Customizing a resource's standard endpoints with `.extend({ ... })` kept every endpoint at runtime, but TypeScript lost the ones added before it with `.extend('name', options)`, and the deprecated `create`. Using them was a type error even though they worked.

```ts
const UserResource = resource({ path: '/users/:id', schema: User })
  .extend('current', { path: '/user' })
  .extend({ get: { dataExpiryLength: 60000 } });

// Before: Property 'current' does not exist
// After: no error
const me = await ctrl.fetch(UserResource.current);
```
