# Garbage collection handoff

Status: handoff for a new agent. Design is **not** decided.
PR: https://github.com/reactive/data-client/pull/4034
Branch: `demo/gc-benchmark-harnesses`

The next agent should reach its own conclusion about the best GC design.
Recommendations in this file, in [garbage-collection.md](./garbage-collection.md),
and in the prior chat are **hypotheses and evidence**, not instructions.
`plans/garbage-collection.md` sections titled Cooperative collection model,
Direction, and Evaluation of scheduler alternatives are a prior agent's draft.
Do not implement them because they are written down.

## 1. User intent and goals

The user wants a GC policy for `@data-client` that can trade interaction
latency, bundle size, and retained memory differently on web and React Native.

Stated priority order:

1. **Interaction latency.** No dropped frames during critical updates. A
   continuous 60 FPS experience on mid-range hardware, including while
   collection runs. [GOALS.md](../GOALS.md) separately ranks networking as
   the most expensive cost, then 60 FPS, then bundle size. For this GC work
   the user put interaction first, and treated extra refetches as a reason
   not to collect more aggressively just to save memory.
2. **Web:** bundle size, then retained memory.
3. **React Native:** retained memory, then bundle size. Bundle size barely
   matters on RN. Memory matters much more than on web.
4. The two platforms should be able to choose different points on that
   tradeoff. Endpoint and schema definitions should stay shared.
5. More aggressive deletion can cause refetches. Lower memory is not
   automatically a win.

Constraints the user stated while reviewing options. These are preferences to
weigh, not a finished architecture:

- React's built-in reducer is intentional. It exists to support concurrent
  rendering in React 19 and later. Do not replace it with an external store
  merely to make GC easier.
- Reference counts and other GC bookkeeping should stay **outside** rendered
  React state. State that drives rendering should not update on every
  mount/unmount.
- If GC does not change anything a mounted consumer renders, it should not by
  itself be an operation that triggers a React render.
- The user asked whether attaching GC work to a later reducer update would slow
  that update, and whether an update is unchanged when nothing is reclaimable.
  Those questions are open design constraints, not approvals of a piggyback
  design.

The user asked the previous agent to measure current behavior before changing
defaults, including an on-device React Native benchmark app. That measurement
harness is this PR. It is not a decision to ship cooperative slicing, calendar
queues, or any other collector.

## 2. Verified information

### Current production GC

Verified by reading current source on this branch (production GC is unchanged
by the PR):

- [packages/core/src/state/GCPolicy.ts](../packages/core/src/state/GCPolicy.ts)
  reference-counts endpoint keys and entity paths. Last release queues the
  candidate. Endpoint keys use a `Set`. Entity paths use an array, so the
  same entity can be queued more than once. A `setInterval` (default 5
  minutes) calls `idleCallback`, which runs `runSweep` via
  `requestIdleCallback` or **synchronously** if that API is missing. The
  sweep scans the whole queue and dispatches **one** `GC`
  action. Eligibility is unreferenced plus
  `fetchedAt + max((expiresAt - fetchedAt) * expiryMultiplier, 120_000)`,
  default multiplier `2`.
- [packages/core/src/state/reducer/createReducer.ts](../packages/core/src/state/reducer/createReducer.ts)
  `case GC` deletes `entities`, `entitiesMeta`, `endpoints`, and `meta`
  **in place** and returns the **same state object**. It does not touch
  `indexes` or `optimistic`.
- React read hooks install `countRef` in `useEffect`, for example
  [packages/react/src/hooks/useSuspense.ts](../packages/react/src/hooks/useSuspense.ts).
  There is a render-to-passive-effect window with no reference.
  `useSubscription` does not call `countRef`. A subscription alone does not
  retain cache data unless a read hook does.
- React `DataProvider` defaults to `GCPolicy`. Vue and a bare `Controller`
  default to `ImmortalGCPolicy` unless a policy is passed. `Controller`
  construction does not call `gcPolicy.init()`; providers do that through
  `initManager`.
- [packages/react/src/state/GCPolicy.native.ts](../packages/react/src/state/GCPolicy.native.ts)
  still schedules with `InteractionManager`. In the repo's React Native 0.86
  install, `Libraries/Interaction/InteractionManager.js` implements
  `runAfterInteractions` with `setImmediate` and `setDeadline` as a no-op,
  and the module is deprecated. RN's own deprecation text says to use
  `requestIdleCallback`. The user corrected an earlier claim: RIC is the
  supported migration path, but it is a cooperative hint. Once a callback
  starts, RN cannot preempt it.
- Fetch expiry (`dataExpiryLength`, invalidation, `expireAll`) is separate
  from physical deletion.

### React commit timing

Verified by reading:

- [packages/react/src/components/DataStore.tsx](../packages/react/src/components/DataStore.tsx)
  keeps cache state in `useEnhancedReducer` (`useReducer` plus middleware).
- [packages/use-enhanced-reducer/src/usePromisifiedDispatch.ts](../packages/use-enhanced-reducer/src/usePromisifiedDispatch.ts)
  queues the reducer update and resolves the dispatch promise in an effect
  after that state commits.
- `Controller.getState` is the committed snapshot copied into a ref from that
  effect, so it lags an in-flight dispatch.

Consequence, from that control flow: a GC action can be queued while
`useReducer` has not applied it. A later `countRef` increment updates only
the external `GCPolicy` maps. The already queued action still contains the
old deletion list. A **pure** `(state, action)` reducer cannot see that
later increment. A disposable state-machine probe under
`/tmp/data-client-gc-correctness-spike/` (not in git; may be gone) reported
that side-table vetoes and epoch tickets also fail if the reducer does not
read live policy state at apply time, and that a follow-up React action does
not help because the GC action is already ahead in the queue. Treat that
probe as supporting evidence for the control-flow reading, not as a shipped
test.

Committed tests on React 19.2 narrow that reading:

- **Queued GC ahead of a sync mount: did not reproduce.** A sweep dispatched
  at default priority followed by `flushSync` of a new consumer rendered both
  updates together. The consumer saw the entity already deleted, suspended,
  and refetched. That is a refetch, not deletion of counted data. Whether a
  transition- or idle-priority GC dispatch would be skipped by a mount
  render was not tested, nor were React 17/18 (disposable probe, not
  committed).
- **Sweep between commit and passive effect: reproduces deterministically.**
  [integration-garbage-collection-race.web.tsx](../packages/react/src/__tests__/integration-garbage-collection-race.web.tsx)
  sweeps from a sibling layout effect, after the consumer commits and before
  its `countRef` effect runs. The entity is deleted while the consumer is
  mounted and counted. Because `case GC` returns the same state object,
  nothing re-renders. The consumer shows stale data until an unrelated
  update, then suspends and refetches. In an app this needs an idle callback
  to fire between a non-sync commit and React's scheduled passive-effect
  flush. How often that happens is unmeasured. The test passes on React
  17.0.2, 18.3.1, and 19.2.3.

Vue's provider in
[packages/vue/src/providers/createDataClient.ts](../packages/vue/src/providers/createDataClient.ts)
applies the reducer inside `realDispatch` before the dispatch promise
resolves. The React gap is not automatically the Vue gap.

### Normalized deletion is visible

Verified in source:
[packages/endpoint/src/schemas/Array.ts](../packages/endpoint/src/schemas/Array.ts)
denormalizes with `.filter(filterEmpty)`. A missing entity becomes a shorter
array rather than an invalid result.

[GCPolicy-dangling.ts](../packages/core/src/state/__tests__/GCPolicy-dangling.ts)
drives real `GCPolicy`, `Controller`, and reducer. A result written without a
mounted consumer (`setResponse`, prefetch, hydration) is never queued, yet an
entity it names is swept when another consumer releases it. The surviving
list shrinks and the surviving detail reads `undefined`, both still `Valid`,
so nothing refetches.

### Memo and index residue

Verified in source:

- [packages/normalizr/src/memo/entitiesCache.ts](../packages/normalizr/src/memo/entitiesCache.ts)
  keeps a strong `Map` from entity key to pk to a `WeakMap`. Store GC does
  not delete those entries. Denormalized values hanging off entity-object
  identity can still be collected by JS GC; the map shells are not.
- Index writes in `NormalizeDelegate.handleIndexes` store
  `indexes[entityKey][indexName][fieldValue] = pk`. GC does not remove them.
  A correct delete of one mapping is possible from the dying entity's field
  value (`delete only if indexMap[value] === pk`). Scanning every index value
  is a different, unbounded design.

### What other caches do

Checked against current official docs, not against their source, on
2026-07-18:

- **RTK Query** stores a whole document per endpoint+args. It does not
  collect a nested entity out from under a surviving query. Unused queries
  are removed after `keepUnusedDataFor` (default 60s). Cost: duplicate
  copies and tag-driven refetch instead of normalization.
- **Relay** retains queries and mark-sweeps records unreachable from retained
  operations. A record referenced by a retained query stays. It needs
  explicit record references and compiler-known selections. Default release
  buffer is 10 queries.
- **Apollo `cache.gc()`** traces from roots and keeps reachable objects.
  Explicit `cache.evict(id)` may leave dangling refs. Default list reads
  filter those refs, which is the same silent-shrink behavior. Singular
  dangling refs need a custom `read`.

### Measurement evidence already collected

Host: Linux WSL2, Node v24.5.0, headless Chromium 149, display period about
16.7 ms. Numbers are single-host and small-sample. They are **not** universal
thresholds. Raw JSON was local `/tmp` output and is not in git. Build
manifests at the time were `dirty=true` because the harness was uncommitted;
those exact IDs will not match a clean checkout of this PR.

From the provenanced rerun recorded in
[garbage-collection.md](./garbage-collection.md):

- Node 100k end-to-end median `totalMs`: entity unique ~13 ms, endpoint
  unique ~34 ms, mixed unique ~21 ms, entity duplicate ~6 ms. One action,
  one slice.
- Chromium 100k `gc` median `totalMs` / `maxInputDelayMs`: entity unique
  9.0 / 9.1; endpoint unique 16.7 / 16.8; mixed unique 13.5 / 13.5; entity
  duplicate 6.8 / 6.8. Matching `no-gc` input delay was ~0–0.1 ms.
- Long Tasks stayed 0 because Chromium's threshold is about 50 ms. A
  synthetic 45 ms block through the browser probe reported ~45.1 ms max
  frame interval and 2 missed frames. The ~17 ms endpoint sweep therefore
  sits near one 60 Hz frame without tripping Long Tasks.
- Foreground `core` `^get` / `^set` and React small hot-path benches were
  run as controls and completed. They are not GC before/after comparisons.
- `yarn ci:build:bundlesize` completed. Reported `rdcClient.js` 33.8 KiB
  minified is an absolute size, not a delta caused by GC work. The harness
  is opt-in; production package behavior is unchanged.
- Android release assemble succeeded in that session (~50 MiB APK). **No
  device was attached.** There is no RN frame or memory baseline.

A later disposable scheduler spike
(`/tmp/data-client-gc-calendar-spike/`, not in git) compared structures at
100k candidates on one machine (7 samples, Node):

| Workload | Flat re-scan | Calendar buckets |
| --- | ---: | ---: |
| 0% due | ~11.5 ms, examines all | ~0.01 ms, examines none |
| 10 mostly-unexpired ticks | ~110 ms, ~991k examinations | ~0.6 ms, ~1k examinations |
| 100% due | ~7.8 ms | ~25 ms |
| Insert 100k | ~5.9 ms | ~30 ms |

`Object.keys` on ~100k meta was ~4 ms plus ~2.7 MiB. Warmed resumable
`for...in` slices of 256 were ~0.019 ms median. A min-heap was worse on both
time and memory in that spike. These numbers argue about scheduling cost
only. They do not choose a product design.

## 3. Status, remaining work, and open decisions

### Done

- Current GC behavior and its main limitations are documented.
- Opt-in Node, Chromium, and Android measurement harnesses exist on this PR,
  with provenance checks so a report is tied to a build manifest.
- Some local baselines exist. Android on-device numbers do not.
- Several designs were sketched and partly spiked. None is chosen.
- Characterization tests for silent shrink and the commit-to-passive-effect
  race (section 2). They assert current behavior; a design that fixes either
  should flip them.

### Not done

- No production `GCPolicy`, reducer, hook, or schema change.
- No CI job runs the new GC benchmarks.
- No physical Android calibration.
- No decision on ownership (per-consumer refs vs query reachability vs whole
  documents), scheduling, or how a deletion becomes a React snapshot.

### Decisions the next agent should make

Do not treat prior rankings as votes.

1. **What is a GC root, and what must remain intact?**
   Per-consumer entity paths can delete an entity that a surviving endpoint
   result still names. Whole-document eviction (RTK Query) avoids that by
   giving up normalization. Reachability from retained queries (Relay / Apollo
   `gc`) avoids it by keeping or tracing edges. Direct entity eviction (Apollo
   `evict`, and today's `GC` action) allows dangling refs and filtered lists.
2. **When may collection change a React snapshot?**
   The user does not want GC to render by itself if rendered output is
   unchanged. Immutable deletion still creates a new reducer state if it is
   committed alone. In-place mutation avoids the render and conflicts with
   concurrent reducer replay. Piggybacking a **prebuilt** table swap on a
   later real update avoids an extra render but must stay off the timed
   portion of that update. Doing nothing while idle retains memory. RN may
   value a standalone low-priority commit more than web does.
3. **How is "still referenced" known at the moment of deletion?**
   External counts plus a pure deferred reducer cannot observe an increment
   that happens after the action is queued. Options include: read live
   external counts inside the GC reducer (impure, closes the race), a
   synchronous commit, an urgent update that React is proven to rebase ahead
   of a pending transition, or accepting a rare deletion of newly mounted
   data. This needs a concurrent-rendering test, not another diagram.
4. **What runs during interaction vs idle?**
   Any design that inserts into a heavier structure during unmount, walks
   `Object.keys` of a large store on the critical path, or deletes inside the
   reducer can miss the 60 FPS goal even if the steady-state sweep is fast.
   The calendar spike says release-time bucket insertion was slower than a
   flat queue. A cheap inbox drained later is one hypothesis, not a
   requirement.
5. **Is the never-consumed leak in scope?**
   Hydrated `initialState`, `controller.set()`, and fetches nobody mounted
   never pass through decrement-to-zero, so today's queue never sees them.
   A census can find them. Write-time enqueue also can, and it taxes
   normalize. Whether this leak matters more than interaction cost is open.
6. **Index rows and memo map shells.**
   Both retain memory after entity deletion. Cleanup is likely justified if
   entity GC remains, but it should be designed with the deletion model, not
   bolted on first.
7. **Platform policy vs shared mechanism.**
   The user wants different web and RN tradeoffs. Shared correctness with
   different cadence, retention, and whether an idle commit is allowed is
   one shape. Different collectors is another. Bundle cost of the web default
   matters; RN bundle cost mostly does not.

### Suggested next evidence, not a required sequence

- Decide whether silent shrink is acceptable (it is now a committed test).
- Decide whether the commit-to-passive-effect window matters. Counting in a
  layout effect, or reading live counts when the GC reducer applies, are two
  ways to close it; neither is measured.
- If comparing schedulers, measure release/unmount cost and idle sweep cost
  separately, on the browser harness, not only in Node.
- Before any RN default change, run the release app on a named mid-range
  device. The harness is ready enough to do that; the numbers are not.
- Keep production GC unchanged until those results exist.

## 4. What this PR is

**Purpose:** let the next design be measured. It adds opt-in harnesses and
notes. It does not change `@data-client/core` GC behavior, public package
APIs, or default provider policy.

**In the PR, and hard in the sense that the user asked for measurement:**

- Node GC scenarios: `yarn workspace example-benchmark start:gc`
- Chromium GC scenarios: `yarn workspace example-benchmark-react bench:gc`
- Android release-Hermes app: `examples/benchmark-native`
- Build manifests so reports bind to source and artifact hashes
- CircleCI workspace trimming updated for the new workspace index

**In the PR, but exploratory:**

- Scenario vocabulary, slice/census ideas, and "direction" prose in
  [garbage-collection.md](./garbage-collection.md)
- Baseline tables. Useful local evidence. Not pass/fail gates.
- Harness-only policies (`BenchmarkGCPolicy`, `BrowserBenchmarkGCPolicy`,
  `AndroidBenchmarkGCPolicy`) that disable the interval and force expiry to
  zero so a sweep can be timed. They are fixtures, not proposed production
  defaults.
- Frame probes, Long Task filters, and nearest-period missed-frame math.
  They are measurement tools. A later design does not have to preserve them.

**Explicitly not decided by the user:**

- Cooperative slicing, calendar queues, censuses, reverse edges, memo
  `forget`, commit-time revalidation, private maintenance actions, or
  piggyback compaction.
- Changing Vue or bare `Controller` defaults.
- Promoting these benchmarks to CI.

### Branch state

PR #4034 is open against `master`. It was rebased onto the commits from
#4099, #4094, and #4093. Re-check CI on the rebased tip before treating the
harness as green on current master.

This handoff file does not change harness code.

### How to ignore the previous agent's preferences

Use the goals in section 1, the source facts in section 2, and the harness to
test whatever design you invent. If a prior recommendation conflicts with a
simpler design that still meets the goals, prefer the simpler design. Say so.
