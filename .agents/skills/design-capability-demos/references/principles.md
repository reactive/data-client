# Design principles and concept hierarchy

Use this reference when a capability is abstract or structural fit is uncertain. Apply the hierarchy top to bottom.

## 1. Reveal the capability

Make a unique property directly evident. Start with the delta, not a product theme, API call, or feature list.

Ask:

- What becomes possible, remains true, or is prevented because of the capability?
- What evidence would remain if promotional labels disappeared?
- Which nearby capability could be mistaken for the cause?

The evidence must be a consequence of the capability, not a convenient proxy.

Follow the claim to its terminal condition. A scheduled replacement is not yet a recovered healthy service; emitted code is not yet a valid composed artifact; starting rollback is not yet restored invariant state. Stop earlier only when the claim is explicitly limited to that intermediate mechanism.

## 2. Preserve the outcome surface

Identify where the capability genuinely creates value before choosing how to show it. Runtime behavior is only one surface. Others include prevented invalid states, recovery after failure, localized source changes, generated artifacts, diagnostics, safety guarantees, and cross-environment consistency.

Keep the proof on that surface. Demonstrate ownership through ownership and change propagation; a compile-time guarantee through accepted and rejected programs; recovery through state before, during, and after failure. Do not invent a speedup, request reduction, or visual effect to make a quieter capability dramatic.

## 3. Place it in its high-leverage regime

Capabilities matter under conditions. Identify the controlling condition and move far enough into it that the difference is unmistakable.

Amplify or activate a condition already present in legitimate use:

- more items for scaling behavior;
- slower dependencies for latency behavior;
- concurrent actors for coordination;
- a credible injected failure for recovery;
- a minimal invalid operation for static prevention;
- a local requirement change for ownership or composition;
- an actual environment boundary for portability.

Do not slow only the baseline, omit equivalent work, change data, or disable an unrelated optimization.

## 4. Establish the nearest credible contrast

Use the strongest ordinary alternative a competent practitioner would choose without the capability. Keep constant everything except the capability or the smallest difference that activates it.

If the alternative can recover the same advantage with a standard independent optimization, include that optimization. A weak baseline proves only that the baseline was weak.

Useful contrast forms include:

- same workload, synchronous versus interruptible processing;
- same multi-step mutation, individually committed versus atomic;
- same invalid program, unchecked execution versus compile-time rejection;
- same local requirement change, centralized ownership versus local ownership plus derived composition;
- same fault, unmanaged state versus reconciled desired state.

Choose side-by-side, toggle, artifact diff, or repeated trial based on the evidence surface and memory burden.

## 5. Minimize interpretation

Match evidence to the surface:

- direct experience for experiential claims;
- diagnostics for static prevention;
- artifact or dependency diffs for composition;
- state transitions for recovery;
- invariant checks for atomicity or safety;
- environment matrices for portability.

Instrumentation is valid when it is direct evidence, not a proxy for a different claim.

## 6. Remove incidental complexity

Every element must create the leverage condition, activate the property, or expose the evidence. Remove it otherwise. Complexity is justified only when part of the causal structure.

## 7. Choose structural fit

Match the scenario to the capability's causal shape rather than an industry label.

| Capability structure | Structurally fitting scenario traits |
|---|---|
| Scheduling or prioritization | urgent and deferrable work compete after one action |
| Caching or memoization | repeated expensive work with stable identity |
| Incremental computation | a small change affects a bounded part of a larger result |
| Streaming or progressive delivery | independent parts become available at different times |
| Resilience or recovery | a credible failure interrupts valuable state or availability |
| Transactions or atomicity | dependent mutations must succeed or fail together |
| Reactive propagation | a source change flows through a dependency graph |
| Static safety or validation | a minimal invalid operation is rejected before execution |
| Ownership or composition | a local change updates its owner and the derived aggregate |
| Interoperability or portability | equivalent input crosses a real environment boundary |

## 8. Use familiar concrete experiences

Choose an action with a known success condition: typing, dragging, transferring, saving, compiling, failing, recovering, or changing a local requirement. Familiarity reduces interpretation but never outranks structural fit.

## 9. Prefer one canonical case deeply

After comparing alternatives, deepen one case until its contrast and controls are robust. Multiple shallow vignettes dilute causal proof. Use phases only when the invariant unfolds over time.

## 10. Expose an invariant for transfer

State the relationship without framework, API, or scenario nouns. Examples:

- urgent work remains responsive while deferrable work progresses;
- dependent mutations become visible together or not at all;
- invalid aliasing is rejected before execution;
- recoverable desired state is restored after a replaceable member fails;
- local requirements compose into a global artifact without duplicating ownership.

If the invariant cannot be stated cleanly, the concept may demonstrate scenario trivia.

## 11. Favor structural realism over surface realism

Preserve realistic causal relations, workload shapes, failure modes, and constraints. Product chrome and production feature breadth are optional and usually harmful.

## 12. Optimize retellability through design

Use a compact causal grammar:

`When [trigger] occurs under [condition], baseline [evidence] while enabled [evidence].`

If reconstruction requires exceptions, several metrics, or hidden setup facts, simplify the demo.

