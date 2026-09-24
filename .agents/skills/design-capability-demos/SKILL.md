---
name: design-capability-demos
description: Design, compare, rank, and refine demonstration concepts for framework or library capabilities. Use when Codex needs to turn a capability, API, architectural property, performance feature, developer-tool feature, safety guarantee, recovery behavior, or before/after implementation into a demo scenario with a credible contrast, minimal trigger, direct evidence, and tuned parameters or perturbations. Focus strictly on the demo mechanism itself, not narration, documentation, slides, launch material, or explanatory presentation.
---

# Design Capability Demos

Design an observable proof of a capability. Produce 3-5 ranked concepts, then refine the strongest by tuning or varying the conditions under which the capability matters.

## Maintain the boundary

Include only:

- scenario and objects in the demo
- baseline and capability-enabled variants
- controlled condition and fixed variables
- user action, edit, fault, invalid operation, or automatic trigger
- direct evidence of the claimed property
- parameter values, structural perturbations, ranges, and tuning plan
- minimal instrumentation needed to perceive or verify the evidence

Exclude narration, disclosure, teaching copy, slide structure, marketing claims, audience setup, and surrounding presentation. Do not solve a weak demo with explanation.

## Core model

Represent each demo as:

`structurally fitting scenario + leverage condition + credible contrast + minimal trigger -> unmistakable evidence`

Preserve one causal chain:

`capability -> changed property -> evidence on the same outcome surface`

Define before ideating:

- **Capability:** the property uniquely enabled or substantially improved.
- **Outcome surface:** where the genuine value appears, such as runtime behavior, failure recovery, compile-time prevention, authoring locality, generated artifacts, diagnostics, safety, or interoperability.
- **Baseline:** the strongest ordinary implementation without that capability.
- **Leverage condition:** the workload, dependency shape, failure, invalid operation, ownership boundary, platform difference, or other condition that makes the property evident.
- **Invariant:** the general relationship the demo reveals without framework or scenario nouns.
- **Evidence:** the state, behavior, diagnostic, artifact change, prevented invalid state, or recovery result that directly supports the claim and reaches its stated terminal condition.

Read [references/principles.md](references/principles.md) when the capability is abstract, candidate scenarios are weak, or structural fit is uncertain. Read [references/evaluation-and-failures.md](references/evaluation-and-failures.md) when ranking close candidates, auditing a draft, or diagnosing a demo that feels impressive but unconvincing.

## Workflow

### 1. Normalize the capability

Inspect available API documentation, code, benchmarks, or user context when provided. Write:

```text
Capability:
Outcome surface:
Without it:
With it:
Leverage condition:
Direct evidence:
Invariant:
Confounders to hold fixed:
```

Separate the capability from API syntax and implementation mechanism. Preserve its outcome surface: do not turn an authoring, architectural, diagnostic, safety, or interoperability claim into a runtime-performance claim because speed is easier to show. If the advantage lacks direct evidence on its genuine surface, state that it is not yet demo-ready and identify the missing causal link.

Choose the nearest credible baseline before selecting a scenario. Use the best ordinary alternative a competent practitioner would actually consider. Reject a comparison that removes unrelated batching, caching, validation, composition, or optimization merely to make the capability win.

### 2. Find the high-leverage regime

Identify what controls how much the capability matters. It may be:

- numeric: scale, latency, rate, cost, contention, or failure frequency;
- structural: dependency depth, ownership boundaries, change fan-out, or coordination count;
- categorical: valid versus invalid operation, success versus injected failure, or one environment versus another.

Do not invent a numeric scale for an inherently discrete claim. Choose conditions where:

- the baseline exposes the exact limitation the capability addresses;
- the enabled case shows the claimed property on the same outcome surface;
- the condition is plausible for the scenario;
- the advantage comes from amplifying or activating a real condition, not adding an unrelated penalty;
- neither side hits an unrelated bottleneck or changes useful work.

For numeric variables, find a broad clarity window. For structural or categorical variables, choose the smallest discriminating case plus an adjacent or boundary case that could falsify an overbroad claim.

### 3. Generate 3-5 distinct concepts

Create candidates that differ in proof structure or structurally fitting scenario, not cosmetic theme. Keep every candidate on the declared outcome surface; do not invent a different benefit.

For each candidate provide one compact row containing:

```text
Concept | Structural fit | Outcome-surface fidelity | Credible contrast |
Trigger | Direct evidence | Leverage variable/perturbation | Main confounder
```

Use familiar experiences when they naturally instantiate the capability. Prefer realistic causal relationships and constraints over product decoration. Remove any element that does not create the condition, activate the property, or expose the evidence.

### 4. Rank the candidates

Score each concept from 1-5 on:

- **Capability isolation:** the capability is the only plausible cause.
- **Outcome-surface fidelity:** the evidence proves the genuine claim without substituting a more dramatic benefit.
- **Baseline credibility:** the alternative is the nearest competent implementation, not a straw baseline.
- **Contrast strength:** the outcomes are unmistakably different.
- **Interpretation cost:** the evidence maps to the claim with little inference.
- **Structural fit:** the scenario naturally contains the relevant condition.
- **Transfer:** the invariant is visible beyond the chosen objects.
- **Robustness and retellability:** the result survives reasonable variation and retains a compact causal grammar.

Weight the first three twice. Reject a concept regardless of total score if it changes the claim's surface, relies on a confounder or contrived handicap, or compares against an avoidably weak alternative.

Return one compact row per candidate with a total and one short rationale. Choose one canonical concept. Do not fully specify losing candidates.

### 5. Refine the winner by varying leverage

Turn the winner into an executable specification:

1. Identify the primary leverage variable or perturbation and secondary realism controls.
2. For a numeric variable, establish the baseline threshold and enabled limit, then select a target inside the clarity window.
3. For a structural or categorical variable, choose the smallest discriminating case and test adjacent or boundary cases.
4. Verify that the evidence changes only when the claimed property is activated or violated, and proves the claimed end state rather than an intermediate mechanism event.
5. Hold useful work, inputs, final intended result, environment, and unrelated optimizations constant unless the capability specifically changes one.
6. Remove controls, metrics, and visuals not needed to perceive or verify the evidence.

Use:

| Variable or perturbation | Causal purpose | Tested cases/range | Chosen case | Too weak / adjacent case | Confounding boundary |
|---|---|---|---|---|---|

If empirical testing is available, sweep numeric variables or test a small perturbation matrix. Optimize for stable discrimination, not the largest number or most dramatic failure.

### 6. Run the counterfactual audit

Verify all answers are yes:

- If the capability is removed and nothing else changes, does the advantage disappear?
- Does the evidence stay on the declared outcome surface?
- Is the baseline the strongest credible alternative without the capability?
- Does the trigger exercise the claimed property directly?
- Does the evidence reach the claim's terminal condition rather than stop at an intermediate event?
- Do both variants pursue equivalent useful work or the same intended result?
- If decorative labels are hidden, does the behavior, diagnostic, artifact, or state still support the result?
- Is the scenario believable because of its causal structure?
- Can the demo be reduced further without weakening the proof?
- Does the chosen range or perturbation survive an adjacent or boundary case?
- Does the invariant transfer to other domains?

Revise or discard the concept when any causal answer is no.

## Output contract

Return, in order:

1. **Capability model** using the fields from step 1.
2. **Ranked concepts** with 3-5 compact rows and weighted totals.
3. **Selected concept** with a one-sentence selection rationale.
4. **Refined demo specification** containing scenario, credible baseline, enabled variant, trigger, direct evidence, fixed controls, and leverage table.
5. **Validity audit** listing only failed or uncertain audit items and remaining confounders.

Keep the output about demo design. Do not add presentation advice or repeat the same rationale across sections.

