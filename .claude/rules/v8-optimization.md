---
paths:
  - "packages/normalizr/src/**"
  - "packages/core/src/**"
  - "packages/endpoint/src/**"
  - "packages/rest/src/**"
  - "packages/react/src/**"
  - "packages/vue/src/**"
---
<!-- Generated from .cursor/rules/v8-optimization.mdc by `yarn build:agent-rules`. Edit the source. -->


# V8 optimization check

When a change touches code that runs per entity, per render or per request (the hot paths the benchmarking rule's scenarios cover) and changes anything V8 optimizes on (object shapes or property order, polymorphic call sites, `try`/`catch`, `arguments`, `delete`, closures or spreads in loops), measure its effect on V8 before and after, then weigh revisions on what you find.

1. **Spawn a fast subagent** to measure: **Haiku** in Claude Code (Agent tool, `model: "haiku"`), **Grok 4.7 Fast** at medium reasoning in Cursor. Give it the changed functions, the base ref, and the benchmark to run.
2. **It measures both sides** (base and change) for each changed hot function, using the benchmarking rule's profiling scripts (`start:trace`, `start:deopt`) plus the flags below:
   - **Optimization**: does it get optimized at all, and does it stay optimized? `%GetOptimizationStatus` via [printStatus.js](../../examples/benchmark/printStatus.js) (`yarn workspace example-benchmark start` already passes `--allow-natives-syntax`).
   - **Deopts**: count and reasons from `--trace-deopt`.
   - **Inline caches**: monomorphic vs polymorphic vs megamorphic from `--log-ic` (`start:deopt` already logs them for [Deopt Explorer](https://github.com/microsoft/deoptexplorer-vscode)).
   - **Shapes and inlining**: hidden-class transitions on the objects the change creates (`--log-maps`), and whether the callers still inline it (`--trace-turbo-inlining`).
   - **Throughput**: the relevant benchmark suite (see the benchmarking rule) or a `micro.js` case, same machine, same session.
3. **Weigh revisions**: for any new deopt, IC going poly/megamorphic, shape instability or lost inlining, try a revision (stable property order, monomorphic helpers, hoisting `try`/`catch` out of the hot function) and re-measure. Throughput decides. When throughput is flat, keep the better V8 state: benchmarks see fewer shapes than real apps, so a call site gone polymorphic costs more in production than the benchmark shows.
4. **Report** the before/after measurements in the PR description.
