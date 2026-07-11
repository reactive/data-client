window.BENCHMARK_DATA = {
  "lastUpdate": 1783806278169,
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
      }
    ]
  }
}