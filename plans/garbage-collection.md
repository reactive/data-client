# Garbage Collection Direction

Status: draft
Owner: TBD
Related: [GOALS.md](../GOALS.md), `packages/core/src/state/GCPolicy.ts`

## Priorities

Garbage collection must follow the project-wide performance goals and the
platform priorities adopted for this work:

1. Preserve a continuous 60 FPS experience on mid-range hardware. Collection
   must not create blocking stutters during critical updates or interactions.
2. For this work, web prioritizes bundle size before retained cache memory.
3. For this work, React Native prioritizes retained memory before bundle size.
4. Continue minimizing network work. More aggressive collection can cause
   refetches, so lower memory use is not automatically a net performance win.
5. Keep the default path understandable, dependency-light, and portable across
   React, React Native, Vue, and imperative `Controller` use.

These priorities imply different platform defaults or adapters over one shared
correctness model. They do not imply different endpoint or schema definitions.

## Current system

The current policy is reference-counted and age-gated:

1. Read hooks obtain a `countRef` from `Controller.getResponseMeta()` or
   `Controller.getQueryMeta()`.
2. Mounting increments references for the endpoint key and every entity path
   used by the denormalized result.
3. Releasing the last reference queues those endpoint and entity candidates.
4. By default, every five minutes, `GCPolicy` schedules a sweep.
5. A queued candidate is eligible when it is still unreferenced and its GC
   expiry has passed.
6. One `GC` action deletes all eligible endpoint results, entities, and their
   metadata in place.

The default GC expiry is:

```ts
max((expiresAt - fetchedAt) * expiryMultiplier, 120_000) + fetchedAt
```

`expiryMultiplier` defaults to `2`. This is deletion policy, not fetch expiry:
staleness and invalidation may cause a refetch without removing normalized data.

The policy currently exposes:

- `intervalMS`
- `expiryMultiplier`
- a custom `expiresAt(meta)` function
- complete replacement through `GCInterface`
- `ImmortalGCPolicy` for no automatic deletion

React `DataProvider` installs `GCPolicy` by default. Its React Native build
substitutes `NativeGCPolicy`. A bare `Controller` and the Vue provider currently
fall back to `ImmortalGCPolicy` unless a policy is supplied. Imperative use must
also own policy lifecycle: constructing a `Controller` with a `GCPolicy` does
not call `init()` or `cleanup()`; providers do that through `initManager`.

There is no LRU, maximum entry count, or retained-byte limit.

## Current limitations

### Unbounded synchronous work

`runSweep()` scans the complete endpoint and entity candidate queues. It then
dispatches every eligible deletion in one action, whose reducer synchronously
deletes the complete batch. Both phases are unbounded.

Idle scheduling only changes when this monolithic work begins. It does not make
the work interruptible. On web:

- `requestIdleCallback(..., { timeout: 1000 })` may run because the timeout
  elapsed even when no meaningful idle budget remains.
- The fallback runs the complete sweep synchronously.
- The callback ignores `IdleDeadline.timeRemaining()` and `didTimeout`.

A sufficiently large queue can therefore produce a long task and dropped
frames.

### React Native scheduling is deprecated and unbounded

`NativeGCPolicy` uses `InteractionManager.runAfterInteractions()` and
`InteractionManager.setDeadline()`. In React Native 0.86, `InteractionManager`
is deprecated, `runAfterInteractions()` is implemented using `setImmediate()`,
and `setDeadline()` is a no-op. It defers a sweep but does not protect an active
interaction or bound the resulting task.

React Native 0.86 officially recommends refactoring long tasks into smaller
units and scheduling them with `requestIdleCallback()`. That is the supported
migration path and should be the native host primitive. It remains a
cooperative idle hint, not a frame-safety guarantee: once a callback or one GC
unit starts, React Native cannot preempt it. The GC must therefore enforce its
own bounded units, elapsed-time/count budgets, yielding, and cancellation.

### Candidate queue amplification

Endpoint candidates use a `Set`, but entity candidates use an array. Repeated
mount/release cycles can queue the same entity multiple times before it becomes
eligible, increasing retained queue memory and future sweep work.

### Incomplete deletion

Entity GC removes `entities` and `entitiesMeta` entries but does not remove
corresponding entries from `state.indexes`. This retains stale mappings and
some memory. Correct index cleanup needs a bounded design: blindly scanning all
indexes while deleting one entity could itself create an unbounded unit.

### Lifecycle and race gaps

- `cleanup()` cancels the interval but not an already scheduled idle callback.
- Eligibility is checked before dispatch. A store integration with asynchronous
  dispatch can reacquire a candidate before its deletion is reduced.
- Hook references are installed in effects, leaving a render-to-effect window.
- A subscription by itself does not hold a GC reference. `useLive`, which also
  reads the result, normally does.

These need explicit invariants and tests before making collection more
aggressive.

### Memory cannot be bounded

Age-based collection gives no hard upper memory bound. Active data is retained,
and unreferenced data remains until both its retention threshold and a sweep
pass. JavaScript also lacks a portable, reliable retained-byte measurement API,
so a byte-precise cross-platform policy is not currently realistic.

### Configuration and documentation are inconsistent

React enables GC automatically, while Vue and direct `Controller` usage do not.
The provider option and policy settings have little public documentation. The
behavior should be made deliberate and documented before adding more profiles.

## Cooperative collection model

JavaScript cannot suspend arbitrary synchronous work. Frame-safe collection
requires the algorithm to expose bounded, resumable units and the scheduler to
run those units within a budget.

The reusable part is a small internal scheduling shell:

- schedule another slice;
- decide when the current slice should yield;
- cap elapsed time and work count;
- make progress after prolonged starvation;
- cancel pending callbacks;
- provide platform-specific scheduling;
- allow deterministic test scheduling.

The GC-specific part owns:

- candidate traversal state;
- expiry and reference validation;
- deduplication;
- construction of bounded deletion batches;
- revalidation around dispatch;
- bounded index cleanup.

For the current implementation, a natural scan unit is checking one endpoint
or entity candidate. Deleting one entity and its metadata is a plausible
mutation unit, but index cleanup is not yet naturally bounded: the current GC
action carries only the entity type and primary key, while `GCPolicy` has no
schema/index-name information. The index design must prove how relevant work is
identified, resumed, and bounded without scanning every index in one step. A
slice should process multiple proven-bounded units only while both time and
count budgets remain.

This is not graph reference-counting GC. Entities do not own references to their
children, entity deletion does not decrement child references, and there is no
cascading traversal. Consumer reads independently retain all entity paths used
by a denormalized result. Any future graph ownership model would be a separate,
much larger semantic change.

## Direction

### 1. Bound scanning and deletion

Make candidate traversal resumable and cap both:

- candidates examined per slice; and
- records deleted per dispatched action.

Time budgets adapt to device speed, while count limits protect against timer
quirks and unexpectedly expensive batches. A single unit must also remain
bounded; the scheduler cannot compensate for one deletion that scans an entire
store or synchronously notifies unbounded work.

### 2. Use a small internal cooperative scheduler

Prefer a small internal executor over a runtime dependency:

- React's `scheduler` package exposes `unstable_` APIs and would couple core
  data behavior to a React implementation package.
- generic coroutine or iterator dependencies do not identify domain-specific
  safe yield boundaries;
- the required scheduling shell is small compared with the GC correctness
  logic;
- avoiding a dependency protects bundle size and wide platform compatibility.

The scheduler should remain internal initially. Deterministic tests should use
a private test factory or internal host adapter. Constructor injection or a new
protected hook on exported `GCPolicy` would still become observable public and
subclass surface even if `GCInterface` remained unchanged.

Do not copy a `requestIdleCallback` loop without handling starvation. When a
callback fires with `didTimeout` and no remaining idle time, the executor must
still perform a tightly bounded amount of work before yielding again; otherwise
it can reschedule forever without progress.

### 3. Keep the public policy seam small

Preserve `GCInterface` and provider/controller injection. Begin with internal
scan, deletion, and time budgets selected by benchmarks. Add public
`GCOptions` controls only if concrete application needs demonstrate stable,
understandable semantics beyond platform defaults.

Scheduling strategy, callback handles, continuation state, and platform host
APIs should not become endpoint, schema, or hook configuration.

### 4. Use platform-specific policy defaults

Initial target profiles:

| Concern | Web | React Native |
| --- | --- | --- |
| Scheduling | Browser `requestIdleCallback` with yielding async fallback | React Native `requestIdleCallback` with explicit bounded units |
| Slice size | Conservative | Conservative, validated on mid-range Android |
| Sweep cadence | Current five-minute baseline | More frequent candidate processing |
| Retention | Current baseline | Start unchanged; lower only with refetch and memory evidence |
| Memory pressure | Optional/manual aggressive collection | Research optional application/native bridge |
| Bundle cost | Strictly constrained | Secondary to measured retained-memory improvement |

An aggressive collection request may shorten retention but must never override
an active reference. Platform profiles should be thin adapters or options, not
LRU logic on every cache access.

### 5. Do not add default LRU bookkeeping

LRU or hard entry limits add work to hot reads/writes, increase bundle size,
and do not make eviction itself frame-safe. They also use entry count or recency
as weak proxies for actual memory. Keep such policies optional unless measured
applications demonstrate that age-based cooperative collection is insufficient.

### 6. Fix correctness and lifecycle gaps

Before increasing collection frequency:

- deduplicate entity candidates;
- cancel pending scheduled slices;
- define reacquisition behavior through deletion commit;
- make index cleanup correct and bounded;
- test effect/subscription lifecycle behavior;
- reconcile and document provider defaults.

## Evaluation of scheduler alternatives

The cooperative-scheduling proposal contributes several useful conclusions:

- the scheduling shell and yield boundaries are separate concerns;
- an arbitrary synchronous sweep cannot be made interruptible by wrapping it;
- a queue already provides continuation state;
- cancellation, starvation behavior, and per-slice elapsed-time caps belong in
  the scheduler;
- a single step must be bounded;
- an internal executor is preferable to React's unstable scheduler dependency.

It does not change the overall direction of bounded cooperative GC. It sharpens
the design by favoring a reusable internal scheduling shell instead of embedding
platform timing directly into `runSweep()`.

Parts that require qualification or do not transfer directly:

- `requestIdleCallback` is React Native's supported migration path from
  `InteractionManager`, but it cannot by itself guarantee frame safety. The
  supplied executor is safe only if every `task.step()` is bounded and its
  continuation yields as designed.
- Its loop can starve when a timeout fires with no `timeRemaining()`, because it
  performs no mandatory bounded step.
- The proposed child-reference decrements and cascading deletion describe graph
  GC, not the current consumer-reference model.
- A `CooperativeTask`/`CooperativeScheduler` public interface is unnecessary at
  this stage. Keeping it internal avoids premature API and bundle commitments.
- Scheduling one candidate at a time is insufficient if the eventual reducer
  still receives and deletes an unbounded batch; scanning and mutation must
  both be sliced.

## Validation gates

Before changing defaults, establish a measurement protocol and calibrate it
against the current monolithic GC. Exact time, count, cadence, and retention
defaults remain open until variance is measured. The gates below freeze *how*
we measure; they do not invent pass/fail numbers yet.

### Measurement layers

Measurement is layered. v1 uses three harnesses with one shared documented JSON
vocabulary and **no** shared runtime package or dependency in this phase:

| Layer | Runtime | Role |
| --- | --- | --- |
| Node | Node.js | Stable, repeatable totals, slice summaries, action/queue cardinality |
| Browser | Chromium | Long tasks, interaction latency, heap snapshots, bundle-adjacent checks |
| Android | Release Hermes | Mid-range device frame stalls and retained memory under navigation/gestures |

Each harness may keep a local typed mirror of the result schema. Emitted JSON
must conform **semantically** to the shared vocabulary; cross-harness type
sharing is explicitly out of scope for this phase.

### Scenario axes

Every run is identified by a stable, deterministic scenario ID derived from:

| Axis | Values |
| --- | --- |
| `platform` | `node` \| `browser` \| `android` |
| `candidateKind` | `entity` \| `endpoint` \| `mixed` |
| `pattern` | `unique` \| `duplicate` |
| `count` | Canonical `1000`, `10000`, `100000` |
| `mode` | `scan` \| `reducer` \| `end-to-end` \| `interaction` \| `memory` |
| `control` | `gc` \| `no-gc` |

IDs must be stable across machines and commits so medians can be compared. The
canonical large gate remains at least 100,000 queued candidates; smaller counts
exist for calibration and CI cost control.

### Lifecycle boundaries

Timing windows are explicit. Never conflate V8/Hermes **engine** GC with
data-client **cache** GC.

1. **Prepare** — build the fixture and queue outside the timed window.
2. **Warmup** — optional; not part of reported totals when used.
3. **Timed cache-GC work** — the measured collection (or no-op control).
4. **Event-loop settling** — allow queued microtasks/macrotasks to drain before
   interaction or heap observations that depend on quiescence.
5. **Forced engine GC** — only after interaction timing, and only when taking
   heap snapshots. Engine GC pauses are optional metrics, not substitutes for
   cache-GC slice timing.
6. **Teardown** — discard fixture state; do not include in samples.

### Aggregated result vocabulary

Each run emits one aggregated JSON report. Units are explicit in field names or
documented once per schema version. Do **not** log, mark, or bridge per
candidate; instrumentation cost must not dominate the work being measured.

Core fields:

- `schemaVersion`
- commit / build label
- environment fingerprint (runtime, OS, device class as available)
- scenario descriptor (the axes above)
- `samples` and `summary`

Core metrics:

- `totalMs`
- optional `sliceDurationsMs`-derived `max` / `p95` / `p99`
- `actionCount`
- targets / deletions
- queue cardinality

Optional platform metrics (when the harness can collect them):

- `maxInputDelayMs`
- `missedFrames`
- `displayPeriodMs`
- `longTaskCount` / `longTaskTotalMs`
- `heapBefore` / `heapAfter` / `heapDelta`
- `engineGCPauseMs`
- artifact sizes (for example heap snapshot or trace bytes)

### Honest representation of monolithic GC

The current implementation is one unbounded scan plus one deletion action for
eligible candidates. Reports must represent that honestly:

- normally **one** timed slice and **one** deletion action;
- do **not** fabricate per-candidate or synthetic slice samples.

When a future cooperative implementation lands, slice boundaries may come from
**benchmark-internal** instrumentation only. This measurement phase does not
add a new public GC API solely to expose slice markers.

### Fixture setup

Fixtures are deterministic:

- fixed seed / data generation;
- `expiresAt` overridden to zero so queued candidates are immediately eligible;
- timerless explicit benchmark policy (no five-minute interval driving the run);
- **unique** pattern: distinct endpoint keys or entity `key`+`pk` pairs;
- **duplicate** pattern: repeat one candidate and report queue entries versus
  unique targets.

Self-validation after each run verifies expected queue cardinality and final
deletion count before the report is accepted.

### Calibration

1. Establish the current monolithic baseline **before** cooperative
   implementation changes land.
2. Repeat runs on the same machine or device; compare medians for totals and
   `p95` / `p99` / `max` for stalls.
3. Alternate baseline and change builds on the same host to reduce drift.
4. Always include a `no-gc` control alongside `gc`.
5. Frame judgment uses measured `displayPeriodMs` and **excess** stalls over the
   control — not a hardcoded 16.67 ms assumption.
6. Raw machine reports are **artifacts**, not committed universal baselines.
7. Exact pass thresholds freeze only after measured variance is known.

### Gate priorities

Order of judgment when trade-offs appear:

1. **Interaction / frame impact** is the primary hard gate. Prove that
   input/timer callbacks can execute between collection slices; measure browser
   long tasks, interaction latency, and React Native JS/UI frame stalls on
   mid-range Android during navigation and sustained gestures.
2. **Total collection time** and **action count** may rise under cooperative
   slicing within calibrated ceilings. Report worst slice duration, total
   duration, and deletion action count.
3. **Web bundle delta** is next (`yarn ci:build:bundlesize`); any increase needs
   a measured interaction-latency justification.
4. **React Native retained memory** is next; measure heap during mount/unmount
   churn and continuous entity updates where the harness supports it.
5. **Network / refetch impact** from cadence or retention changes is deferred.
   This measurement phase does not change those defaults.

Also required before aggressive default changes:

- Jest coverage for reacquisition, cancellation, duplicate candidates, index
  reuse, and starvation behavior (logic only; see automation boundary).
- Existing core and React benchmark suites remain within noise for foreground
  reads and writes.

### Automation boundary

| Class | Examples | Automation |
| --- | --- | --- |
| Stable | Node totals; Chromium interaction/long-task runs after calibration | Eligible as CI gates once variance and thresholds exist |
| Expensive / device | Heap snapshots; release-Hermes Android frame and memory | Start as manual; promote only with cost justification |
| Unit tests | Jest correctness for GC policy and reducer behavior | Required for logic; **not** a substitute for idle or frame measurement |

### Implemented harnesses and artifacts

v1 measurement harnesses exist in the monorepo (shared JSON vocabulary; no shared
runtime package):

- **Node** — `examples/benchmark` (`start:gc`): scan / reducer / end-to-end modes
  over the canonical scenario axes, with `gc` / `no-gc` controls.
- **Browser** — `examples/benchmark-react` (`bench:gc`): Chromium interaction,
  long-task, frame-period, and heap-delta collection for the same axes.
- **Android** — `examples/benchmark-native`: release-Hermes interaction / frame /
  observational memory runs on device; host matrix/collect scripts pull reports
  over adb. Build and unit validation can pass without a device; device runs are
  still required for calibration.

Aggregated schemaVersion-1 JSON reports are generated artifacts (stdout redirect,
`BENCH_GC_OUTPUT`, or the native artifacts path). Optional traces/heap snapshots
stay local. Raw machine reports and calibration notes are not committed as
universal baselines — see Baseline capture below for current host status and
rerun commands.

### Baseline capture and gate status

Captured **2026-07-18** on Linux WSL2 x64, Node v24.5.0, headless Chromium 149
(~16.7 ms measured display period). Numbers below are from **full provenanced
reruns** tied to BuildManifest IDs. Raw reports remain local `/tmp` (and native
sidecar) ignored artifacts — not committed universal baselines.
`dirty=true` is expected: the measurement implementation is still uncommitted;
manifest `buildId` / source / artifact hashes still make those local reports
attributable. This measurement-phase work does **not** change GC production
defaults.

**What ran successfully**

- ReactDOM GC policy / `countRef` / web integration: 3 suites, 10 tests passed;
  ReactNative GC integration: 1 suite/test passed.
- Provenanced Node and browser 100k matrices (manifests below).
- Core `^get` / `^set` and React browser small hot-path controls (output retained
  in local artifacts; passed).
- `yarn ci:build:bundlesize` completed (`rdcClient.js` 33.8 KiB minified absolute
  size — a build baseline, not a branch delta).
- Native release assemble + sidecar verification (manifest below). No adb device
  attached → **no** Android frame/memory baseline.

**BuildManifest provenance**

| Layer | Status | Identity |
| --- | --- | --- |
| Node | complete (100k matrix) | `buildId` `5da8f199371b9c84fe516700e977386f39267009ca6eae05ed5c0c16427d7a1c`; commit `4a2faa52558eb593e6e1121e2301a6bb8410690c`; `dirty=true` |
| Browser | `complete=true` | `buildId` `1d71ad58789bb9ac78d6fd0aa59259e59ebe8915bd9102a55bfd7086c54c0bce`; same commit; `dirty=true` |
| Native | build only (no device) | `buildId` `4a744c2e08acd490161a61b6d2c69a7d718af694e5b7b9775ec27c2ef56a006d`; `sourceDigest` `fab95578c64693c89f767e7fc7378fc8c8c81168174161641f251c79685672b7`; APK sha `fbc7355b4eb168f4dbce8dc837ae697a6e0d2fc908a5479fe2897e46d5f23949`; size 52,247,736 bytes; sidecar verified |

**100k Node median / p95 `totalMs` (samples=5)**

| Scenario | scan | end-to-end |
| --- | --- | --- |
| entity unique | 5.247 / 6.571 | 12.991 / 14.467 |
| endpoint unique | 14.745 / 16.633 | 33.691 / 39.094 |
| mixed unique | 8.961 / 9.859 | 21.113 / 21.527 |
| entity duplicate | 2.242 / 2.280 | 5.911 / 5.992 |

**Browser 100k `gc` medians (3 samples, `complete=true`)**

| Scenario | `totalMs` | `maxInputDelayMs` | notes |
| --- | --- | --- | --- |
| entity unique | 9.0 | 9.1 | `heapDelta` −10,704,036 B |
| endpoint unique | 16.7 | 16.8 | `frameIntervalMax` 17.7 ms; `heapDelta` −15,031,404 B |
| mixed unique | 13.5 | 13.5 | `heapDelta` −12,755,312 B |
| entity duplicate | 6.8 | 6.8 | `heapDelta` −433,492 B |

Matching `no-gc` `maxInputDelayMs` controls were 0–0.1 ms. All 100k runs reported
0 Long Tasks and 0 nearest-period `missedFrames`. Long Tasks only fire at ≥50 ms,
so they miss a sweep that still consumes roughly one 60 Hz frame budget — visible
in endpoint unique `maxInputDelayMs` ≈ 16.8 ms versus the ~16.7 ms measured
period. A synthetic 45 ms calibration reported ~45.1 ms max frame interval and
2 missed frames, confirming the pending-frame probe.

**Frozen gate definitions (not unsupported universal numbers)**

1. **Correctness** — fixture self-validation of queue cardinality and final
   deletion count; Jest coverage for reacquisition, cancellation, duplicates,
   index reuse, and starvation.
2. **Primary interaction comparisons** — GC **excess** over the matching `no-gc`
   control for `maxInputDelayMs`, missed frames, and long tasks. Frame budget
   uses measured `displayPeriodMs`, not a hardcoded 16.67 ms.
3. **Cooperative ceilings** — max-slice and total-overhead numeric limits remain
   calibration outputs. One local host with 3–5 samples is insufficient to freeze
   universal thresholds.
4. **CI promotion** — Node/browser may become gates only after repeated controlled
   CI variance runs; not claimed yet.
5. **Bundle** — repo rule unchanged: ~1 KiB growth must justify a 5–10% relevant
   measured win.
6. **Android** — uncalibrated. Any React Native **default** change stays blocked
   until release-Hermes runs on a named mid-range physical device under this
   protocol. Harness/APK completion is not device validation.

**Recommended reruns**

```bash
# Node 100k gc + no-gc
yarn build:benchmark
yarn workspace example-benchmark start:gc /100000/ --samples=5 --no-table

# Browser 100k (preview must be serving dist/)
yarn build:benchmark-react
BENCH_GC_OUTPUT=/tmp/gc-browser.json yarn workspace example-benchmark-react \
  bench:gc --samples 3 --scenario 100000

# Native 100k gc + no-gc (requires adb device + release APK)
yarn workspace example-benchmark-native build:android:release
SAMPLES=5 yarn workspace example-benchmark-native matrix entity/unique/100000

# Foreground controls
yarn workspace example-benchmark start core '^get'
yarn workspace example-benchmark start core '^set'
yarn workspace example-benchmark-react bench:small --lib data-client

# Bundle
yarn ci:build:bundlesize
```
