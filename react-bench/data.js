window.BENCHMARK_DATA = {
  "lastUpdate": 1774216941687,
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
          "id": "ee441c65a86fa5a8528aa00f810b567bd643974d",
          "message": "demo(benchmark-react): add baseline framework for raw React comparison (#3809)\n\n* demo(benchmark-react): add baseline framework for raw React comparison\n\nAdd a \"baseline\" framework that uses only React primitives (useState +\nuseEffect) with zero global caching. Each component independently\nfetches its own data, providing a true zero-library comparison point\nfor all existing benchmark scenarios.\n\nMade-with: Cursor\n\n* docs: Update readme with results",
          "timestamp": "2026-03-21T22:45:56-04:00",
          "tree_id": "f0b3c9bd4fb2dc9a042cdba7fe8ae80ab5e2a12f",
          "url": "https://github.com/reactive/data-client/commit/ee441c65a86fa5a8528aa00f810b567bd643974d"
        },
        "date": 1774147715437,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 57.14,
            "range": "± 0.21",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 26.25,
            "range": "± 0.43",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 217.39,
            "range": "± 2.62",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 156.25,
            "range": "± 12.54",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 22.68,
            "range": "± 1.77",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 188.68,
            "range": "± 17.31",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 238.1,
            "range": "± 36.8",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.35,
            "range": "± 1.18",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 20.62,
            "range": "± 0.23",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 31.85,
            "range": "± 1.01",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 169.49,
            "range": "± 19.46",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 158.73,
            "range": "± 1.67",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 149.25,
            "range": "± 8.97",
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2c98dde3d1522f78cdbd44cc55183cc89f46563f",
          "message": "demo(benchmark-react): Use response-size-based network simulation delays (#3810)\n\nReplace fixed per-method network delays with a formula: 40ms base latency +\n2ms per record in the response. This more realistically models how network\ntime scales with payload size, naturally penalizing large list refetches\nrelative to normalized cache propagation.\n\nMade-with: Cursor",
          "timestamp": "2026-03-22T08:27:40-04:00",
          "tree_id": "c8691579da839bd3b126f25723780720b191d992",
          "url": "https://github.com/reactive/data-client/commit/2c98dde3d1522f78cdbd44cc55183cc89f46563f"
        },
        "date": 1774182629218,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 58.48,
            "range": "± 3.38",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 24.94,
            "range": "± 2.97",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 178.57,
            "range": "± 22.9",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 200,
            "range": "± 25.67",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 26.32,
            "range": "± 2.99",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 172.41,
            "range": "± 21.34",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 208.33,
            "range": "± 19.07",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.42,
            "range": "± 1.14",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 20.96,
            "range": "± 0.17",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 32.57,
            "range": "± 1.03",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 163.93,
            "range": "± 4.59",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 166.67,
            "range": "± 10.57",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 156.25,
            "range": "± 6.86",
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6b79752a4cafff738e7e3af5e9938d405aaa5d25",
          "message": "demo(benchmark-react): reduce variance with in-page sub-iterations (#3811)\n\n* demo(benchmark-react): reduce CI benchmark variance below ±10\n\n- Increase warmup and measurement iterations for CI (small: 5+25, large: 3+20)\n- Tighten convergence targets (small: 5%, large: 8%)\n- Switch from stddev to MAD-based CI margin for robustness against outliers\n- Increase inter-scenario GC settle time from 50ms to 200ms\n\nMade-with: Cursor\n\n* demo(benchmark-react): add in-page sub-iterations and reduce variance\n\n- Run multiple ops per page visit (default 5), returning the median\n  duration as one sample. Eliminates page-navigation overhead between\n  measurements and dramatically reduces variance.\n- Add resetStore() to BenchAPI for clearing caches between mount\n  sub-iterations (data-client, tanstack-query, swr).\n- Vary mutation data each sub-iteration (incrementing counter for\n  titles, toggling moveItem direction) to ensure real DOM changes.\n- Add waitForPaint between mutation sub-iterations to prevent\n  server-resolution renders from bleeding into the next measurement.\n- Report variance as percentage instead of absolute values.\n- Reduce warmup/minMeasurement counts since sub-iterations provide\n  sufficient noise reduction.\n- Fix SWR mount sub-iterations: add revalidateOnMount + dedupingInterval: 0\n  to ensure fresh fetches after cache.clear().\n- Update README with latest results showing ~6778% mutation throughput\n  advantage for data-client (up from ~4442% with more accurate measurement).\n\nMade-with: Cursor\n\n* fix: bugbot\n\n* demo(benchmark-react): reduce warmup/measurement counts for faster CI\n\nWith 5 sub-iterations per round providing sufficient noise reduction,\nlower warmup (small: 3→2, large: 2→1) and max measurement caps\n(small CI: 20→15, large CI: 15→12) to cut ~30-40s from CI runtime.\n\nMade-with: Cursor\n\n* Fix benchmark range format for single sample\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* demo(benchmark-react): fix stats bugs and add per-scenario opsPerRound\n\n- Replace z=1.96 with t-distribution critical values for accurate CI\n  on small samples (n=3-15)\n- Fix even-length median calculation in scaledMAD/isConverged/computeStats\n- Fix median===0 premature convergence (now requires margin===0 too)\n- Fix invalidateAndResolve title accumulation bug using fixture data\n- Clamp deleteEntity sub-iteration args to mountCount bound\n- Remove dead cdp parameter from runScenario\n- Add per-scenario opsPerRound override to Scenario type\n- Set opsPerRound=9 for update-entity-sorted, =5 for list-detail-switch-10\n- Update README with remeasured results and variance tiers\n\nMade-with: Cursor\n\n---------\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-03-22T17:58:32-04:00",
          "tree_id": "a9437cb1732c7fd22fc8a0c1c593c9376a03aa0b",
          "url": "https://github.com/reactive/data-client/commit/6b79752a4cafff738e7e3af5e9938d405aaa5d25"
        },
        "date": 1774216938920,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 129.89,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 31.95,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 339.08,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 36.23,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 357.14,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 90.09,
            "range": "± 3.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 40.98,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 241,
            "range": "± 2.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 168.17,
            "range": "± 4.5%",
            "unit": "ops/s"
          }
        ]
      }
    ]
  }
}