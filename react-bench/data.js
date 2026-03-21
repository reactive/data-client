window.BENCHMARK_DATA = {
  "lastUpdate": 1774122723426,
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
          "id": "9db74337617b418bbd4f9fcc80159118bc086b0a",
          "message": "internal: Remove unused actions/cache from benchmark workflows (#3797)\n\nThe rhysd/github-action-benchmark action fetches data directly from\ngh-pages-bench branch \u2014 the actions/cache steps were never used.\nAlso set name: 'Benchmark React' so PR comments are distinguishable.\n\nMade-with: Cursor",
          "timestamp": "2026-03-19T22:23:21-04:00",
          "tree_id": "5e9f36c640881a0736c7ffee66196023cf5646aa",
          "url": "https://github.com/reactive/data-client/commit/9db74337617b418bbd4f9fcc80159118bc086b0a"
        },
        "date": 1773973541834,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 22.2,
            "range": "\u00b1 0.79",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 35.8,
            "range": "\u00b1 6.65",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 89,
            "range": "\u00b1 0.20",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12.1,
            "range": "\u00b1 0.40",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7.5,
            "range": "\u00b1 0.11",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.7,
            "range": "\u00b1 0.11",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 6.5,
            "range": "\u00b1 0.81",
            "unit": "ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "eeda4b5a7207414788b52aa37fd52bb70fb7392a",
          "message": "pkg: Update build packages (#3798)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-03-19T22:48:22-04:00",
          "tree_id": "b4d6795fcedebee0b528f675e3a2b21e90c7380a",
          "url": "https://github.com/reactive/data-client/commit/eeda4b5a7207414788b52aa37fd52bb70fb7392a"
        },
        "date": 1773975039673,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 21.2,
            "range": "\u00b1 1.67",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 33.7,
            "range": "\u00b1 1.37",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 83.7,
            "range": "\u00b1 0.49",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12,
            "range": "\u00b1 0.75",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 8,
            "range": "\u00b1 0.97",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.3,
            "range": "\u00b1 0.4",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.7,
            "range": "\u00b1 0.24",
            "unit": "ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e4371dea9bf8da1989affe182220ed619ae6046e",
          "message": "pkg: Update all non-major dependencies (#3800)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-03-20T08:57:17-04:00",
          "tree_id": "3d06403090685c74206453f42dee7ec60ddb5a65",
          "url": "https://github.com/reactive/data-client/commit/e4371dea9bf8da1989affe182220ed619ae6046e"
        },
        "date": 1774011567938,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 21.4,
            "range": "\u00b1 2.29",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 33.1,
            "range": "\u00b1 3.14",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 84.6,
            "range": "\u00b1 1.08",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12,
            "range": "\u00b1 1.52",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7.4,
            "range": "\u00b1 0.52",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.1,
            "range": "\u00b1 0.24",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5,
            "range": "\u00b1 0.62",
            "unit": "ms"
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
          "id": "42114c89cde166f7715a3c776fd8c02b5fef292c",
          "message": "demo(benchmark-react): replace react-window with renderLimit (#3803)\n\nDrop react-window in favor of plain keyed lists with a configurable\nrenderLimit that caps DOM rendering while keeping all data in the store.\nThis decouples store size from DOM pressure and lets React reconcile\nby key instead of index.\n\nAlso:\n- Rename scenarios for clarity (update-entity, update-user, etc.)\n- Increase default mountCount to 1000 for update/ref-stability scenarios\n- Make React Compiler the default build (opt-out with REACT_COMPILER=false)\n\nMade-with: Cursor",
          "timestamp": "2026-03-21T12:39:15-04:00",
          "tree_id": "81ad3ea0abee5aeafb07535e18258410a8cd971c",
          "url": "https://github.com/reactive/data-client/commit/42114c89cde166f7715a3c776fd8c02b5fef292c"
        },
        "date": 1774111303061,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 17.2,
            "range": "\u00b1 1.57",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.3,
            "range": "\u00b1 2.35",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 4.1,
            "range": "\u00b1 0.26",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 4.7,
            "range": "\u00b1 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 39.7,
            "range": "\u00b1 1.86",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 4.7,
            "range": "\u00b1 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 149.9,
            "range": "\u00b1 27.82",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 21.5,
            "range": "\u00b1 0.20",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 28.8,
            "range": "\u00b1 1.33",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 5.3,
            "range": "\u00b1 0.36",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 4.3,
            "range": "\u00b1 0.13",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 6,
            "range": "\u00b1 0",
            "unit": "ms"
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
          "id": "ea591a4956574bd1b4ec329e6376b0621674707a",
          "message": "demo(benchmark-react): DRY runner and scenario definitions (#3804)\n\nExtract shared helpers (runRound, recordResult, warmupCount) to\neliminate three copies of the lib-iteration loop. Consolidate three\nparallel result maps into a single Map<string, ScenarioSamples>.\nDerive BaseScenario from Scenario via Omit so new fields flow\nthrough automatically, and replace the 12-line manual property\nmapping with destructure + spread. Simplify react-commit eligibility\nfrom a 10-action list to !scenario.resultMetric. Remove dead startup\ncode. Skip data-client-only scenarios when benchmarking all\nframeworks. Update README with measured results table.\n\nMade-with: Cursor",
          "timestamp": "2026-03-21T13:26:05-04:00",
          "tree_id": "76ef9f78f8f3b7d6d6395279c28dc7237d561d43",
          "url": "https://github.com/reactive/data-client/commit/ea591a4956574bd1b4ec329e6376b0621674707a"
        },
        "date": 1774114093738,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 15.4,
            "range": "\u00b1 1.25",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.5,
            "range": "\u00b1 2.84",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 3.8,
            "range": "\u00b1 0.49",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 4.3,
            "range": "\u00b1 0.1",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 35.6,
            "range": "\u00b1 0.2",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 4.3,
            "range": "\u00b1 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 128.9,
            "range": "\u00b1 3.72",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 18.4,
            "range": "\u00b1 0",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 28.5,
            "range": "\u00b1 2.14",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 4.9,
            "range": "\u00b1 0.35",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 3.8,
            "range": "\u00b1 0.41",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.9,
            "range": "\u00b1 0.26",
            "unit": "ms"
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
          "id": "9c22178c9f456b3ff90fc8e9fac7fcaa59cced95",
          "message": "demo(benchmark-react): improve measurement stability (#3805)\n\nReduce benchmark variance and improve result reliability:\n\n- IQR outlier trimming in stats (single GC spikes no longer widen CI)\n- Force V8 GC via CDP between scenarios and after pre-mount\n- Shuffle scenario order within each library to eliminate ordering bias\n- Bump minMeasurement (small: 3\u21925, large: 2\u21923) for more reliable convergence\n- Increase large maxMeasurement in CI (4\u21926) for more convergence headroom\n\nMade-with: Cursor",
          "timestamp": "2026-03-21T14:30:39-04:00",
          "tree_id": "b0dc49d86989bbbe0bc445ab6cb258fbc6b8dc41",
          "url": "https://github.com/reactive/data-client/commit/9c22178c9f456b3ff90fc8e9fac7fcaa59cced95"
        },
        "date": 1774118000698,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 17.2,
            "range": "\u00b1 0.65",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.9,
            "range": "\u00b1 0.79",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 4.3,
            "range": "\u00b1 0.27",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 6.4,
            "range": "\u00b1 0.3",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.7,
            "range": "\u00b1 4.74",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 5.6,
            "range": "\u00b1 0",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 144.3,
            "range": "\u00b1 22.87",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 32.5,
            "range": "\u00b1 2.84",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 31.6,
            "range": "\u00b1 0.71",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 6.4,
            "range": "\u00b1 0.32",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 5.3,
            "range": "\u00b1 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 9.7,
            "range": "\u00b1 0.61",
            "unit": "ms"
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
          "id": "655b42ec2fc529f46d04d16f098d25b6e4229786",
          "message": "demo(benchmark-react): add multi-view entity update scenario (#3806)\n\n* demo(benchmark-react): add multi-view entity update scenario\n\nAdd `update-entity-multi-view` benchmark where the same issue entity\nis displayed across three structurally different component trees (list\nrow, detail panel, pinned card strip). A single entity update must\npropagate to all three views, exercising normalized cache cross-query\npropagation vs. multi-query invalidation + refetch.\n\nMade-with: Cursor\n\n* demo(benchmark-react): fix post-mount GC inflating data-client times\n\nRemove forced HeapProfiler.collectGarbage after pre-mount. The full GC\npromoted all recently-allocated entities into V8's old generation,\ncausing write-barrier overhead during the timed action that\ndisproportionately penalized data-client's CPU-bound optimistic updates\n(~1.8x inflation) while leaving network-bound libraries unaffected.\n\nAlso re-measure all scenarios and reorganize the README summary table\ninto Navigation / Mutations / Scaling categories.\n\nMade-with: Cursor\n\n* demo(benchmark-react): fix initMultiView double-setComplete race\n\nmeasureMount's MutationObserver called setComplete() (setting\ndata-bench-complete) as soon as list items appeared, before the\ndetail panel and pinned card views were ready. The runner could\nsee this premature signal, proceed to the timed update phase, and\nthen receive a stale second setComplete() \u2014 corrupting the\nmeasurement.\n\nRefactor measureMount to return a Promise and accept\n{ signalComplete: false } so initMultiView can suppress the\nearly completion signal and call setComplete() once after all\nthree views are ready.\n\nMade-with: Cursor",
          "timestamp": "2026-03-21T15:49:17-04:00",
          "tree_id": "22ad1269a8920fd7acf0339019b75ee2dcebe997",
          "url": "https://github.com/reactive/data-client/commit/655b42ec2fc529f46d04d16f098d25b6e4229786"
        },
        "date": 1774122721101,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 17,
            "range": "\u00b1 0.2",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.6,
            "range": "\u00b1 2.66",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 5.1,
            "range": "\u00b1 0.51",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "\u00b1 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 6.2,
            "range": "\u00b1 0.71",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.9,
            "range": "\u00b1 5.27",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 6.6,
            "range": "\u00b1 1.05",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 4.4,
            "range": "\u00b1 0.69",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 143.8,
            "range": "\u00b1 22.22",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 47.4,
            "range": "\u00b1 2.21",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 31.1,
            "range": "\u00b1 0.6",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7,
            "range": "\u00b1 0.9",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 6.2,
            "range": "\u00b1 0.47",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 6.5,
            "range": "\u00b1 0.09",
            "unit": "ms"
          }
        ]
      }
    ]
  }
};