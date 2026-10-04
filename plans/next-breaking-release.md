# Next Breaking Release TODO

Type and API cleanups deferred because they would break users or mixed package versions in a minor release. Do them in the next release that already breaks compatibility and requires matching `@data-client/*` versions, and list each in that release's blog migration guide.

## Entity `pk()` args

[#4149](https://github.com/reactive/data-client/pull/4149) made Entity classes assignable to `EntityInterface` without breaking anyone, using two compatibility shims.

- **Plain `Entity.pk` declaration**: `packages/endpoint/src/schemas/Entity.ts` declares `static pk` with method syntax (`{ pk(...): ... }['pk']`) so subclass overrides that type `args?: any[]` still compile. Replace it with a plain function type taking `args?: readonly any[]`.
  - Breaks: `static pk()` overrides that annotate `args` as a mutable array. Migration: change the annotation to `readonly any[]` (the v0.19 blog already recommends this).
- **Readonly `args` in endpoint's `EntityInterface`**: `packages/endpoint/src/interface.ts` still declares `pk(..., args: any[])`, while normalizr's `EntityInterface` takes `readonly any[]`. Make them match, or have endpoint re-export normalizr's.
  - Breaks: Entity subclasses with a mutable-`args` `static pk()` override assigned to endpoint's `EntityInterface`.
