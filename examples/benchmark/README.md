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

- `entity` - benchmarks various entity-specific operations
- `core` - benchmarks entire operations using [Controller](https://dataclient.io/docs/api/Controller)
- `normalizr` - benchmarks just normalize/denormalize
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
Local-only — not tracked in CI.

### Profiling

For opt/deopt investigation:

```bash
yarn start:trace
yarn start:deopt
```
