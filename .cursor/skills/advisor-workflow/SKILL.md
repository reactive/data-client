---
name: advisor-workflow
description: Cost-and-speed-optimized development workflow for a cheap fast implementing model consulting expensive advisor subagents (design-advisor, principal-advisor, quality-reviewer). Use for design-bearing or high-risk implementation - new/changed public contracts, schemas, state/lifecycle, concurrency, security, persistence, compatibility - or after repeated failed attempts. Do not invoke for trivial edits or solely because a change touches multiple files.
---

# Advisor Workflow

You are the implementer, running on a cheap, fast model. **Objective: maximize quality; at a given quality level, minimize time-to-completion and cost.** Buy expensive judgment from advisor subagents whenever expected avoided rework or defect risk exceeds the consult's cost and latency. Advisors consume the evidence you supply and return concise decisions (signatures, pseudocode, test cases, localized fix sketches — never full patches). You own all repository edits, exploration, and runtime validation.

**Spend policy** (governs every consult decision): the first opinion on a question is worth far more than a second; new evidence (a test, a spike, a runtime probe) beats more opinions; resuming an existing consult with a delta packet costs a fraction of opening a new one. Escalating spend on the same question needs escalating justification — but never skip a consult that would raise quality.

## Advisors

| Subagent | Model class | Use for | Default per task |
|---|---|---|---|
| `design-advisor` | mid-price, medium speed | interface/API/schema/data-flow decisions | ~2 consults; bundle coupled decisions into one packet |
| `principal-advisor` | expensive, slow | highest-blast-radius calls: architecture, concurrency/correctness, security, unresolved disagreement | 1, launched in background |
| `quality-reviewer` | mid-price, medium speed | end-of-implementation diff review | 1 (plus re-review after large fixes) |

Defaults are calibration points, not caps; exceed them when the spend policy justifies it. Launch advisors with the Task tool; batch independent consults in parallel. Launch `principal-advisor` with `run_in_background: true` and implement independent parts while it thinks.

## Workflow

### 1. Triage (you, ~1 minute)

- **Mechanical** (rename, config change, straightforward bug fix, well-specified small feature): implement directly; skip to step 5. Run `quality-reviewer` only if the diff ends up touching lifecycle, public APIs, or 3+ files.
- **Design-bearing** (new/changed public signatures, schemas, store shapes, cross-module contracts, layout/CSS systems): steps 2–6.
- **High-uncertainty** (unknown library behavior, unclear data flow, "not sure this approach works"): first build and run a walking skeleton — the smallest end-to-end slice that produces runnable evidence — so wrong directions die small; use it and its evidence as the context packet. Then steps 2–6.

**Risk override**: anything touching security, privacy, money, data loss, concurrency, public compatibility, or irreversible migration is design-bearing regardless of diff size.

### 2. Extract decision points (you)

Explore the codebase yourself (reading is cheap). List the decisions with high rework cost: every new or changed interface, schema, contract, or cross-cutting mechanism. Everything else is implementation detail behind those decisions — do not consult on it.

### 3. Context packets + consults

For each decision point (bundling coupled ones), send a `design-advisor` consult; batch independent ones in parallel:

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

Include enough primary evidence to avoid omission bias, but no unrelated bulk — repeated context and advisor reasoning tokens are real costs. Allow one "send me X" round-trip, then decide.

If the task has a single dominating decision (architecture, correctness-critical algorithm, security), send it to `principal-advisor` in the background instead and implement what doesn't depend on it meanwhile.

### 4. Implement (you)

Implement against the decided interfaces; write the advisor's proving tests. If implementation surfaces evidence that invalidates an advisor assumption, send a short delta packet rather than silently diverging. When background advice arrives, check its assumptions against current code before applying — never apply stale advice mechanically.

### 5. Validate with runtime evidence (you)

Run the real thing: build, tests, dev server, browser where UI is involved. Advisors identify risks statically but cannot establish runtime behavior — that is your job alone. Loop on real failures, and execute the `quality-reviewer`'s "Needs runtime verification" list when you get it.

**Escalation valve**: after two distinct failed hypotheses on the same problem — or when another attempt would cost more than a consult — stop; never repeat an approach without new evidence (cheap-model spin erases the price advantage). Package the failure evidence (error output, what you tried, why each attempt failed) and consult `design-advisor`, or `principal-advisor` if the failure is correctness-deep — per the spend policy, resume an existing principal consult rather than opening a fresh one. For any failure not obviously in the code you are writing (environment, build, tooling), first run the cheapest experiment that discriminates "caused by my changes" from "pre-existing" (e.g. stash your diff and re-run); if pre-existing and outside the task's scope, document it and move on.

### 6. End review (mandatory for design-bearing/high-risk work)

Send the diff to `quality-reviewer`, stating the full scope explicitly (base revision; committed/staged/unstaged/untracked). Apply findings yourself, recording each disposition (applied / rejected + reason) — you may reject with evidence; advisors are fallible, so audit their equivalence proofs. An unresolved **critical** finding blocks completion: after one evidence-based exchange, escalate to `principal-advisor` (resuming if one exists); surface the documented risk to the user only when further consultation stops adding information — an unresolved critical is never silently shipped. One fix loop normally; re-review after large fixes. Re-validate (step 5) anything behavior-touching.

## Cost and latency principles

1. Buy decisions, not tokens: pay for judgment at interfaces/schemas/invariants where rework cost is highest.
2. Parallelize independent consults; hide slow-advisor latency behind your own work.
3. Push context to advisors; never make an expensive slow model collect context through tool round-trips.
4. Keep first passes thin when uncertainty is high.
5. Runtime evidence beats advisor speculation for anything that executes.
6. When advisors disagree, run the smallest experiment that discriminates between the options; full parallel multi-model implementations (best-of-N) only when no cheaper discriminating evidence exists.
