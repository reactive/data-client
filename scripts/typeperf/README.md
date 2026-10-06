# Type-check performance budget

Guards how much work TypeScript does to check code that uses `@data-client` types.
CI runs it in the `typecheck` job; run it locally after `yarn ci:build:types`:

```bash
yarn check:typeperf             # every fixture
yarn check:typeperf paths       # one fixture
yarn check:typeperf --update    # re-record budget.json after an intended change
```

It fails when:

- a stress fixture's **instantiation count** rises more than 10% over [budget.json](./budget.json).
  It type-checks with TypeScript 7 (`@typescript/native`, the compiler the repo builds with).
  Instantiations are deterministic for a given TypeScript version, so they make a stable
  signal; check times are printed for context only. Counts shift when the compiler is
  upgraded, so re-record the budget with `--update` alongside a TypeScript bump.
- a fixture has type errors.
  The `patheq` fixture's errors mean the path types (`PathKeys`, `PathArgs`, `ShortenPath`,
  `PathArgsAndSearch`, `KeysToArgs`) disagree with the frozen reference implementation in
  [patheq/orig.ts](./patheq/orig.ts) on one of ~1500 fuzzed paths. If a path type's behavior
  changes on purpose, update `orig.ts` to match.

When a count drops more than 10% below its budget, the check says so; re-record it with
`--update` so the budget catches regressions from the new level.

## Fixtures

[gen.mjs](./gen.mjs) writes `scenarios/<name>/` (gitignored). `N=2` scales them up.

| Fixture | What it stresses |
|---|---|
| resources | 40 `resource()`s × React hooks and Controller calls |
| bigEntity | a 300-field Entity |
| union | a 30-member Union in Collection, Values and nested schemas |
| paths | 150 RestEndpoints with long paths, `extend()` and `paginated()` |
| nested | 12 levels of nested Entity relations |
| vue | 40 resources × Vue composables |
| schemas | Query, All, Invalidate, Array and Object schemas |
| typical | a small, realistic app |
| setValues | `ctrl.set()` values on a Union, Collection and big Entity |
| setUpdaters | `ctrl.set()` updaters spreading `prev` on a 30-member Union |
| redux | `prepareStore()`'s store passed to react-redux's `Provider` and `ExternalDataProvider` |
| setInvalidate | `ctrl.set()` single and batch Invalidate rows on a 30-member Union and big Entity |
| patheq | path types against [patheq/orig.ts](./patheq/orig.ts) on fixed-seed fuzzed paths |

To compare with TypeScript 6 or dig into one fixture, run a compiler on it directly:

```bash
npx tsc6 -p scripts/typeperf/scenarios/paths/tsconfig.json --extendedDiagnostics
npx tsc -p scripts/typeperf/scenarios/paths/tsconfig.json --extendedDiagnostics
```
