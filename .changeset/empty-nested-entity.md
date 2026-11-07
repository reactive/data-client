---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Normalize an empty nested entity (`{}`) as missing

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
Now `discussion.author` is `undefined`.

Only `{}` on an [optional member](https://dataclient.io/rest/api/Entity#optional-members)
changes. `{}` on a required member or anywhere else (the top level, a response envelope,
a Collection item), and a nested object with fields but no primary key, still throw.
