---
name: data-client-v0.18-migration
description: Migrate @data-client codebases to v0.18 delegate signatures. Drives the v0.18 codemod and then handles the cases it cannot — especially registering argsKey for schemas whose output depends on endpoint args. Use when upgrading to v0.18, seeing TS errors about unvisit/visit/args/delegate signatures, or adapting custom Schema implementations.
---

# @data-client v0.18 Migration

Applies to anyone implementing a custom [`Schema`](https://dataclient.io/rest/api/SchemaSimple) — `SchemaSimple`, `SchemaClass`, polymorphic wrappers, or types that subclass `EntityMixin` directly. Built-in schemas (`Entity`, `resource()`, `Collection`, `Union`, `Values`, `Array`, `Object`, `Query`, `Invalidate`, `Lazy`) are migrated by the library.

## What changed

`Schema.denormalize` and `Schema.normalize` now take a single `delegate` instead of `(args, unvisit)` / `(args, visit, delegate)`:

```ts
denormalize(input, delegate) { return delegate.unvisit(this.schema, input); }
normalize(input, parent, key, delegate /*, parentEntity? */) {
  return delegate.visit(this.schema, input, parent, key);
}
```

Critical semantic change: reading `delegate.args` does **not** contribute to cache invalidation. Schemas whose *output* varies with endpoint args must register that dependency through [`delegate.argsKey(fn)`](https://dataclient.io/rest/api/SchemaSimple). See [Step 2](#step-2-register-argskey-for-args-dependent-schemas-not-automatable) below.

## Step 1: run the codemod

**Pre-check — skip the rest of this skill if it doesn't apply.** Most apps that only consume `@data-client` (use `Entity`, `resource()`, `Collection`, `Query`, etc.) need *zero* code changes for v0.18. Run the search below at your repo root — `rg` respects `.gitignore` so it won't dive into `node_modules`. If it returns nothing, you're done; bump the package versions and move on.

```bash
# preferred (ripgrep)
rg -n 'extends (Schema|SchemaSimple|SchemaClass|EntityMixin)\b|^\s*_?(de)?normalize\s*[(=:]|\bunvisit\b|\bvisit\(' .
# fallback (POSIX grep) — adjust the path list to your source roots
grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  'extends (Schema|SchemaSimple|SchemaClass|EntityMixin)\b|^[[:space:]]*_?(de)?normalize[[:space:]]*[(=:]|\bunvisit\b|\bvisit\(' \
  src app lib packages 2>/dev/null
```

The pre-check intentionally ignores `Entity` overrides of `pk`, `process`, and `merge` — those signatures didn't change in v0.18. Only the `denormalize` / `normalize` delegate signature did.

Otherwise, commit first so you can diff, then run the codemod against your source roots — `src/` is the conventional location, but App Router (`app/`), Vue (`src/`), monorepo packages (`packages/`), and library (`lib/`) layouts all need the path adjusted:

```bash
npx jscodeshift -t https://dataclient.io/codemods/v0.18.js --extensions=ts,tsx,js,jsx <source-root>
```

Do **not** point jscodeshift at the repo root — it doesn't respect `.gitignore` and will walk into `node_modules`.

A clean run looks like `0 errors, N unmodified, 0 skipped` — that's expected, not a failure. The codemod rewrites parameter lists, body references (`unvisit(…)`, `visit(…)`, bare `args`), pass-through calls, TS method/property signatures, and adds `IDenormalizeDelegate` / `INormalizeDelegate` imports. After it runs, only the cases below need hand work.

**Single-file components (Vue/Svelte/Astro/MDX):** the codemod uses jscodeshift's `tsx` parser, which can't parse SFCs — adding `.vue` (etc.) to `--extensions` produces parse errors, not transforms. If your schemas live inside SFC `<script>` blocks, either extract them to plain `.ts` first (preferred — schemas are usually shared across components anyway) or migrate those files by hand using the rewrite shape from [Step 3](#step-3-hand-migrate-cases-the-codemod-skips).

## Step 2: register `argsKey` for args-dependent schemas (not automatable)

If your schema's *return value* depends on endpoint args, the codemod will rewrite `args` → `delegate.args`, but that read alone no longer participates in memoization. Register the dependency explicitly so the cache invalidates correctly.

`argsKey(fn)` returns `fn(args)` and uses the function reference itself as the cache path key. **`fn` must be referentially stable** — bind it on the instance or at module scope. An inline arrow creates a new reference per call and misses the cache every time.

```ts
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

## Step 3: hand-migrate cases the codemod skips

The codemod no-ops on these — find them and update by hand. The shape of the change is always the same: `(input, args, unvisit)` → `(input, delegate)` and `(input, parent, key, args, visit, delegate[, parentEntity])` → `(input, parent, key, delegate[, parentEntity])`, with `unvisit`/`visit` becoming `delegate.unvisit`/`delegate.visit` and bare `args` becoming `delegate.args`.

- **Files with no `@data-client/*` import** — the codemod gates on this. Either add an import or migrate the file by hand.
- **Class fields** — `denormalize = (input, args, unvisit) => { ... }`. Rewrite to a method (`denormalize(input, delegate) { ... }`) so future codemods catch it too.
- **`const denormalize = function...`** / **`const normalize = function...`** — only `function` declarations and methods are matched.
- **Computed or dynamic method keys** — `[name]: function(...)`, `obj.denormalize = function(...)`. Identifier and string-literal keys are matched; nothing else is.
- **Interface methods named `_denormalize` / `_denormalizeNullable`** as `TSMethodSignature` — only the literal key `denormalize` is matched in that form. The same names *are* handled when written as `declare` fields or property signatures with a function type. Either rename to `denormalize` on the interface or edit the parameter list manually.
- **Custom helper functions** that wrap `(args, unvisit)` and are passed around — update the helper signature and every caller.

## Step 4: verify

1. Run the type-checker. Residual errors about `unvisit`, `visit`, `args`, or delegate parameter counts point at code Step 3 missed.
2. Run your test suite. Cache-invalidation regressions usually surface as stale denormalized values when args change — that signals a missing `argsKey` from Step 2.
3. Grep for leftover patterns the codemod can't see:
   - `denormalize(` followed by three params, or `normalize(` with `args, visit, delegate`
   - bare `unvisit(` / `visit(` calls inside denormalize/normalize bodies
   - spread `...args` inside denormalize/normalize bodies

## Optional: Collection consolidation

Unrelated to delegate signatures: v0.18 lets a single `Collection` carry both `argsKey` and `nestKey`, so the same instance can back a top-level endpoint schema and a nested entity field. See [Optional: consolidate Collection definitions](/blog/2026/05/01/v0.18-scalar-typed-downloads#collection-consolidation) in the v0.18 blog.

## Reference

- New interfaces: [`IDenormalizeDelegate`](https://dataclient.io/rest/api/SchemaSimple), [`INormalizeDelegate`](https://dataclient.io/rest/api/SchemaSimple)
- Built-in schema diffs: `packages/endpoint/src/schemas/{Array,Object,Values,Union,Query,Invalidate,Lazy,Collection}.ts`
- Changesets: `.changeset/denormalize-delegate.md`, `.changeset/normalize-delegate.md`
- Codemod source: [`website/static/codemods/v0.18.js`](https://github.com/reactive/data-client/blob/master/website/static/codemods/v0.18.js)
