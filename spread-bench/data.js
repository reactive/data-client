window.BENCHMARK_DATA = {
  "lastUpdate": 1791127308821,
  "repoUrl": "https://github.com/reactive/data-client",
  "entries": {
    "Benchmark Spread": [
      {
        "commit": {
          "author": {
            "email": "me@ntucker.me",
            "name": "Nathaniel Tucker",
            "username": "ntucker"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f3b96b0784ba3cf5188c3d21a1eec4e1a04a0927",
          "message": "bench: Add degenerate-case spread benchmarks and memory pressure measurement (#4014)\n\n* bench: Add degenerate-case spread benchmarks and memory pressure script\n\nSpread operations in the core write path scale with store size rather\nthan payload size (per-type entity map clone in NormalizeDelegate,\nendpoints/meta spreads in setResponseReducer, Collection pushMerge).\n\nAdds a 'spread' Benchmark.js suite measuring the degenerate cases\n(single-entity setResponse into 1k/10k/100k stores plus a flat control,\n10k cached endpoints, collection push, invalidateAll/expireAll) and a\nstart:memory script reporting allocation/op, GC churn, and retained\nheap. Scenario fixtures build lazily per filter.\n\nOne fast stable case (setOneEntity in 10k entity store) is tracked over\ntime via a new benchmark-spread.yml workflow that triggers only on\nstore-write code paths and reports to a separate spread-bench history\ndir; everything else is manual-only.\n\n* bench: Simplify spread benchmark harness\n\n- Un-export schemas.js fixtures only used internally (FlatItem,\n  ControlItem, list endpoints, collection, buildControlItemData)\n- buildManyEndpointsState no longer builds an n-entity store the\n  endpoint-spread scenarios never depended on (faster cold start)\n- Table-drive the setOneEntity 1k/10k/100k sweep scenarios\n- Drop redundant second filter pass in spread.js (buildScenarios\n  already filters); name the collection push id offset\n- memory.js samples heap every 10 ops so the sampler's own\n  allocations stay out of allocated/op and GC counts\n\n* bench: Clarify spread benchmark fixtures and metrics",
          "timestamp": "2026-07-11T17:43:43-04:00",
          "tree_id": "bf919d7ff0e850a80cfdabe5ceb0bd4bd19ad9ce",
          "url": "https://github.com/reactive/data-client/commit/f3b96b0784ba3cf5188c3d21a1eec4e1a04a0927"
        },
        "date": 1783806275054,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 133,
            "range": "±0.92%",
            "unit": "ops/sec",
            "extra": "84 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "me@ntucker.me",
            "name": "Nathaniel Tucker",
            "username": "ntucker"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "38dbb5264961dfd86ba16311653b9428b7e160a7",
          "message": "internal: Run GitHub Actions on Node 26 (#4025)\n\nAlign GH Actions with CircleCI and .nvmrc on the Current Node line.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>",
          "timestamp": "2026-07-12T11:30:54-04:00",
          "tree_id": "2b0517093a0d08ad4c1a9753eb5a14427fb607da",
          "url": "https://github.com/reactive/data-client/commit/38dbb5264961dfd86ba16311653b9428b7e160a7"
        },
        "date": 1783870308145,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 153,
            "range": "±0.97%",
            "unit": "ops/sec",
            "extra": "86 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "me@ntucker.me",
            "name": "Nathaniel Tucker",
            "username": "ntucker"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b4b502d545aab0cf75bf030f3de4607a2e3ab7dc",
          "message": "fix(types): Fix TS 4.x legacy types with skipLibCheck off; internal(ci): fail-open esmodule relevance, faster rest legacy types (#4122)\n\n* internal(ci): Fail open on esmodule relevance and speed up rest legacy types\n\nThe esmodule relevance flag now uses a denylist of provably irrelevant\npaths, so new inputs run the esmodule jobs by default. rest's legacy\ntypes build uses scripts/build-legacy-types.sh (direct downlevel-dts,\nd.ts-only copies) with --newer-overlays-last to keep its overlay order;\nts4.0/ts4.1 output is byte-identical (8.6s -> 4.5s locally).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEcQdob4nGVuMq91oUHC2V\n\n* internal(ci): Simplify legacy types overlay order and share docs-only paths\n\nDownlevel always runs first; --inherit-newer-overlays (rest) then applies\nearlier versions' custom types. Without the flag those copies were always\noverwritten by downlevel-dts, so endpoint/normalizr output is unchanged\n(ts*/ byte-identical). The esmodule and tests relevance checks now share\none DOCS_ONLY path list.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEcQdob4nGVuMq91oUHC2V\n\n* fix(types): Apply newer legacy type overlays to older TS outputs (#4138)\n\n* fix(types): Apply newer legacy type overlays to older TS outputs\n\nendpoint and normalizr legacy outputs (ts4.2, ts4.0, ts3.4) now inherit\nevery newer version's src-*-types overlay, as rest already did. This\nreplaces the TS 5.4 NoInfer builtin with the NI<T> = T fallback for\nTS < 4.8 consumers.\n\nnormalizr re-exports memo types by name instead of `export type *`\n(TS 5.0 syntax that downlevel-dts leaves as is).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n* docs(blog): Note legacy TypeScript types fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>\n\n* fix(types): Fix endpoint/rest legacy type errors with skipLibCheck off (#4140)\n\n* fix(types): Apply newer legacy type overlays to older TS outputs\n\nendpoint and normalizr legacy outputs (ts4.2, ts4.0, ts3.4) now inherit\nevery newer version's src-*-types overlay, as rest already did. This\nreplaces the TS 5.4 NoInfer builtin with the NI<T> = T fallback for\nTS < 4.8 consumers.\n\nnormalizr re-exports memo types by name instead of `export type *`\n(TS 5.0 syntax that downlevel-dts leaves as is).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n* docs(blog): Note legacy TypeScript types fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n* fix(types): Fix endpoint/rest legacy type errors with skipLibCheck off\n\n- TS 4.0: unroll RemoveArray and approximate PartialArray (recursive\n  conditional types need 4.1) in new src-4.0-types overlays\n- TS <4.2: rewrite `abstract new` to `new` in the downleveled output and\n  drop the stale src-4.0-types Entity/EntityTypes copies\n- TS 4.2: ConstructorInstance<> replaces InstanceType<> on abstract TBase\n- TS 4.2-4.4: UnionInstance Args is unconstrained\n- TS 4.0-4.5: rest getPage narrows paginationField with Extract<>\n- CI: esmodule-types also typechecks a skipLibCheck: false consumer\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* docs(blog): Link #4140 in v0.19 notes\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* refactor(types): Isolate recursive tuple types so the 4.0 overlay is one small file\n\n- RemoveArray and PartialArray move to tupleTypes.ts; the src-4.0-types\n  overlay replaces only that module instead of copying endpointTypes/utility\n- Legacy build only rewrites files that contain `abstract new (`\n- libcheck typetest skips TypeScript's own lib checks\n- Split the legacy types bullet in ci-config.mdc\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* internal: Resolve leftover merge conflict in ci-config rule\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* internal: Resolve leftover merge conflict in build-legacy-types.sh\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>\n\n* internal(ci): Harden legacy types script and libcheck lib/ on latest TS\n\nversion_lt compares major.minor in bash instead of relying on sort -V\n(a missing -V silently skipped the abstract new rewrite), and the\nabstract new grep no longer fails the build under pipefail when nothing\nmatches. esmodule-types-latest also runs the skipLibCheck: false\ntypetest so lib/ is checked on the newest compiler.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEcQdob4nGVuMq91oUHC2V\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T11:20:54-04:00",
          "tree_id": "1a3cb0f4485f4588e2bb3560c1844f78bad1da11",
          "url": "https://github.com/reactive/data-client/commit/b4b502d545aab0cf75bf030f3de4607a2e3ab7dc"
        },
        "date": 1791127305654,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 155,
            "range": "±0.95%",
            "unit": "ops/sec",
            "extra": "87 samples"
          }
        ]
      }
    ]
  }
}