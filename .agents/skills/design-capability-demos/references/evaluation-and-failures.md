# Evaluation and failure diagnosis

Use this reference to rank close candidates, audit a design, or repair a weak result.

## Weighted rubric

Score each criterion from 1-5. Multiply the first three by 2, for a maximum of 55.

| Criterion | 1 | 3 | 5 | Weight |
|---|---|---|---|---:|
| Claim-surface fidelity | Evidence proves a different benefit | Surface is partly preserved | Evidence directly proves the genuine claim | 2 |
| Counterfactual credibility | Straw or obsolete baseline | Plausible but avoidably weak | Strongest ordinary alternative without the capability | 2 |
| Capability isolation | Several plausible causes | Main cause is likely but not exclusive | Only the capability explains the delta | 2 |
| Contrast strength | Difference is marginal | Difference is noticeable | Difference is immediate and categorical | 1 |
| Interpretation cost | Requires extensive inference | Requires brief inspection | Evidence maps directly to the claim | 1 |
| Structural fit | Condition is arbitrary | Condition is plausible | Scenario naturally creates the condition | 1 |
| Transfer | Bound to scenario trivia | Pattern can be abstracted | Invariant is obvious across domains | 1 |
| Robustness and retellability | Fragile and hard to reconstruct | Survives limited variation | Stable evidence with compact causal grammar | 1 |

Reject any candidate below 3 on a weighted criterion. Prefer claim fidelity and baseline credibility when totals are close.

## Hard gates

A valid design must satisfy all gates:

1. Both variants pursue equivalent useful work or the same intended result.
2. Evidence remains on the capability's genuine outcome surface.
3. The baseline is the nearest credible alternative and retains unrelated standard optimizations.
4. The leverage condition belongs to the capability's operating regime.
5. The capability is necessary for the demonstrated advantage under fixed conditions.
6. Evidence reaches the claim's terminal condition rather than only showing an intermediate mechanism event.
7. Adjacent parameter values or structural perturbations preserve or appropriately bound the claim.

## Anti-patterns and repairs

### Intermediate mechanism as proof

**Symptom:** The demo shows scheduling, generation, replacement, rollback, or validation starting, but not the healthy, valid, restored, or accepted state named by the claim.

**Repair:** Observe the terminal condition and its invariant. If only the intermediate event is demonstrable, narrow the claim to that event.

### Outcome-surface substitution

**Symptom:** An architectural, authoring, diagnostic, safety, or portability capability is presented as a speedup or runtime failure.

**Repair:** Name the outcome surface first, then choose direct evidence on it: edit propagation, generated artifacts, rejected invalid states, diagnostics, recovery state, or environment equivalence.

### Straw baseline

**Symptom:** The baseline loses because it omits ordinary batching, caching, validation, composition, or another independent practice.

**Repair:** Upgrade it to the strongest ordinary implementation without the capability. If the advantage disappears, narrow the claim instead of weakening the baseline.

### Fabricated handicap or unequal work

**Symptom:** One side receives a delay, extra loop, worse data, missing optimization, or less useful output.

**Repair:** Equalize intended results, data, side effects, and independent optimizations. Amplify only a condition the capability addresses.

### Proxy-only outcome

**Symptom:** A chart, counter, or log substitutes for an experience even though the claim is experiential, or an experience substitutes for a static guarantee.

**Repair:** Match direct evidence to the declared outcome surface. Use instrumentation only to expose an otherwise invisible property on that surface.

### Scenario-first ideation

**Symptom:** A familiar app is selected, then arbitrary behavior is inserted to make the capability relevant.

**Repair:** Define capability, surface, baseline, leverage condition, and invariant before selecting a scenario.

### Surface-realistic miniature app

**Symptom:** Navigation, styling, content, and chrome outnumber causally relevant elements.

**Repair:** Preserve realistic causal structure and remove decorative completeness.

### Toy without structural realism

**Symptom:** The case is simple but no plausible system encounters its condition.

**Repair:** Restore the smallest credible scale, concurrency, failure, dependency, invalid operation, ownership boundary, or platform difference.

### Many triggers, many conclusions

**Symptom:** Several controls reveal different benefits and require remembering earlier states.

**Repair:** Choose one invariant and one canonical trigger. Split separate claims into separate demos.

### Knife-edge tuning

**Symptom:** A numeric result flips with small device, timing, or data changes.

**Repair:** Sweep the primary variable, map the clarity window, and choose away from both boundaries.

### Forced numeric tuning

**Symptom:** Arbitrary scale, latency, or counts are added to a binary or structural capability.

**Repair:** Use the smallest discriminating case plus adjacent and boundary perturbations. Tune numbers only when magnitude genuinely controls leverage.

### Catastrophic overload

**Symptom:** Both variants fail or an unrelated subsystem becomes the bottleneck.

**Repair:** Reduce or isolate the workload until the enabled property remains functional.

### Hidden preconditions

**Symptom:** Cache state, timing coincidence, randomness, hardware, prior actions, or environment quirks drive the result.

**Repair:** Fix or expose preconditions, use deterministic inputs where possible, and test the intended environment range.

### API showcase instead of capability proof

**Symptom:** Source syntax changes but no claimed property is evidenced.

**Repair:** Trace the API to its genuine outcome surface. For authoring ergonomics, compare equivalent changes and observe edit locality, invalidation scope, diagnostics, or generated artifacts rather than inventing runtime effects.

### Domain-locked lesson

**Symptom:** The concept proves scenario trivia rather than a general capability.

**Repair:** State the invariant without scenario nouns and redesign until the objects instantiate it cleanly.

## Leverage audit

For each variable or perturbation, record:

- causal role and realistic source;
- expected effect on each variant;
- lower/adjacent case where evidence is insufficient;
- upper/boundary case where the claim stops or a confounder appears;
- sensitivity to environment, randomness, and warmup when relevant.

For numeric variables, choose inside the clarity window. For discrete claims, use a small perturbation matrix rather than artificial scale.

