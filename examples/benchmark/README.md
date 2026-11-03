This package has two kinds of benchmarks:

- **Benchmarks that measure real-world performance** run realistic workloads
  that stay comparable across versions and libraries. CI tracks them and
  publishes the results.
- **Diagnostic benchmarks** isolate one mechanism or a degenerate case to
  diagnose it. They run locally only and are never published.

Where a new benchmark goes: if it measures real-world performance that should
stay comparable across versions or libraries, add it to a published suite; if
it diagnoses one mechanism or a degenerate case, add it to `diagnostics/`.

## Benchmarks that measure real-world performance

[Progress over time](https://reactive.github.io/data-client/dev/bench/)

### Usage

To build (from root)

```bash
yarn build:benchmark
```

To run

```bash
yarn start [suite-name] [filter]
```

or (from root)

```bash
yarn workspace example-benchmark start [suite-name] [filter]
```

Both arguments are optional:

- **No arguments**: runs `normalizr` + `core` suites with all benchmarks
- **Suite only**: `yarn start normalizr` runs all benchmarks in that suite
- **Suite + filter**: `yarn start normalizr denormalize` runs only benchmarks containing "denormalize"

#### Filter syntax

- `text` → substring match (contains "text")
- `^text` → starts with "text"

#### Suites

CI runs `normalizr` + `core` (`.github/workflows/benchmark.yml`) and publishes every case to the chart above.

- `entity` - benchmarks various entity-specific operations
- `core` - benchmarks entire operations using [Controller](https://dataclient.io/docs/api/Controller)
- `normalizr` - benchmarks just normalize/denormalize
  - `denormalizeLong nested 25% missing|null|INVALID` (and `withCache`) - the project list with every 4th nested `BuildTypeDescription` missing from the store, `null`, or `INVALID`; those are still tracked as memo dependencies
- `spread` - degenerate-case writes where spread cost scales with store size (single-entity `setResponse` into 1k/10k/100k entity stores, 10k cached endpoint keys, collection push onto 10k items, invalidateAll/expireAll). One case (`setOneEntity in 10k entity store`) is tracked over time in CI via `.github/workflows/benchmark-spread.yml`; the rest are manual-only.
- `micro` - isolated microbenchmarks for testing specific operations
- `old-normalizr` - runs equivalent benchmarks using the normalizr package

#### Filter examples

```bash
yarn start normalizr "^normalize"      # only "normalizeLong" (starts with)
yarn start normalizr "^denormalize"    # all denormalize* benchmarks
yarn start normalizr withCache         # benchmarks containing "withCache"
yarn start core setLong                # benchmarks containing "setLong"
```

### Results

Performance compared to normalizr package (higher is better):

|                     | no cache | with cache |
| ------------------- | -------- | ---------- |
| normalize (long)    | 120%     | 120%       |
| denormalize (long)  | 158%     | 1,250%     |
| denormalize (short) | 676%     | 2,990%     |

[Comparison done on a Ryzen 7950x; Ubuntu; Node 22.14.0]

Not only is denormalize faster, but it is more feature-rich as well.

Before acting on a CI benchmark comment, follow [Reading the CI comment](../benchmark-react/README.md#reading-the-ci-comment).

## Diagnostic benchmarks (local only, not published)

Build first with `yarn build:benchmark`. Each script takes an optional
[filter](#filter-syntax) on scenario names.

### Memo cache cases

```bash
yarn diag:memo [filter]
```

Benchmark.js timings of the memo cache in specific access patterns:

- `denormalizeLong Scalar` - the 700-row `Scalar` list, read with a new `MemoCache`
- `denormalizeLong Scalar withCache update one cell` - the same list read again after each op replaces one `Scalar` cell
- `denormalizeLong withCache update first|last row` - each op builds a new `entities` with one project replaced, then reads the cached list; the changed row is first or last in the list
- `denormalizeLong two Scalars, 25% Stocks missing` (and `withCache`) - two stores, each missing a different quarter of the Stocks, read in turn under two `Scalar` lenses

### Memo cache retention

```bash
yarn diag:memo-retention [filter]
```

What the memo keeps in degenerate access patterns:

- one list read against several store snapshots in rotation: hit rate and time per read
- heap the memo holds beyond the store, after a run of updates that replace entities
- one list read under many `argsKey` values in rotation: hit rate, time per read and heap held

### WeakMap marking cost per GC

```bash
yarn diag:weakmap-gc [filter]
```

Memoization keys cached values on entities through `WeakMap`s. What a
collection costs for those depends on the engine. Each scenario takes a V8 heap
snapshot and replays Hermes's marking loop on it. It reports the live `WeakMap`
entries, how many marking passes Hermes would need, and their product, which is
the number of entry visits in one Hermes old-generation pause. It also reports
V8's own full-GC time. The scenarios: a 3,736-symbol endpoint whose symbols
join tickers written each tick (and the same endpoint with no join), a 100-row
list that prepends rows, and a 50-level Department/Building chain whose deepest
Building changes every tick, which measures passes against nesting depth.

How engines resolve `WeakMap` entries during a major collection:

| Engine                | Algorithm                                                                                                                                                                                 | Where it runs                                                            | Cost for N nested entries                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| Hermes (React Native) | Repeats a scan of every `WeakMap` entry slot in the heap until a pass marks nothing new (`HadesGC::markWeakMapEntrySlots`). No key → value index.                                         | Stop-the-world, on the JS thread, at the end of every old-gen collection | passes ≈ N + 1, each visiting every slot: quadratic |
| V8 (Node, Chrome)     | The same fixpoint for at most `--ephemeron-fixpoint-iterations` (default 10) passes, then a linear algorithm over a key → values map (`MarkTransitiveClosureLinear` in `mark-compact.cc`) | Major GC; most marking is concurrent                                     | linear                                              |

So a structure that V8 collects in milliseconds can stall Hermes for seconds:
one pass per level of nesting, and every pass rescans every `WeakMap` entry in
the app, not only the memo's own. Keep `WeakMap` nesting shallow.

### Memory pressure

The `spread` scenarios allocate transient copies proportional to store size, so
the memory symptom is allocation rate and GC churn rather than retained heap.
Measure it with:

```bash
yarn start:memory [filter]
```

This runs the same scenarios as the `spread` suite (see `spread-scenarios.js`)
and reports per scenario: approximate bytes allocated per operation, GC event
counts (minor/major/other) and total GC pause during the loop, and retained
heap after a full GC (should be ~0; nonzero indicates actual retention).

### Profiling

For opt/deopt investigation:

```bash
yarn start:trace
yarn start:deopt
```
