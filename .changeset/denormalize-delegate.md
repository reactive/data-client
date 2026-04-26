---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
'@data-client/normalizr': minor
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

**BREAKING**: `Schema.denormalize()` is now `(input, delegate)` instead
of the previous `(input, args, unvisit)` 3-parameter signature.

```ts
// before
denormalize(input, args, unvisit) {
  return unvisit(this.schema, input);
}

// after
denormalize(input, delegate) {
  return delegate.unvisit(this.schema, input);
}
```

The new [`IDenormalizeDelegate`](https://dataclient.io/docs/api/Schema)
exposes `unvisit`, `args`, and a new `argsKey(fn)` helper that registers
a memoization dimension when output varies with endpoint args. Reading
`delegate.args` directly does *not* contribute to cache invalidation —
schemas that branch on args must call `argsKey`. The `fn` reference
doubles as the cache path key, so it must be **referentially stable**
— define it on the instance or at module scope, not inline per call:

```ts
class LensSchema {
  constructor({ lens }) {
    this.lensSelector = lens; // stable reference across calls
  }
  denormalize(input, delegate) {
    const portfolio = delegate.argsKey(this.lensSelector);
    return this.lookup(input, portfolio);
  }
}
```

All built-in schemas (`Array`, `Object`, `Values`, `Union`, `Query`,
`Invalidate`, `Lazy`, `Collection`) have been updated. Custom schemas
implementing `SchemaSimple` must update their `denormalize` signature.

`Schema.normalize()` and the `visit()` callback also gain an optional
trailing `parentEntity` argument tracking the nearest enclosing
entity-like schema. This is additive — existing schemas don't need
changes unless they want to use it.
