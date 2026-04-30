---
name: data-client-v0.18-migration
description: Migrate custom @data-client schemas to v0.18 delegate signatures: denormalize(input, args, unvisit) -> denormalize(input, delegate) and normalize(input, parent, key, args, visit, delegate) -> normalize(input, parent, key, delegate). Use when upgrading to v0.18, seeing TS errors about unvisit/visit/args signatures, or adapting custom Schema implementations.
---

# @data-client v0.18 Migration

Applies to anyone implementing a custom [`Schema`](https://dataclient.io/rest/api/CustomSchema) — `SchemaSimple`, `SchemaClass`, polymorphic wrappers, or types that subclass `EntityMixin` directly. Built-in schemas (`Entity`, `resource()`, `Collection`, `Union`, `Values`, `Array`, `Object`, `Query`, `Invalidate`, `Lazy`) are migrated by the library.

The automated codemod handles the common cases:

```bash
npx jscodeshift -t https://dataclient.io/codemods/v0.18.js --extensions=ts,tsx,js,jsx src/
```

## Codemod prerequisites / limits

- **Edits only run in files that already import `@data-client/*`** (any subpath). If the codemod appears to do nothing, add such an import (or migrate that file by hand).
- **`denormalize` / `normalize` as class fields** — e.g. `denormalize = (input, args, unvisit) => { ... }` — are **not** transformed; use a `denormalize(...) { }` method (or rewrite manually).
- **TS interface method signatures** — only the key `denormalize` is matched for `TSMethodSignature` (not `_denormalize` / `_denormalizeNullable`). Underscore-prefixed names are updated when they appear as **`declare` or property types** with a function type annotation (see below).
- **Top-level** `function denormalize` / `function normalize` is handled; **`const denormalize = function...`** is not.

This skill describes what the codemod does and how to handle the cases it cannot.

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

`Schema.normalize()` also takes a delegate, matching the denormalize shape. The
old signature was `(input, parent, key, args, visit, delegate, parentEntity?)`;
the new signature is `(input, parent, key, delegate, parentEntity?)`.

```ts
// before
normalize(input, parent, key, args, visit, delegate) {
  return visit(this.schema, input, parent, key, args);
}

// after
normalize(input, parent, key, delegate) {
  return delegate.visit(this.schema, input, parent, key);
}
```

Full delegate surface ([`IDenormalizeDelegate`](https://dataclient.io/rest/api/CustomSchema)):

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

### Normalize methods

`(input, parent, key, args, visit, delegate, parentEntity?)` →
`(input, parent, key, delegate, parentEntity?)`. Inside the body:

- `visit(schema, value, parent, key, args)` → `delegate.visit(schema, value, parent, key)`
- bare `args` references (including spreads) → `delegate.args`
- pass-through `someSchema.normalize(input, parent, key, args, visit, delegate)` →
  `someSchema.normalize(input, parent, key, delegate)`

```ts
// before
class Wrapper {
  normalize(input: {}, parent: any, key: string, args: readonly any[], visit: any, delegate: any) {
    const value = visit(this.schema, input, parent, key, args);
    return this.process(value, ...args);
  }
}

// after
class Wrapper {
  normalize(input: {}, parent: any, key: string, delegate: INormalizeDelegate) {
    const value = delegate.visit(this.schema, input, parent, key);
    return this.process(value, ...delegate.args);
  }
}
```

If your normalize implementation used a different name for the existing delegate
parameter, such as `snapshot`, the codemod keeps that name and rewrites
`args`/`visit` to `snapshot.args` / `snapshot.visit`.

### TypeScript signatures

Update method signatures and `declare` fields the same way:

```ts
// before
interface MySchema {
  denormalize(input: {}, args: readonly any[], unvisit: (s: any, v: any) => any): any;
  normalize(input: {}, parent: any, key: any, args: readonly any[], visit: (s: any, v: any, p: any, k: any, a: readonly any[]) => any, delegate: any): any;
}

class Lazy {
  declare _denormalizeNullable: (
    input: {},
    args: readonly any[],
    unvisit: (s: any, v: any) => any,
  ) => any;
}

// after — the codemod adds delegate types to your existing
// `@data-client/{rest,endpoint,normalizr,...}` import as an inline
// `type` specifier. Only when no such import exists does it create
// new `import type { ... } from '@data-client/endpoint'` lines.
import {
  Entity,
  type IDenormalizeDelegate,
  type INormalizeDelegate,
} from '@data-client/rest';

interface MySchema {
  denormalize(input: {}, delegate: IDenormalizeDelegate): any;
  normalize(input: {}, parent: any, key: any, delegate: INormalizeDelegate): any;
}

class Lazy {
  declare _denormalizeNullable: (input: {}, delegate: IDenormalizeDelegate) => any;
}
```

On types: **`interface { denormalize(...) }`** uses the literal key `denormalize` only. **`_denormalize` / `_denormalizeNullable`** (and similar) are matched on **`declare` / property signatures** whose type is a `(...)` function type. **`normalize`** type signatures use the literal key `normalize` with the old 6- or 7-parameter form.

### args-dependent output (manual)

The codemod will rewrite `args` to `delegate.args`, but if your schema's *return value* depends on those args, you must also register an [`argsKey`](https://dataclient.io/rest/api/CustomSchema) so memoization invalidates correctly. The codemod cannot do this for you.

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

Do these by hand when they apply:

- **No `@data-client/*` import** in the file (codemod no-ops).
- **Class field** `denormalize = …` / `normalize = …` (arrow or function expression).
- **`const denormalize` / `const normalize`** (only declarations named `denormalize` / `normalize` are matched).
- **Computed keys** on class/object methods (e.g. `[name]: function...`). Identifier and string-literal keys `denormalize` / `normalize` are matched.
- **Methods reassigned dynamically** (`obj.denormalize = function(input, args, unvisit) { ... }`).
- **Normalize methods reassigned dynamically** (`obj.normalize = function(input, parent, key, args, visit, delegate) { ... }`).
- **Interface methods** named `_denormalize` / `_denormalizeNullable` (use `denormalize` on the interface or edit manually).
- **Custom helper functions** that wrap `(args, unvisit)` and are passed around — update the helper and its callers.
- **`argsKey` registration** for schemas whose output varies with `args` (see above).

## New normalize context

`Schema.normalize()` keeps the optional trailing `parentEntity` parameter — the
nearest enclosing entity-like schema, tracked automatically by the visit walker.
Existing schemas that use it should keep it after the delegate parameter.

### Optional Collection cleanup

Unrelated to delegate signatures: v0.18 allows one `Collection` to carry both `argsKey` and `nestKey` so the same instance can back a top-level endpoint schema and a nested entity field. Consolidation is optional—see [Optional: consolidate Collection definitions](/blog/2026/04/24/v0.18-scalar-typed-downloads#collection-consolidation) in the v0.18 blog.

## Where to find affected code

Search for these patterns in your codebase:

- `denormalize(input` followed by 3 params — both class methods and bare functions
- `normalize(input` followed by `args, visit, delegate` params
- `unvisit(` calls inside a `denormalize` body
- `visit(` calls inside a `normalize` body
- Spread `...args` inside a `denormalize` body
- Spread `...args` inside a `normalize` body
- TS interfaces / `declare` fields with the 3-param signature
- TS interfaces / `declare` fields with the old normalize signature
- Custom `Schema` / `SchemaClass` / `SchemaSimple` implementations

## Reference

- Changesets: `.changeset/denormalize-delegate.md`, `.changeset/normalize-delegate.md`
- Built-in schema diffs: `packages/endpoint/src/schemas/{Array,Object,Values,Union,Query,Invalidate,Lazy,Collection}.ts`
- New interfaces: [`IDenormalizeDelegate`](https://dataclient.io/rest/api/CustomSchema), [`INormalizeDelegate`](https://dataclient.io/rest/api/CustomSchema)
