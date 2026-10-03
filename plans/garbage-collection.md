# Garbage collection

Status: exploring. No design is chosen, and production GC is unchanged.
Related: [GOALS.md](../GOALS.md), `packages/core/src/state/GCPolicy.ts`

This is the working record for redesigning cache garbage collection (GC). It
covers the goals, how GC works today, confirmed gaps, prior art, open
decisions, one candidate design, and how to measure. Only the goals and
constraints are settled. Everything from [Candidate design](#candidate-design-cooperative-slicing)
onward is a hypothesis. If a simpler design meets the goals, prefer it.

## Goals

In priority order:

1. **Interaction latency.** No dropped frames during critical updates: a
   continuous 60 FPS on mid-range hardware, including while GC runs.
2. **Web:** bundle size, then retained memory.
3. **React Native:** retained memory, then bundle size. Bundle size barely
   matters on React Native.
4. **Avoid refetches.** Deleting more aggressively can cause refetches. Lower
   memory is not automatically a win. ([GOALS.md](../GOALS.md) ranks network
   cost above frame rate in general.)

Web and React Native may pick different points on this tradeoff. Endpoint and
schema definitions stay shared.

## Constraints

- **Keep React's built-in reducer.** It exists for concurrent rendering in
  React 19+. Do not replace it with an external store to make GC easier.
- **Keep GC bookkeeping out of rendered state.** Reference counts must not
  update render-driving state on every mount and unmount.
- **No render from GC alone.** If GC changes nothing a mounted consumer
  renders, it must not by itself trigger a React render.
- **Open question, not an approval:** attaching GC work to a later reducer
  update must not slow that update, and the update must be unchanged when
  nothing is reclaimable.

## How GC works today

**Reference counting.** Read hooks get a `countRef` from
`Controller.getResponseMeta()` or `getQueryMeta()`. Mounting increments the
endpoint key and every entity path in the denormalized result. Releasing the
last reference queues those candidates: endpoints in a `Set`, entities in an
array (so one entity can be queued many times).

**Sweeping.** Every 5 minutes (`intervalMS`), `GCPolicy` calls
`requestIdleCallback(..., { timeout: 1000 })`, or runs the sweep synchronously
if that API is missing. It ignores `timeRemaining()` and `didTimeout`. The
sweep scans the whole queue and dispatches **one** `GC` action for everything
eligible. A candidate is eligible when unreferenced and past:

```text
max((expiresAt - fetchedAt) * expiryMultiplier, 120_000) + fetchedAt
```

`expiryMultiplier` defaults to `2`. This is deletion, separate from fetch
expiry (`dataExpiryLength`, invalidation, `expireAll`).

**Deleting.** The reducer's `case GC` deletes from `entities`, `entitiesMeta`,
`endpoints`, and `meta` **in place** and returns the **same state object**. It
does not touch `indexes` or `optimistic`.

**Hooks.** Read hooks call `countRef` in `useEffect`, so there is no reference
between render and the passive effect. `useSubscription` alone holds no
reference; `useLive` does, because it also reads.

**Defaults.** React `DataProvider` uses `GCPolicy`, and `NativeGCPolicy` on
React Native. Vue and a bare `Controller` use `ImmortalGCPolicy` unless one is
passed. `Controller` does not call `gcPolicy.init()`; providers do, via
`initManager`. Public knobs: `intervalMS`, `expiryMultiplier`, a custom
`expiresAt(meta)`, or a whole `GCInterface`. GC options are barely documented.

**React Native.** `NativeGCPolicy` uses `InteractionManager`, which React
Native 0.86 deprecates: `runAfterInteractions` is `setImmediate`, and
`setDeadline` is a no-op. The supported replacement is `requestIdleCallback`.
It is only a cooperative hint; once a callback starts, React Native cannot
preempt it.

**React commit timing.** Cache state lives in `useReducer`, through
`useEnhancedReducer` in `DataStore.tsx`. `usePromisifiedDispatch` resolves a
dispatch after its state commits, and `Controller.getState()` returns the last
committed snapshot, so it lags in-flight dispatches. Vue applies the reducer
synchronously inside `realDispatch`, so React's timing gaps do not
automatically apply to Vue.

## Confirmed gaps

### Synchronous, unbounded work

One sweep scans the full queue, and one reducer call deletes the full batch.
Idle scheduling only delays the start; it cannot interrupt the work. A large
queue can therefore drop frames. See [Baselines](#baselines) for sizes.

### Entities deleted under surviving results

Test: [`GCPolicy-dangling.ts`](../packages/core/src/state/__tests__/GCPolicy-dangling.ts)

A result written without a mounted consumer is never queued: `setResponse`,
prefetch, hydrated `initialState`, or a fetch nobody mounted. An entity it
names is still swept when another consumer releases that entity. List schemas
filter missing entities (`filterEmpty` in `schemas/Array.ts`), so the
surviving list silently shrinks. A surviving detail reads `undefined`. Both stay
`Valid`, so nothing refetches.

Those never-mounted results are also never collected themselves.

### Deleting a mounted consumer's data

Test: [`integration-garbage-collection-race.web.tsx`](../packages/react/src/__tests__/integration-garbage-collection-race.web.tsx),
passing on React 17, 18, and 19.

A sweep that runs after a consumer commits but before its `countRef` effect
sees a zero count and deletes the entity. Because the reducer returns the same
state object, nothing re-renders. The consumer shows stale data until an
unrelated update, then suspends and refetches. In an app this needs an idle
callback to fire between a non-sync commit and React's passive-effect flush.
How often that happens is unmeasured.

A related hypothesis did **not** reproduce on React 19.2: a GC update queued
ahead of a synchronous mount is applied in the same render, so the new
consumer suspends and refetches instead of losing counted data. A GC
dispatched at transition or idle priority is untested; a pure
`(state, action)` reducer cannot see a count incremented after the action was
queued.

### Leftover memory after deletion

- `state.indexes` keeps `indexes[key][indexName][value] = pk` rows. Deleting
  one row is cheap from the dying entity's field value (delete only if it
  still maps to that pk). Scanning every index is unbounded.
- `normalizr/src/memo/entitiesCache.ts` keeps a strong `Map` of key → pk →
  `WeakMap`. Values can be collected by JS GC, but the map entries cannot.

### Lifecycle

- `cleanup()` clears the interval but not an already scheduled idle callback.
- There is no memory bound, LRU, or entry limit. JavaScript has no portable
  retained-byte API, so a byte-precise policy is not realistic.

## Prior art

Checked against official docs (not source), 2026-07-18:

| Library            | What survives                                                                                                                          | Cost                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| RTK Query          | Whole document per endpoint+args; removed after `keepUnusedDataFor` (60s). Never collects an entity out from under a query.            | Duplicate copies; tag-driven refetch instead of normalization |
| Relay              | Retains queries and mark-sweeps records unreachable from them. A record a retained query references stays. Release buffer: 10 queries. | Needs explicit references and compiler-known selections       |
| Apollo `gc()`      | Traces from roots and keeps reachable objects.                                                                                         | Tracing cost                                                  |
| Apollo `evict(id)` | May leave dangling refs. Lists filter them, like our silent shrink; singular refs need a custom `read`.                                | Correctness is left to the app                                |

## Open decisions

1. **What is a GC root?** Per-consumer counts allow
   [entities deleted under surviving results](#entities-deleted-under-surviving-results).
   The alternatives are whole-document eviction (RTK Query, which gives up
   normalization), reachability from retained queries (Relay, Apollo `gc`), or
   accepting dangling refs (Apollo `evict`, today).
2. **When may GC change a React snapshot?** Immutable deletion committed
   alone renders. In-place mutation avoids the render but conflicts with
   concurrent reducer replay. Swapping in a prebuilt table on a later real
   update avoids an extra render but must stay off that update's critical
   path. Never collecting while idle retains memory. React Native may accept a
   standalone low-priority commit more readily than web.
3. **How is "still referenced" known at deletion time?** Options:
   - read live counts inside the GC reducer (impure, but closes the race);
   - count in `useLayoutEffect` instead of `useEffect`;
   - commit GC synchronously;
   - accept rare deletion of newly mounted data.

   Settle this with a concurrent-rendering test.

4. **What runs during interaction versus idle?** Unmount must stay cheap. Do
   not insert into a heavy structure, walk `Object.keys` of a large store, or
   delete inside the reducer on the critical path. One option is a cheap inbox
   drained later.
5. **Is the never-mounted leak in scope?** A periodic census, or enqueueing
   when data is written, would find never-mounted results. Enqueueing at write
   time taxes normalize.
6. **Index rows and memo map entries.** Clean them up as part of whichever
   deletion model is chosen, not bolted on first.
7. **Platform policy versus shared mechanism.** One option is shared
   correctness with per-platform cadence, retention, and whether idle commits
   are allowed. The other is a separate collector per platform.

## Candidate design: cooperative slicing

A prior draft. Not chosen. It mainly addresses
[synchronous, unbounded work](#synchronous-unbounded-work), and does not by
itself answer open decisions 1–3.

JavaScript cannot suspend synchronous work, so frame-safe collection needs
bounded, resumable units and a scheduler that runs them within a budget.

- **Bound scanning and deletion.** Make queue traversal resumable. Cap both
  candidates examined per slice and records deleted per action, by elapsed
  time and by count. Each single unit must also be bounded, including index
  cleanup.
- **A small internal scheduler, not a dependency.** It schedules slices,
  yields on time or count budgets, cancels pending callbacks, and allows
  deterministic tests. Avoid React's `scheduler`: it is `unstable_` and ties
  core to React. A `requestIdleCallback` loop must still do a small amount of
  work when it fires with `didTimeout` and no time left, or it can reschedule
  forever.
- **Keep the public surface small.** Keep `GCInterface` and provider
  injection. Keep budgets internal until real apps need public knobs.
- **Per-platform defaults.**

  | Concern     | Web                                          | React Native                                  |
  | ----------- | -------------------------------------------- | --------------------------------------------- |
  | Scheduling  | `requestIdleCallback` plus an async fallback | `requestIdleCallback` plus bounded units      |
  | Cadence     | Current 5 minutes                            | More frequent                                 |
  | Retention   | Current                                      | Unchanged until refetch and memory data exist |
  | Bundle cost | Strictly limited                             | Secondary to memory                           |

- **No default LRU.** It taxes every read and write, grows the bundle, and
  does not make eviction frame-safe.
- **Prerequisites** before collecting more often: deduplicate entity
  candidates, cancel pending slices, define behavior when a candidate is
  re-referenced before its deletion commits, bound index cleanup, and document
  provider defaults.

A disposable Node spike compared queue structures at 100k candidates (one
machine, 7 samples):

| Workload                   | Flat re-scan | Calendar buckets |
| -------------------------- | -----------: | ---------------: |
| 0% due                     |     ~11.5 ms |         ~0.01 ms |
| 10 ticks, mostly unexpired |      ~110 ms |          ~0.6 ms |
| 100% due                   |      ~7.8 ms |           ~25 ms |
| Insert 100k                |      ~5.9 ms |           ~30 ms |

Buckets win when little is due but cost more at insert time, which happens
during unmount. A min-heap was worse on time and memory. `Object.keys` over
~100k meta took ~4 ms and ~2.7 MiB. Resumable `for...in` slices of 256 took
~0.02 ms.

## Measuring

Three opt-in harnesses, not in CI, share one JSON report vocabulary but no
code:

| Harness                              | Command              | Measures                                                            |
| ------------------------------------ | -------------------- | ------------------------------------------------------------------- |
| Node, `examples/benchmark`           | `start:gc`           | Scan, reducer, and end-to-end totals                                |
| Chromium, `examples/benchmark-react` | `bench:gc`           | Input delay, frames, Long Tasks, heap                               |
| Android, `examples/benchmark-native` | `matrix` / `collect` | Release-Hermes frames and memory over `adb` (never run on a device) |

Each report is tied to a build manifest of source and artifact hashes; stale
or tampered reports are rejected. Harness-only policies disable the interval
and force expiry to zero so one sweep can be timed. They are fixtures, not
proposed defaults.

### Protocol

- **Scenario ID:** `platform` × `candidateKind` (`entity` | `endpoint` |
  `mixed`) × `pattern` (`unique` | `duplicate`) × `count` (1k, 10k, 100k) ×
  `mode` (`scan` | `reducer` | `end-to-end` | `interaction` | `memory`) ×
  `control` (`gc` | `no-gc`). The 100k run is the main one.
- **Timing window:** build fixtures before timing. Time only the cache-GC
  work, let the event loop settle, and force engine GC only for heap
  snapshots. Never confuse JS engine GC with cache GC.
- **Reports:** one aggregated JSON per run. Fields include `totalMs`, slice
  `max`/`p95`/`p99`, `actionCount`, deletions, and queue size, plus optional
  `maxInputDelayMs`, `missedFrames`, `displayPeriodMs`, Long Tasks, and heap.
  No per-candidate logging. Today's GC reports one slice and one action;
  never fabricate slices.
- **Calibration:** repeat on one host, alternate baseline and candidate
  builds, and always run `no-gc` beside `gc`. Judge frames by **excess** over
  the control against the measured `displayPeriodMs`, not a hardcoded 16.67 ms.
  Freeze thresholds only after variance is known.
- **Judgment order:** interaction and frame impact first; then total time and
  action count, which may rise under slicing; then web bundle delta (about
  1 KiB needs a 5–10% measured win); then React Native memory. Foreground
  `core` and React benchmarks must stay within noise.
- **Automation:** Jest covers logic only. Node and Chromium could become CI
  gates after CI variance runs. Android stays manual.

### Baselines

Captured 2026-07-18 on Linux WSL2, Node 24.5, headless Chromium 149 (~16.7 ms
display period), before the harness was committed. Single host, 3–5 samples:
evidence, not thresholds. Raw reports were local and are not in git.

Node, 100k, median / p95 `totalMs` (5 samples):

| Scenario         | Scan        | End-to-end  |
| ---------------- | ----------- | ----------- |
| entity unique    | 5.2 / 6.6   | 13.0 / 14.5 |
| endpoint unique  | 14.7 / 16.6 | 33.7 / 39.1 |
| mixed unique     | 9.0 / 9.9   | 21.1 / 21.5 |
| entity duplicate | 2.2 / 2.3   | 5.9 / 6.0   |

Chromium, 100k `gc`, medians (3 samples):

| Scenario         | `totalMs` | `maxInputDelayMs` | Heap delta |
| ---------------- | --------- | ----------------- | ---------- |
| entity unique    | 9.0       | 9.1               | −10.7 MB   |
| endpoint unique  | 16.7      | 16.8              | −15.0 MB   |
| mixed unique     | 13.5      | 13.5              | −12.8 MB   |
| entity duplicate | 6.8       | 6.8               | −0.4 MB    |

`no-gc` input delay was 0–0.1 ms. Long Tasks stayed at 0 because Chromium only
reports tasks of 50 ms or more. The endpoint sweep still uses about one full
60 Hz frame. A synthetic 45 ms block measured ~45.1 ms max frame interval and
2 missed frames, which confirms the frame probe works. `rdcClient.js` was
33.8 KiB minified (absolute size, not a delta).

### Rerun

```bash
# Node
yarn build:benchmark
yarn workspace example-benchmark start:gc /100000/ --samples=5 --no-table

# Chromium (preview must be serving dist/)
yarn build:benchmark-react
BENCH_GC_OUTPUT=/tmp/gc-browser.json yarn workspace example-benchmark-react \
  bench:gc --samples 3 --scenario 100000

# Android (needs a device and a release APK)
yarn workspace example-benchmark-native build:android:release
SAMPLES=5 yarn workspace example-benchmark-native matrix entity/unique/100000

# Foreground controls and bundle
yarn workspace example-benchmark start core '^get'
yarn workspace example-benchmark start core '^set'
yarn workspace example-benchmark-react bench:small --lib data-client
yarn ci:build:bundlesize
```

## Future work

- **Android on-device calibration.** Not planned soon. Without it there is no
  React Native frame or memory baseline, so do not change React Native GC
  defaults on Node or Chromium numbers alone. A design can land on web first.
  When this is picked up, run the release app on a named mid-range device
  (see `examples/benchmark-native/README.md`).
- **Benchmarks in CI.** Only after repeated CI runs show acceptable variance.
