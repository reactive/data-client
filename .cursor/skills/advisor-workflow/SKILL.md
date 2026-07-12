---
name: advisor-workflow
description: Cost-and-speed-optimized development workflow for a cheap fast implementing model consulting expensive advisor subagents (design-advisor, principal-advisor, quality-reviewer). Use for design-bearing or high-risk implementation - new/changed public contracts, schemas, state/lifecycle, concurrency, security, persistence, compatibility - or after repeated failed attempts. Do not invoke for trivial edits or solely because a change touches multiple files.
---

# Advisor Workflow

You are the implementer, running on a cheap, fast model. Expensive judgment is bought from advisor subagents when expected avoided rework or defect risk exceeds the consult's cost and latency. Advisors consume supplied evidence and produce concise decisions — minimal signatures, pseudocode, test cases, and localized fix sketches, never full patches. You own all repository edits, exploration, and runtime validation.

## Advisors

| Subagent | Model class | Use for | Budget per task |
|---|---|---|---|
| `design-advisor` | mid-price, medium speed | interface/API/schema/data-flow decisions | default ≤2 consults; bundle coupled decisions into one packet; justify more |
| `principal-advisor` | expensive, slow | THE one highest-blast-radius call: architecture, concurrency/correctness, security, or unresolved disagreement | at most 1, launched in background |
| `quality-reviewer` | mid-price, medium speed | end-of-implementation diff review | 1 (plus 1 re-review if findings were large) |

Launch advisors with the Task tool; batch independent consults in parallel. Launch `principal-advisor` with `run_in_background: true` and keep implementing independent parts while it thinks.

## Workflow

### 1. Triage (you, ~1 minute)

Classify the task:

- **Mechanical** (rename, config change, straightforward bug fix, well-specified small feature): implement directly; skip to step 5. Run `quality-reviewer` only if the diff ends up touching lifecycle, public APIs, or 3+ files.
- **Design-bearing** (new/changed public signatures, schemas, store shapes, cross-module contracts, layout/CSS systems): steps 2–6.
- **High-uncertainty** (unknown library behavior, unclear data flow, "not sure this approach works"): build a walking skeleton first — the smallest end-to-end slice that produces runnable evidence — run it, and use it plus that evidence as the context packet. Wrong directions should die while still small. Then steps 2–6.

**Risk override**: anything touching security, privacy, money, data loss, concurrency, public compatibility, or irreversible migration is design-bearing regardless of diff size.

### 2. Extract decision points (you)

Explore the codebase yourself (reading is cheap). List the specific decisions with high rework cost: every new or changed interface, schema, contract, or cross-cutting mechanism. Everything else is implementation detail behind those decisions — do not consult on it.

### 3. Context packets + consults

For each decision point (bundling coupled ones), send a `design-advisor` consult; batch independent consults in parallel. Packet contents:

```
DECISION: <the specific question>
ALTERNATIVES: <each candidate with the strongest case for it, including your tentative pick>
CONSTRAINTS: <requirements, existing conventions, compat needs; NON-GOALS>
CURRENT STATE: <relevant signatures/types/rules - full and raw, not summarized>
CALLERS/CONSUMERS: <who uses this and how - raw excerpts>
ASSUMPTIONS: <what you believe but have not verified>
EVIDENCE: <anything already learned from running code>
OMITTED: <areas considered but not included, so the advisor can call for them>
```

Include enough primary evidence to avoid omission bias, but not unrelated bulk — repeated context and advisor reasoning tokens are real costs. Allow the advisor one "send me X" round-trip, then decide.

If the task has a single dominating decision (architecture, correctness-critical algorithm, security), send that one to `principal-advisor` in the background instead, and implement the parts that don't depend on it meanwhile.

### 4. Implement (you)

Implement against the decided interfaces. Write the advisor's proving tests. If implementation surfaces evidence that invalidates an advisor assumption, send a short delta packet rather than silently diverging — and when background advice arrives, check its assumptions against current code before applying; don't apply stale advice mechanically.

### 5. Validate with runtime evidence (you)

Run the real thing: build, tests, dev server, browser where UI is involved. Advisors can identify risks statically but cannot establish runtime behavior — that is your job alone, and it is where implementers catch bugs no reviewer can. Loop on real failures. Also execute the `quality-reviewer`'s "Needs runtime verification" list when you get it.

**Escalation valve**: after two distinct failed hypotheses on the same problem — or when another attempt would cost more than a consult — stop. Package the failure evidence (error output, what you tried, why each attempt failed) and consult `design-advisor` (or `principal-advisor` if correctness-deep). Never repeat an approach without new evidence; cheap-model spin is the hidden cost that erases the price advantage.

### 6. End review (mandatory for design-bearing/high-risk work)

Send the diff to `quality-reviewer`, stating the full scope explicitly: base revision, committed/staged/unstaged/untracked status. Apply findings yourself; record the disposition of each (applied / rejected + reason). You may reject findings with evidence — advisors are fallible; audit their equivalence proofs. An unresolved **critical** finding blocks completion: if you and the reviewer still disagree after one evidence-based exchange, spend the unused `principal-advisor` consult; if it's already spent, surface the documented risk to the user. One fix loop normally; a second re-review only if findings were extensive. Then re-validate (step 5) anything behavior-touching.

## Cost and latency principles

1. Buy decisions, not tokens: pay for judgment at interfaces/schemas/invariants where rework cost is highest.
2. Parallelize independent consults; hide the slow advisor's latency behind your own work.
3. Push context to advisors; never make an expensive slow model collect context through tool round-trips.
4. Keep first passes thin when uncertainty is high.
5. Runtime evidence beats advisor speculation for anything that executes.
6. Cap loops (two distinct failed hypotheses, then escalate with evidence; 2 review rounds max).
7. When advisors disagree, first run the smallest experiment that discriminates between the options. Full parallel multi-model implementations (best-of-N) only when no cheaper discriminating evidence exists.
