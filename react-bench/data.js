window.BENCHMARK_DATA = {
  "lastUpdate": 1774142524433,
  "repoUrl": "https://github.com/reactive/data-client",
  "entries": {
    "Benchmark React": [
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
          "id": "8058a03829a100a7b99afcd25f9cb0715973b350",
          "message": "demo(benchmark-react): report ops/s instead of ms (#3808)\n\n* demo(benchmark-react): report ops/s instead of ms for CI consistency\n\nThe Node benchmark (benchmark.yml) reports ops/sec via Benchmark.js,\nwhile the React benchmark reported milliseconds. Switch to ops/s\n(1000/ms) with customBiggerIsBetter so both benchmark graphs use\nthe same units. Non-duration metrics (ref-stability counts, heap\nbytes) are unchanged.\n\nMade-with: Cursor\n\n* demo(benchmark-react): parameterize list-detail-switch navigations\n\nRename list-detail-switch → list-detail-switch-10 to include the\nnavigation count in the scenario name. Refactor listDetailSwitch()\nto accept (navigations, seedCount) instead of a single n that was\nused for both seeding and a hardcoded loop. Add machine specs after\nthe results table.\n\nMade-with: Cursor\n\n* docs: Add specs to bench table\n\n* demo(benchmark-react): exclude ref-stability from CI runs\n\nRef-stability scenarios emit `count` (lower is better) which is\nincompatible with the customBiggerIsBetter CI tool, causing silent\nmissed regressions. Exclude deterministic scenarios from CI; they\nremain available for local comparison runs.\n\nMade-with: Cursor\n\n* bugbot\n\n* enhance: Better design",
          "timestamp": "2026-03-21T21:06:25-04:00",
          "tree_id": "850bcc461b1151dbd33f7b77db8238f56b261c32",
          "url": "https://github.com/reactive/data-client/commit/8058a03829a100a7b99afcd25f9cb0715973b350"
        },
        "date": 1774141739690,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 60.61,
            "range": "± 3.15",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 25.91,
            "range": "± 0.82",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 227.27,
            "range": "± 18.45",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 175.44,
            "range": "± 31.31",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 24.75,
            "range": "± 3.38",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 200,
            "range": "± 9.07",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 204.08,
            "range": "± 31.42",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.76,
            "range": "± 0.89",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 22.99,
            "range": "± 1.31",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.01,
            "range": "± 1.48",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 172.41,
            "range": "± 15.21",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 166.67,
            "range": "± 17.87",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 161.29,
            "range": "± 0.00",
            "unit": "ops/s"
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
            "email": "me@ntucker.me",
            "name": "Nathaniel Tucker",
            "username": "ntucker"
          },
          "distinct": true,
          "id": "e75a1810c8538512f61e183e8f46663343ec7dc0",
          "message": "docs: Improve bench presentation",
          "timestamp": "2026-03-21T21:19:03-04:00",
          "tree_id": "363abf04242e1df63ff7286d77140566bc9a7810",
          "url": "https://github.com/reactive/data-client/commit/e75a1810c8538512f61e183e8f46663343ec7dc0"
        },
        "date": 1774142521574,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 60.98,
            "range": "± 1.56",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 24.45,
            "range": "± 3.84",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 181.82,
            "range": "± 20.98",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 166.67,
            "range": "± 4.71",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 27.4,
            "range": "± 1.95",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 175.44,
            "range": "± 2.05",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 212.77,
            "range": "± 22.34",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.25,
            "range": "± 0.82",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 18.28,
            "range": "± 0.75",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 33.56,
            "range": "± 1.45",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 151.52,
            "range": "± 18.01",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 156.25,
            "range": "± 6.61",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 144.93,
            "range": "± 2.62",
            "unit": "ops/s"
          }
        ]
      }
    ]
  }
}