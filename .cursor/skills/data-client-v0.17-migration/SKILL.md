---
name: data-client-v0.17-migration
description: Migrate custom @data-client schemas from the v0.16 denormalize(input, args, unvisit) signature to the v0.17 denormalize(input, delegate) signature. Use when upgrading to v0.17, when seeing TS errors about unvisit not being callable, or when adapting custom Schema implementations.
---

# @data-client v0.17 Migration

Applies to anyone implementing a custom [`Schema`](https://dataclient.io/docs/api/Schema) — `SchemaSimple`, `SchemaClass`, polymorphic wrappers, or types that subclass `EntityMixin` directly. Built-in schemas (`Entity`, `resource()`, `Collection`, `Union`, `Values`, `Array`, `Object`, `Query`, `Invalidate`, `Lazy`) are migrated by the library.

The automated codemod handles the common cases:

```bash
npx jscodeshift -t https://dataclient.io/codemods/v0.17.js --extensions=ts,tsx,js,jsx src/
```

This skill describes what it does and how to handle the cases it can't.

## What changed

`Schema.denormalize()` now takes a single `delegate` instead of `(args, unvisit)`. Reading `delegate.args` does **not** contribute to cache invalidation — schemas whose output varies with endpoint args must register that dependency through `delegate.argsKey(fn)`.

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

Full delegate surface ([`IDenormalizeDelegate`](https://dataclient.io/docs/api/Schema)):

```ts
interface IDenormalizeDelegate {
  unvisit(schema: any, input: any): any;
  readonly args: readonly any[];
  argsKey(fn: (args: readonly any[]) => string | undefined): string | undefined;
}
```

## Migration rules

### Class methods

`(input, args, unvisit)` → `(input, delegate)`. Inside the body:

- `unvisit(schema, value)` → `delegate.unvisit(schema, value)`
- bare `args` references (including spreads) → `delegate.args`
- pass-through `someSchema.denormalize(input, args, unvisit)` → `someSchema.denormalize(input, delegate)`

```ts
// before
class Wrapper {
  denormalize(input: {}, args: readonly any[], unvisit: any) {
    const value = unvisit(this.schema, input);
    return this.process(value, ...args);
  }
}

// after
class Wrapper {
  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    const value = delegate.unvisit(this.schema, input);
    return this.process(value, ...delegate.args);
  }
}
```

### TypeScript signatures

Update method signatures and `declare` fields the same way:

```ts
// before
interface MySchema {
  denormalize(input: {}, args: readonly any[], unvisit: (s: any, v: any) => any): any;
}

class Lazy {
  declare _denormalizeNullable: (
    input: {},
    args: readonly any[],
    unvisit: (s: any, v: any) => any,
  ) => any;
}

// after — the codemod adds `IDenormalizeDelegate` to your existing
// `@data-client/{rest,endpoint,normalizr,...}` import as an inline
// `type` specifier. Only when no such import exists does it create a
// new `import type { IDenormalizeDelegate } from '@data-client/endpoint'`.
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

interface MySchema {
  denormalize(input: {}, delegate: IDenormalizeDelegate): any;
}

class Lazy {
  declare _denormalizeNullable: (input: {}, delegate: IDenormalizeDelegate) => any;
}
```

The codemod matches `denormalize`, `_denormalize`, and `_denormalizeNullable` on type declarations.

### args-dependent output (manual)

The codemod will rewrite `args` to `delegate.args`, but if your schema's *return value* depends on those args, you must also register an [`argsKey`](https://dataclient.io/docs/api/Schema) so memoization invalidates correctly. The codemod cannot do this for you.

`argsKey` returns `fn(args)` for convenience **and** the function reference doubles as the cache path key on `WeakDependencyMap` — so `fn` must be **referentially stable**. Bind it in the constructor or at module scope; an inline arrow creates a new reference per call and misses the cache every time.

```ts
// before — args read directly
class LensSchema {
  denormalize(input, args, unvisit) {
    const lens = args[0]?.portfolio;
    return this.lookup(input, lens);
  }
}

// after — stable instance field + declared memo dimension
class LensSchema {
  constructor({ lens }) {
    this.lensSelector = lens;
  }
  denormalize(input, delegate) {
    const lens = delegate.argsKey(this.lensSelector);
    return this.lookup(input, lens);
  }
}
```

See [`Scalar`](https://dataclient.io/rest/api/Scalar) for a real-world example.

## What the codemod skips

These are rare; do them by hand:

- **Computed/string-keyed methods**: only literal `denormalize` keys are matched.
- **Methods reassigned dynamically** (`obj.denormalize = function(input, args, unvisit) { ... }`).
- **Custom helper functions** that wrap `(args, unvisit)` and are passed around — you'll need to update both the helper and its callers.
- **`argsKey` registration** for schemas whose output varies with `args` (see above).

## New (additive, no migration needed)

`Schema.normalize()` and the `visit()` callback gain an optional trailing `parentEntity` parameter — the nearest enclosing entity-like schema, tracked automatically by the visit walker. Existing schemas don't need changes; new schemas can opt in.

## Where to find affected code

Search for these patterns in your codebase:

- `denormalize(input` followed by 3 params — both class methods and bare functions
- `unvisit(` calls inside a `denormalize` body
- Spread `...args` inside a `denormalize` body
- TS interfaces / `declare` fields with the 3-param signature
- Custom `Schema` / `SchemaClass` / `SchemaSimple` implementations

## Reference

- Changeset: `.changeset/denormalize-delegate.md`
- Built-in schema diffs: `packages/endpoint/src/schemas/{Array,Object,Values,Union,Query,Invalidate,Lazy,Collection}.ts`
- New interface: [`IDenormalizeDelegate`](https://dataclient.io/docs/api/Schema)
