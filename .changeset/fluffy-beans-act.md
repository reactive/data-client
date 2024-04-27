---
"@data-client/rest": patch
---

Warn for capitalization mistakes when calling createResource()

`Endpoint` and `Collection` are both capitalized because they
are classes. However, this may not be intuitive since other arguments are lower-first. Let's add a console.warn() to help
guide, since this may be intentional?

```ts
export const UserResource = createResource({
  urlPrefix: CONFIG.API_ROOT,
  path: '/users/:id',
  schema: User,
  // this should be 'Endpoint:'
  endpoint: AuthedEndpoint,
});
```