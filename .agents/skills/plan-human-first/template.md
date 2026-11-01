# Template: human-first invariants document

Copy the skeleton; delete sections that do not apply. Replace every `<…>`.

```markdown
# What the user should experience: <feature> (<example app>)

Scope: <one paragraph: the extreme case, the hosts/flavors that must all satisfy>.
Earlier mechanisms are candidates ([idea]); earlier runs are real ([finding]).

## How to read the evidence labels
<table: measured / source / finding / idea / inference, with the exact baseline build named>

## Critical variables
<which runtime conditions the real world will vary for this problem; the central one first>

| variable | range (measured or documented) | how it was sampled |
| --- | --- | --- |
| <e.g. request finish order> | <0.6–1.2 s, either order; second wave chained after the first> | <30 sequential cold loads + 8 concurrent> |
| <e.g. input validity> | <listed vs delisted symbol> | <filtered on status before tallying> |

Every invariant below must hold at every point of every row.

## The running example
<ASCII wireframe of the page with named parts>
**The same data lives in several places.** <which values repeat where>
**How the critical variables show up here.** [measured] <e.g. request → latency range; which requests start only after which; update rates>

| moment | what is ready |
| --- | --- |
| <t0> | <frame only> |
| <t1> | <fast parts> |
| <t2> | <slow parts> |

Storyboard legend:
░░░░      skeleton — nothing to show yet
100.01    painted by the server; static (not yet live/interactive)
100.05▲   live — updating, clickable
⟳         a network request the browser makes
✗         something the user must never see

Plain-word glossary: <frame, piece, handoff, live feed, store, …>

## Bucket 1 — already satisfied on baseline
### 1.n <invariant as what the person sees>
<one sentence: always / never>
<storyboard>
<evidence lines with labels>
Boundary: <where this guarantee stops>

## Bucket 2 — obvious additions, no tradeoffs
### 2.n <invariant>
<sentence> · <storyboard> · <what the baseline does instead, with outcome table if it varies> · <why no tradeoff> · <mechanism question, if any, labeled as not a user tradeoff>

## Bucket 3 — choices with tradeoffs
Ordered so each can be closed before the next; <which one is the root and why>.
### 3.n <the question, as a situation the person is in>
<why the system cannot distinguish the cases>
| option | <affected case A: what the person sees> | <affected case B> | authoring cost |
| --- | --- | --- | --- |
| <option, [idea] if proposed earlier> | … | … | … |
<storyboard comparing the two leading options>
What depends on this: <later decisions, promises in Bucket 2 that change meaning>

## Open questions and contradictions
<numbered; what was predicted, what was observed, what was tried, what would settle it>

## Settled by earlier work
<bullets; so they are not re-argued unless wanted>

## Evidence index
<paths: scripts, raw results, source files, findings, PRs>
```

## Worked snippet: a baseline outcome that depends on a critical variable

When the same code produces different results depending on where a variable lands (here: request finish order), tabulate rather than summarize:

```markdown
| outcome | when the frame arrives | what the handoff contains | how often [measured] |
| --- | --- | --- | --- |
| A. wait for everything | ~1.1–1.3 s, whole page at once | all 6 endpoints | 43 / 47 valid loads |
| B. conclude between waves | ~0.62 s with skeletons | first wave only | 4 / 47 |
| C. conclude before anything started | ~20–50 ms | empty store | 5 / 5 with <variant> |
```

Then one storyboard per outcome, then the invariant: "under *any* interleaving, <early> **and** <complete>". None of the outcomes is the invariant.

## Worked snippet: a Bucket 3 options table

```markdown
| option | server-painted part | browser-only part | authoring cost |
| --- | --- | --- | --- |
| Fetch now | ⟳ duplicate; content may swap once | fastest possible | none |
| Wait for the page [idea] | 0 duplicates; static until its piece lands | waits for the slowest part | needs a "page is done" signal |
| Wait, bounded | 0 duplicates if server beats N | ≤ N delay | a client stopwatch |
| Make it impossible | 0 duplicates, no wait | immediate | per-host feasibility differs; may need a per-part declaration |
| Declare the exceptions | 0 for declared | immediate for declared | one annotation per deviating part |
```

## Measurement recipe (minimum)

- Production build of the example app against the npm-published packages; note versions.
- Raw stream: read the HTTP body chunk by chunk; record first-byte time, when the handoff data appears, pending/reveal markers, last-byte time; parse the handoff to list what it contains.
- Real browser: Playwright with the system Chrome; record upstream network requests with timestamps and console output. Production React does not log recoverable hydration errors to the console; use a dev build or an `onRecoverableError` hook when that matters.
- Sample across every critical variable deliberately (repeat runs, vary inputs, force both orders, build a variant for topology changes); ≥ 10 valid samples per configuration before quoting a frequency; validate inputs first; keep raw results (`.jsonl`) and cite their paths.
