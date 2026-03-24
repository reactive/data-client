window.BENCHMARK_DATA = {
  "lastUpdate": 1774389040965,
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
          "id": "57b2f975c81e9fa9d4d9d2f36dbc93e719549e05",
          "message": "demo(benchmark-react): collapse outer/inner loops into convergent single-page mode (#3812)\n\nTiming scenarios (navigation + mutation) now run on a single page load\nwith adaptive convergence instead of reloading the page per outer round.\nEach sub-iteration produces one sample and convergence is checked inline,\neliminating page-reload overhead for ~3x faster runs with tighter CIs.\n\n- Add CONVERGENT_CONFIG with per-size warmup/measurement/target settings\n- Add runScenarioConvergent() with inline stat-sig convergence\n- Extract shared helpers (setupBenchPage, runPreMount, runIteration,\n  classifyAction) to eliminate duplication between both runner paths\n- Add periodic GC (every 15 iterations) to prevent heap pressure\n- Fix tracing index to fire early so early convergence doesn't skip it\n- Memory and ref-stability scenarios unchanged (need clean page / single run)\n- Update README methodology and measured results tables\n\nMade-with: Cursor",
          "timestamp": "2026-03-22T19:34:35-04:00",
          "tree_id": "7d65715c38afbdc77dc9e16b0b5ff255d403d7c6",
          "url": "https://github.com/reactive/data-client/commit/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05"
        },
        "date": 1774222615655,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 169.49,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 46.95,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 434.78,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 400,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.52,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 400,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.14,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 109.89,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 48.54,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 317.54,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 434.78,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 212.86,
            "range": "± 6.3%",
            "unit": "ops/s"
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
          "id": "7d1363be1e5f6913e52ac874789882ff6ea01504",
          "message": "pkg: Update `typescript` to v6.0.2 (#3814)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-03-23T18:50:35-04:00",
          "tree_id": "2e3fa17dcd61aad37ad3b22c187da241ead6409b",
          "url": "https://github.com/reactive/data-client/commit/7d1363be1e5f6913e52ac874789882ff6ea01504"
        },
        "date": 1774306371027,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 178.57,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.86,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 476.19,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 392.31,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.05,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 370.37,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 400,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.56,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 101.02,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 48.08,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 322.58,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 454.55,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 227.27,
            "range": "± 3.9%",
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
          "id": "b75d858b04bd31fdadaee925694f37c78432ab44",
          "message": "demos(benchmark-react): baseline should also use resources",
          "timestamp": "2026-03-23T18:56:11-04:00",
          "tree_id": "c48c87c09ad56b8468e8af2577ec638c9d906ca0",
          "url": "https://github.com/reactive/data-client/commit/b75d858b04bd31fdadaee925694f37c78432ab44"
        },
        "date": 1774306708166,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 166.67,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.82,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 400,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 393.52,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.25,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10.58,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 85.47,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 43.48,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 285.71,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 408.33,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 208.42,
            "range": "± 4.4%",
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
          "id": "e6f05d727bc755369050a9f2df9c1fbbc1fed814",
          "message": "docs: Improve benchmark explanation clarity",
          "timestamp": "2026-03-23T18:56:31-04:00",
          "tree_id": "61dc43a7731808f8dc4d0e8da4542145991f47d5",
          "url": "https://github.com/reactive/data-client/commit/e6f05d727bc755369050a9f2df9c1fbbc1fed814"
        },
        "date": 1774306844880,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 173.93,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 45.05,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 513.16,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 454.55,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.75,
            "range": "± 1.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 416.67,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 384.62,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.24,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 107.53,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 50.77,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 307.77,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 384.62,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 232.56,
            "range": "± 5.6%",
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
          "id": "b3b1b618c61f6d8b09237714195400c06c3b7ba7",
          "message": "pkg: Switch from @js-temporal/polyfill to temporal-polyfill (#3815)\n\ntemporal-polyfill is 60% smaller (19.8 KB vs 51.9 KB gzip), same spec\ncompliance, and avoids JSBI. Website playground now uses native Temporal\nAPI when available (Chrome/Firefox/Edge) with polyfill fallback for\nSafari and older browsers.\n\nMade-with: Cursor",
          "timestamp": "2026-03-24T17:48:14-04:00",
          "tree_id": "be65be9d448f776575a0203e360c5ef5b9a17f8c",
          "url": "https://github.com/reactive/data-client/commit/b3b1b618c61f6d8b09237714195400c06c3b7ba7"
        },
        "date": 1774389037954,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 166.67,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.86,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 454.55,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 417.39,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.25,
            "range": "± 3.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 400,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.03,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 90.5,
            "range": "± 2.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 47.62,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 312.5,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 357.14,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 204.08,
            "range": "± 5.0%",
            "unit": "ops/s"
          }
        ]
      }
    ]
  }
}