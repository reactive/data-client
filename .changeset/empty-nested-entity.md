---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Normalize an empty nested entity (`{}`) like `null`

Many APIs send `{}` for a missing relation, such as a deleted author.

```ts
class Discussion extends Entity {
  id = '';
  author?: User = undefined;
  static schema = { author: User };
}
// response: { id: '1', author: {} }
```

Before: normalizing threw `Missing usable primary key` in development
(and stored a placeholder `User` in production), failing the whole response.
Now `discussion.author` is `undefined`, the same as when the API sends `null`.

A nested object with data but no primary key, and a top-level `{}`, still throw.
