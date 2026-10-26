---
paths:
  - "packages/normalizr/src/**"
  - "packages/core/src/**"
  - "packages/endpoint/src/**"
  - "packages/rest/src/**"
  - "packages/react/src/**"
---
<!-- Generated from .cursor/rules/v8-optimization.mdc by `yarn build:agent-rules`. Edit the source. -->


# V8 optimization check

When a change to code that runs per entity, per render or per request could change how V8 optimizes it (shapes or property order, call-site polymorphism, `try`/`catch`, `arguments`, `delete`, closures or spreads in loops), spawn a fast subagent to measure base vs change: **Haiku** in Claude Code (Agent tool, `model: "haiku"`), **Grok 4.7 Fast** at medium in Cursor. Give it the changed functions, the base ref, and the suite and filter to run. Skip it for comments, types, strings and renamed locals; renamed object properties do change shapes.

| Changed package | Harness | Build each ref first | Can measure |
| --- | --- | --- | --- |
| normalizr, core, endpoint | `examples/benchmark` | `yarn build:benchmark` (suites import `dist/`) | everything below |
| react, rest | `examples/benchmark-react` | `yarn build:benchmark-react`, then `preview` | `bench:trace` (opt/deopt) and `bench:deopt` (`--prof`) only; report the rest as not measured |

Measure the base in a separate `git worktree` (run `yarn install` there first), so neither side's checkout or `dist/` is stale. Always pass a narrow filter: unfiltered traces and logs run to many MB.

- **Optimization status**: `SHOW_OPTIMIZATION=1` prints [printStatus.js](../../examples/benchmark/printStatus.js) for the functions listed in the `complete` handler of the core, entity, micro and normalizr suites. To check another function, add `printStatus(fn)` there (it must be exported from `examples/benchmark/src/index.ts`).
- **Deopts**: `--trace-deopt`.
- **Inline caches and shapes**: `--log-ic --log-maps --logfile=v8.log --no-logfile-per-isolate`. IC lines read `…,old,new,map,key,,` (two empty fields follow the key), states `0` uninitialized, `1` monomorphic, `P` polymorphic, `N` megamorphic. Lines carry no file and positions differ between the two builds, and Node internals log ICs too, so compare per property `key` that the changed code reads or writes: count lines reaching `P` or `N` on each ref, e.g. `grep -E 'IC,.*,(P|N),[^,]*,myKey,' v8.log | wc -l`.
- **Inlining**: `--trace-turbo-inlining`.
- **Throughput**: a separate run without trace or log flags (they slow V8), several runs per ref on one machine in one session. Use the relevant suite (see the benchmarking rule) or a `micro.js` case.

Gotcha: V8 flags go before `./index.js`. After it (`yarn start --trace-deopt`) the flag is read as the suite name, matches none, and the whole default suite runs untraced:

```bash
cd examples/benchmark && NODE_ENV=production node --allow-natives-syntax --trace-deopt ./index.js normalizr 'denormalizeLong withCache'
```

For any new deopt, `P`/`N` IC, unstable shape or lost inlining in a changed function, try a revision (stable property order, monomorphic helpers, `try`/`catch` hoisted out) and re-measure. A version faster by more than the run-to-run spread wins. Otherwise keep the one with fewer deopts and polymorphic ICs in the changed functions, since benchmarks see fewer shapes than real apps, unless it adds bundle size (the benchmarking rule requires a measured gain for that). Put the before/after numbers, and any V8 regression you kept, in the PR description.
