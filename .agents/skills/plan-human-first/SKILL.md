---
name: plan-human-first
description: Plan a library or app change by first writing down what a person must always/never see, naming the runtime variables the real world will vary (timing, load, data shape, device, platform version, …) that every invariant must hold across, verifying each invariant against the baseline with labeled evidence, and bucketing them into already-satisfied / obvious / genuine-tradeoff so the critical decisions are made before any implementation. Use when planning a feature or redesign, when a design has several candidate mechanisms, or when the user asks to "start from the user experience", "identify invariants", "find the critical variables", or "decide before implementing".
disable-model-invocation: true
---

# Plan human-first

## Overview

Produce one document that lets a staff engineer of unknown specialty make the critical decisions **before** anyone picks a mechanism. The deliverable is the decision document, not code. Stop when it is written; implementation planning is a later step that takes the recorded decisions as input.

Mechanisms proposed earlier (in PRs, spike reports, plan docs) are **candidates**, never premises. Evidence produced earlier by actually running something is **real** and must not be dismissed. Implemented designs may be thrown away if a better answer appears.

## Ground rules

1. **State every invariant as what a person sees.** "The Watchlist is clickable while the Book is still loading", never "the provider must not suspend on the snapshot". Explain or avoid every technical term; keep a short glossary.
2. **One running example, as simple as possible and no simpler.** A real page or flow from a real example app, preferably the most demanding one the problem has. Name its moving parts, where data or state repeats, and the measured range of each critical variable on it.
3. **Name the critical variables, then hold across all of them.** Before listing invariants, write down which runtime conditions the real world will vary for this problem and the range each can take. An invariant holds only if it holds at *every* point of *every* critical variable, on *every* supported host. A behavior that depends on where in a variable's range a run happens to land is not an invariant; it is a coin flip. One run samples one point.
4. **Baseline is the released code**, installed as users install it (from npm) into the example app and built for production. A dev server, a linked checkout, or a partially built branch is not the baseline; say which one you ran.
5. **Label every claim** with its evidence category (below). Never present an inference as a measurement or an idea as a finding.
6. **Dig into contradictions.** If a theory predicts one thing and a run shows another, test the theory (predict, then measure) and record the disproof. If it stays unresolved, it goes in "Open questions", not in the invariants.
7. **Storyboards, not prose,** for each invariant: a frame-by-frame table of what each part of the screen shows at a few moments, with a fixed legend.

### Critical variables

Ask: *what will differ between two real users, or two loads by the same user, that the solution must not care about?* Common families; pick the ones that matter for the problem and drop the rest:

| family | examples | Data Client SSR/live-data instance |
| --- | --- | --- |
| timing and ordering | which request finishes first, chained requests, race between renderer and data layer, socket burst rate | the central variable: request latencies 0.6–1.2 s in either order, second wave starts only after the first, 10 updates/s after handoff |
| scale and load | concurrent users, list length, store size, update frequency | 8 concurrent mixed-symbol requests; 1000-level book |
| data shape | missing fields, partial responses, out-of-order or duplicate messages, invalid inputs | delisted symbols; partial ticker updates; book sequence gaps |
| topology | which parts share data, nesting/order of loading boundaries, where the provider sits | same ticker in three panels; provider in root layout vs route |
| environment | device speed, network quality, browser vs server, platform/framework version | React 18 vs 19; Next.js/RSC vs plain `renderToPipeableStream`; web vs native |
| user behavior | navigation mid-load, rapid input, coming back, backgrounding | switching symbols before the first symbol finished |

For each chosen variable record its measured or documented **range** and how you will **sample** it (vary inputs, repeat runs, force both orders, build a variant). Invariants and measurements are then judged against the full range, not a typical point.

### Evidence labels

| label | meaning |
| --- | --- |
| **[measured]** | run in this session; tool, environment, sample size, which points of which variables were sampled, and the exact build stated |
| **[source]** | read from code; file named; describes what the code does, not how often an outcome happens |
| **[finding]** | earlier session ran something (PR comment, spike report, handoff doc); treat as real |
| **[idea]** | earlier session proposed a design; a candidate only |
| **[inference]** | reasoning from the above; not observed |

## Workflow

Copy and track:

```
- [ ] 1. Context: goals doc, existing findings and idea docs, the example app, supported hosts
- [ ] 2. Critical variables: which ones matter here, their ranges, how to sample them
- [ ] 3. Running example + measured ranges (production build of the released baseline)
- [ ] 4. Enumerate candidate invariants through the human lenses
- [ ] 5. Verify each against baseline across the variables; note where the guarantee ends
- [ ] 6. Bucket: already satisfied / obvious / tradeoff
- [ ] 7. Order by dependency; options table for each tradeoff
- [ ] 8. Open questions, settled items, evidence index
- [ ] 9. Stop and present for decisions
```

**1. Context.** Read the project's goals document (for this repo, `GOALS.md`; it ranks which costs matter). Separate earlier documents into findings (real runs) and ideas (proposals). List every host/flavor the invariants must hold on.

**2. Critical variables.** Fill the table above for this problem. State which variable is *central* (the one most likely to turn a "works for me" into a coin flip) and which are secondary. This table is the contract every later measurement and invariant is checked against.

**3. Running example.** Build the example app against the released packages (`next build && next start`, or the host's production equivalent). Measure the range of each critical variable on it (latencies and their chaining, sizes, rates, orders). Record what the system emits (for a streamed page: a script reading the HTTP body chunk by chunk) and what a real client does (Playwright with the system Chrome: network requests, console). Sample deliberately across the variables: vary inputs so caches do not mask timing, repeat runs, force both orders where possible, and validate inputs first (an invalid input produces an error path that can look like a legitimate outcome). Quote frequencies only from ≥ 10 valid samples; report counts and min/median/max, not one number.

**4. Enumerate through these lenses** (each yields invariants; drop the ones that do not apply):

- first paint: what appears when, what never blocks what
- becoming interactive/live: per part, not per page
- live updates: never backwards, never half-applied, only what changed repaints, no stutter
- the same data in several places: identical at the same instant
- takeover of server-painted content: no flicker, no restart of a still-loading neighbor
- data already delivered: never requested again
- navigation and coming back: what stays on screen, what is stale and for how long
- failures and slow paths: rate limits, timeouts, partial responses, invalid inputs
- older platform versions: what degrades, labeled
- users who do not use the feature: pay the minimum (bundle, runtime) without substantially complicating the library; zero is the target, not the rule

**5. Verify each** on the baseline, across the sampled range of every critical variable. For every invariant record: evidence line(s) with labels, and a **Boundary** sentence stating exactly where the guarantee stops (this is usually where the next bucket begins). When the baseline outcome differs by where a variable lands, tabulate the distinct outcomes with frequency and what the person sees in each; never collapse them into "usually fine" or "broken".

**6. Bucket.**

- **Bucket 1 — already satisfied on baseline.** Holds across the full range of every critical variable today.
- **Bucket 2 — obvious addition, no tradeoff.** Not satisfied today; satisfying it costs the person nothing. Implementation difficulty is *not* a tradeoff; note the hard mechanism question and keep the invariant here.
- **Bucket 3 — genuine tradeoff.** Satisfying it costs the person something elsewhere (a delay, a duplicate request, a stale value, an annotation the author must keep correct). Usually rooted in something the system *cannot distinguish* at some point in a variable's range (e.g. "data is still coming" vs "data will never come").

**7. Order and options.** Within each bucket, order so each item can be closed before the next: foundations first in Bucket 1; in Bucket 3 the decision that determines whether later decisions exist comes first, and each entry names what depends on it. Each Bucket 3 entry gets an options table with columns: option, what the person sees in each affected case, authoring cost; plus a storyboard comparing the two leading options. Include options from earlier ideas as rows, labeled [idea], alongside options nobody has proposed yet. Do not recommend; the reader decides.

**8. Close out.** Sections for: open questions and contradictions (with what was tried), items settled by earlier work (so they are not re-argued unless wanted), and an evidence index (paths to scripts, raw results, source files, findings).

**9. Stop.** Present the document. Do not begin an implementation plan until the Bucket 3 decisions are recorded.

## Output

Use [template.md](template.md) for the document skeleton, the critical-variables table, storyboard legend, and worked snippets. Keep the document in the project's planning store or `docs/` as directed; it is user-facing.

## Pitfalls seen in practice

- Stating one measurement as an invariant ("master does not stream before data") when the outcome depended on request order; the correct statement tabulated three outcomes with frequencies across 47 loads.
- Naming only the obvious variable. Request order was known; the invalid-input variable (delisted symbols) was not, and it polluted the tally until filtered.
- Asserting a mechanism from source reading alone; the prediction was disproved by the next 12 runs. Predict, measure, then claim.
- Measuring a dev server linked to a local checkout and calling it baseline.
- Filing "hard to build" under tradeoffs; the person pays nothing, so it is Bucket 2 with a mechanism note.
- Letting an earlier plan's mechanism (deltas, waiters, overlays) leak into the invariant wording.
