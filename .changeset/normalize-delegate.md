---
"@data-client/endpoint": minor
"@data-client/normalizr": minor
---

Move normalize `args` and recursive `visit` into the existing normalize delegate passed to schemas.
Custom `Schema.normalize()` implementations should migrate from
`normalize(input, parent, key, args, visit, delegate, parentEntity?)` to
`normalize(input, parent, key, delegate, parentEntity?)`, then read
`delegate.args` and call `delegate.visit()` for recursive normalization.

Before:

```ts
class WrapperSchema {
  normalize(input, parent, key, args, visit, delegate) {
    const normalized = visit(this.schema, input.value, input, 'value', args);
    delegate.mergeEntity(this, this.pk(input, parent, key, args), normalized);
    return normalized;
  }
}
```

After:

```ts
class WrapperSchema {
  normalize(input, parent, key, delegate) {
    const { args, visit } = delegate;
    const normalized = visit(this.schema, input.value, input, 'value');
    delegate.mergeEntity(this, this.pk(input, parent, key, args), normalized);
    return normalized;
  }
}
```
