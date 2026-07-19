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

- `text` → substring match (contains)
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

### GC policy (isolated Node baseline)

Measures the current monolithic cache GC (`GCPolicy.runSweep` + GC reducer)
under a timerless `BenchmarkGCPolicy` subclass: `expiresAt` always zero, `init`
only stores the controller (no intervals), `cleanup` is a no-op, and a public
`sweep()` calls protected `runSweep` once. This is **data-client cache GC**, not
V8/engine GC — do not conflate the two.

```bash
yarn build:benchmark
yarn workspace example-benchmark start:gc [filter] [--samples=N] [--memory] [--table|--no-table]
yarn workspace example-benchmark start:gc --verify-manifest
# or: yarn workspace example-benchmark start:gc:verify
```

Every `yarn build:benchmark` / workspace `build` runs webpack then writes
`dist/gc-build-manifest.json` (BuildManifest v1: `schemaVersion`, `buildId`,
`commit`, `dirty`, `sourceDigest`, `artifacts`). `sourceDigest` hashes sorted
relevant inputs on disk (`packages/core/src/**`, GC harness/runner/config/
package files), so dirty or untracked relevant files change it. `artifacts`
maps each emitted `dist/*` file (except the manifest) to sha256. `buildId` is
the digest of those canonical fields excluding itself.

`start:gc` **verifies** the manifest before scenarios: recomputes the current
source digest and every dist artifact hash, and rejects stale/missing/tampered
builds with a rebuild instruction. Report `build` provenance comes from the
**verified manifest**, never from live `git rev-parse` at run time. Manifest
generation and verification are outside timed cache-GC work.

`--verify-manifest` / `start:gc:verify` self-tests that source and artifact
tampering are rejected and restores all files afterward.

Examples:

```bash
# All 1k scenarios (substring filter); JSON on stdout
yarn workspace example-benchmark start:gc /1000/ --samples=5

# Single 100k entity scan without building unrelated fixtures
yarn workspace example-benchmark start:gc node/entity/unique/100000/scan/gc --samples=3

# Duplicate entity queue amplification baseline
yarn workspace example-benchmark start:gc entity/duplicate/1000

# Capture JSON only (no stderr table)
yarn workspace example-benchmark start:gc /1000/scan/gc --no-table > gc-report.json
```

Filter syntax matches the other suites (`text` substring, `^text` prefix) against
stable scenario IDs:

`node/{entity|endpoint|mixed}/{unique|duplicate}/{1000|10000|100000}/{scan|reducer|end-to-end}/{gc|no-gc}`

| Axis            | Values                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `candidateKind` | `entity`, `endpoint`, `mixed` (mixed splits total count across entity+endpoint)                                                                   |
| `pattern`       | `unique` (distinct keys/paths); `duplicate` (one entity path released `count` times; entity only)                                                 |
| `count`         | Canonical `1000`, `10000`, `100000`                                                                                                               |
| `mode`          | `scan` (dispatch captures action, no reduce), `reducer` (prebuilt GC action through reducer), `end-to-end` (sweep dispatch reduces synchronously) |
| `control`       | `gc` or `no-gc` (harness/no-op overhead)                                                                                                          |

**Setup / timing boundaries**

1. **Prepare** (untimed) — build deterministic fixture state (`entities`/`entitiesMeta` or `endpoints`/`meta`), queue candidates via `createCountRef` mount/release. `reducer` mode prebuilds a GC action and clones state (seed dropped before timing/heap baseline). `scan` / `end-to-end` do **not** retain parallel 100k target arrays.
2. **Timed cache-GC** — `sweep()`, `reducer(state, action)`, or empty `no-op` body only. No per-candidate marks/logging inside this window.
3. **Optional retained-heap (`--memory`)** — after timed work + validation, drop observer refs (captured GC action, prebuilt action) while **keeping the live store**; then settle + forced V8 GC. Engine GC pauses are never folded into `totalMs`.

Each destructive sample (`reducer` / `end-to-end`) gets a fresh fixture. Default
`--samples=11` (CLI-overridable). Fixtures for unmatched counts are never built,
so a filtered `100000` run does not construct 1k/10k stores.

**Metrics** (JSON `schemaVersion: 1` on stdout)

- `totalMs` — timed cache-GC wall time
- `sliceDurationsMs` — current monolith is **one slice** (honest representation; not fabricated per-candidate samples)
- `actionCount`, `queueEntries`, `uniqueTargets`, `actionTargetCount`, `deletionCount`
- For `duplicate`: queue/action may list the same entity path repeatedly; `uniqueTargets` / final `deletionCount` stay `1`
- Summary: median / min / max / p95 / p99 where meaningful; units are explicit in the report

Every accepted sample is self-validated (queue cardinality, action target shape,
final deletions for reducer/end-to-end). Invalid fixtures/results throw.

**`--memory` semantics (keep-store / drop-observer)**

`heapDeltaBytes` is **not** “drop the whole harness and see what V8 frees.” That
would free the fixture for both `gc` and `no-gc` and hide cache deletion.
Instead:

1. `heapBefore` — store + queues retained (reducer seed already dropped); forced V8 GC
2. timed cache-GC (or `no-gc` no-op)
3. validate, then release observer-only refs (captured action target arrays, prebuilt action)
4. `heapAfter` — **live store still retained**; settle + forced V8 GC

Interpretation: compare `gc` vs `no-gc` on `reducer` / `end-to-end` — `gc` should
show a more negative (or smaller) retained heap after deleting cache entries.
`scan` does not mutate the store, so its heap delta is not a retained-cache signal.
Report includes `memorySemantics` documenting this model. Still separate from
engine GC timing.

Local calibration harness only — not claimed as CI-integrated.

### Profiling

For opt/deopt investigation:

```bash
yarn start:trace
yarn start:deopt
```
