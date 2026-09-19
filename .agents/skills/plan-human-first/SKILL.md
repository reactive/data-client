---
name: plan-human-first
description: Plan a library or app change by first writing down what a person must always/never see, verifying each such invariant against the baseline with labeled evidence, and bucketing them into already-satisfied / obvious / genuine-tradeoff so the critical decisions are made before any implementation. Use when planning SSR, streaming, caching, live-update, or concurrency work in Data Client, when a design has several candidate mechanisms, or when the user asks to "start from the user experience", "identify invariants", or "decide before implementing".
disable-model-invocation: true
---

# Plan human-first

## Overview

Produce one document that lets a staff engineer of unknown specialty make the critical decisions **before** anyone picks a mechanism. The deliverable is the decision document, not code. Stop when it is written; implementation planning is a later step that takes the recorded decisions as input.

Mechanisms proposed earlier (in PRs, spike reports, plan docs) are **candidates**, never premises. Evidence produced earlier by actually running something is **real** and must not be dismissed. Implemented designs may be thrown away if a better answer appears.

## Ground rules

1. **State every invariant as what a person sees.** "The Watchlist is clickable while the Book is still loading", never "the provider must not suspend on the snapshot". Explain or avoid every technical term; keep a short glossary.
2. **One running example, as simple as possible and no simpler.** A real page from a real example app (for Data Client work, prefer the most demanding one — the order-book app exercises streaming SSR, 10 updates/s, and the same number shown in several panels). Name its moving parts, where data repeats, and the measured timing range of each request.
3. **Variable timing is the thesis.** A behavior that depends on which request finishes first is not an invariant; it is a coin flip. One run is not a finding. An invariant holds only if it holds under *any* interleaving, on *every* supported host (Next.js/RSC and plain `renderToPipeableStream`; web, native, Vue where relevant).
4. **Baseline is `master` as published**, installed from npm into the example app and built for production. A dev server, a linked checkout, or a partially built branch is not the baseline; say which one you ran.
5. **Label every claim** with its evidence category (below). Never present an inference as a measurement or an idea as a finding.
6. **Dig into contradictions.** If a theory predicts one thing and a run shows another, test the theory (predict, then measure) and record the disproof. If it stays unresolved, it goes in "Open questions", not in the invariants.
7. **Storyboards, not prose,** for each invariant: a frame-by-frame table of what each part of the screen shows at a few moments, with a fixed legend.

### Evidence labels

| label | meaning |
| --- | --- |
| **[measured]** | run in this session; tool, environment, sample size, and the exact build stated |
| **[source]** | read from code; file named; describes what the code does, not how often an outcome happens |
| **[finding]** | earlier session ran something (PR comment, spike report, HANDOFF doc); treat as real |
| **[idea]** | earlier session proposed a design; a candidate only |
| **[inference]** | reasoning from the above; not observed |

## Workflow

Copy and track:

```
- [ ] 1. Context: GOALS.md, existing findings and idea docs, the example app, supported hosts
- [ ] 2. Running example + measured timings (production build of the npm baseline)
- [ ] 3. Enumerate candidate invariants through the human lenses
- [ ] 4. Verify each against baseline; note where the guarantee ends
- [ ] 5. Bucket: already satisfied / obvious / tradeoff
- [ ] 6. Order by dependency; options table for each tradeoff
- [ ] 7. Open questions, settled items, evidence index
- [ ] 8. Stop and present for decisions
```

**1. Context.** Read `GOALS.md` (it ranks which costs matter). Separate earlier documents into findings (real runs) and ideas (proposals). List every host/flavor the invariants must hold on.

**2. Running example.** Build the example app against the npm-published packages (`next build && next start`, or the host's production equivalent). Measure request latencies and their chaining (which requests can only start after another returns). Record raw-stream timing (a small script reading the HTTP body chunk by chunk) and real-browser behavior (Playwright with the system Chrome: network requests, console). Vary inputs so caches do not mask timing; check inputs are valid (a delisted symbol produces an error page that looks like a streaming outcome). Run at least 10 valid loads before quoting a frequency; report min/median/max and counts, not one number.

**3. Enumerate through these lenses** (each yields invariants; drop the ones that do not apply):

- first paint: what appears when, what never blocks what
- becoming interactive/live: per part, not per page
- live updates: never backwards, never half-applied, only what changed repaints, no stutter
- the same data in several places: identical at the same instant
- takeover of server-painted content: no flicker, no restart of a still-loading neighbor
- data already delivered: never requested again
- navigation and coming back: what stays on screen, what is stale and for how long
- failures and slow paths: rate limits, timeouts, partial responses
- older platform versions: what degrades, labeled
- users who do not use the feature: pay nothing (bundle, runtime)

**4. Verify each** on the baseline. For every invariant record: evidence line(s) with labels, and a **Boundary** sentence stating exactly where the guarantee stops (this is usually where the next bucket begins). When the baseline outcome varies, tabulate the distinct outcomes with frequency and what the person sees in each; do not collapse them into "usually fine" or "broken".

**5. Bucket.**

- **Bucket 1 — already satisfied on baseline.** Holds under any timing today.
- **Bucket 2 — obvious addition, no tradeoff.** Not satisfied today; satisfying it costs the person nothing. Implementation difficulty is *not* a tradeoff; note the hard mechanism question and keep the invariant here.
- **Bucket 3 — genuine tradeoff.** Satisfying it costs the person something elsewhere (a delay, a duplicate request, a stale number, an annotation the author must keep correct). Usually rooted in something the system *cannot distinguish* (e.g. "data is still coming" vs "data will never come").

**6. Order and options.** Within each bucket, order so each item can be closed before the next: foundations first in Bucket 1; in Bucket 3 the decision that determines whether later decisions exist comes first, and each entry names what depends on it. Each Bucket 3 entry gets an options table with columns: option, what the person sees in each affected case, authoring cost; plus a storyboard comparing the two leading options. Include options from earlier ideas as rows, labeled [idea], alongside options nobody has proposed yet. Do not recommend; the reader decides.

**7. Close out.** Sections for: open questions and contradictions (with what was tried), items settled by earlier work (so they are not re-argued unless wanted), and an evidence index (paths to scripts, raw results, source files, findings).

**8. Stop.** Present the document. Do not begin an implementation plan until the Bucket 3 decisions are recorded.

## Output

Use [template.md](template.md) for the document skeleton, storyboard legend, and worked snippets. Keep the document in the project's planning store or `docs/` as directed; it is user-facing.

## Pitfalls seen in practice

- Stating one measurement as an invariant ("master does not stream before data") when the outcome was timing-dependent; the correct statement tabulated three outcomes with frequencies.
- Asserting a mechanism from source reading alone; the prediction was disproved by the next 12 runs. Predict, measure, then claim.
- Counting error pages as a streaming outcome because the input was invalid.
- Measuring a dev server linked to a local checkout and calling it baseline.
- Filing "hard to build" under tradeoffs; the person pays nothing, so it is Bucket 2 with a mechanism note.
- Letting an earlier plan's mechanism (deltas, waiters, overlays) leak into the invariant wording.
