window.BENCHMARK_DATA = {
  "lastUpdate": 1793230850974,
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
          "id": "85c9ce31ef45d77fa0c37a7628c564fcc8286d69",
          "message": "internal: Improve bench precision",
          "timestamp": "2026-03-25T08:57:09-04:00",
          "tree_id": "c716085838823417fff829c5670a52758b1a5658",
          "url": "https://github.com/reactive/data-client/commit/85c9ce31ef45d77fa0c37a7628c564fcc8286d69"
        },
        "date": 1774443583644,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 186.93,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.25,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 444.66,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.51,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 400,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 384.62,
            "range": "± 11.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.29,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 101.01,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 45.45,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 263.16,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 434.78,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 232.56,
            "range": "± 3.4%",
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
          "id": "869f28fc651ca5e8b0f935089fc0b8d8ce8585cb",
          "message": "fix(normalizr): Add entity depth limit to prevent stack overflow in denormalization (#3823)\n\n* fix(normalizr): Add entity depth limit to prevent stack overflow in denormalization\n\nLarge bidirectional entity graphs (e.g., Department → Building → Department)\nwith thousands of unique entities cause RangeError: Maximum call stack size\nexceeded during denormalization. The existing same-pk cycle detection doesn't\nhelp because every entity in the chain has a unique pk.\n\nAdd a depth counter (limit 128) at the entity boundary in unvisit. Entities\nbeyond the limit are returned via createIfValid without resolving nested\nschema fields. A console.error is emitted once per denormalize call in dev mode.\n\nBenchmarked with no measurable regression on denormalizeLong (~538 ops/sec\nbefore and after, well within 1-3% run-to-run variance).\n\nCloses #3822\n\nMade-with: Cursor\n\n* test: Improve depth limit coverage for #3822\n\nExpand bidirectional entity graph tests to cover uncovered branches in\ndepthLimitEntity: missing entity at depth boundary, validation failure\nat depth limit, console.error assertion, MemoCache truncation behavior,\nand full resolution within the limit.\n\nMade-with: Cursor\n\n* internal: Include transitive deps in changeset\n\n* internal: Test coverage",
          "timestamp": "2026-03-26T18:33:25-04:00",
          "tree_id": "0149816c8b1ee7ffc09aa2bfa6d99386839ad727",
          "url": "https://github.com/reactive/data-client/commit/869f28fc651ca5e8b0f935089fc0b8d8ce8585cb"
        },
        "date": 1774564547517,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 175.44,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.19,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.76,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 370.37,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 363.76,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.35,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 99.02,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 49.75,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 277.78,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 212.77,
            "range": "± 8.5%",
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
          "id": "be9c53156fdea8c7476c5c0c727e73adcca8ea99",
          "message": "feat(normalizr): Add configurable maxEntityDepth on Entity (#3834)\n\nAllow per-Entity configuration of the denormalization depth limit via\n`static maxEntityDepth`. This lets users lower the limit (default 128)\non entities that participate in deep bidirectional relationships,\nwithout requiring any provider or controller configuration.\n\nThe depth check in `getUnvisit()` now reads `schema.maxEntityDepth`\nwith a fallback to the existing 128 default.\n\nMade-with: Cursor",
          "timestamp": "2026-03-29T14:52:59-04:00",
          "tree_id": "17d2a1eb3ddd74a2c9b8321c513a27ac4ccee6b7",
          "url": "https://github.com/reactive/data-client/commit/be9c53156fdea8c7476c5c0c727e73adcca8ea99"
        },
        "date": 1774810507094,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 181.82,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 48.79,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 434.78,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 48.54,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 339.08,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 416.67,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.35,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 93.03,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 54.95,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 303.03,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 416.67,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 232.56,
            "range": "± 5.2%",
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
          "id": "63633c714b5c041e04891255683e5a899c3d3f22",
          "message": "feat: add Lazy schema for deferred relationship denormalization (#3829)\n\n* feat: add Lazy schema class for deferred relationship denormalization\n\nIntroduces schema.Lazy(innerSchema) that:\n- normalize: delegates to inner schema (entities stored normally)\n- denormalize: no-op (returns raw PKs unchanged)\n- .query getter: returns LazyQuery for use with useQuery()\n\nLazyQuery resolves entities lazily:\n- queryKey: delegates to inner schema if it has queryKey, otherwise passes through args[0]\n- denormalize: delegates to inner schema via unvisit (full entity resolution)\n\nNo changes needed to EntityMixin or unvisit - Lazy.denormalize as no-op\nmeans the existing denormalize loop works without any special handling.\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* test: add comprehensive tests for Lazy schema\n\nTests cover:\n- Normalization: inner entities stored correctly through Lazy wrapper\n- Denormalization: Lazy field leaves raw PKs unchanged (no-op)\n- LazyQuery (.query): resolves array of IDs, delegates to Entity.queryKey,\n  handles missing entities, returns empty for empty IDs\n- Memoization isolation: parent denorm stable when lazy entity changes\n- Stack safety: 1500-node bidirectional graph does not overflow\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* docs: add API documentation for Lazy schema\n\nDocuments the Lazy schema class including:\n- Constructor and usage patterns (array, entity, collection)\n- .query accessor for useQuery integration\n- How normalization/denormalization works\n- Performance characteristics\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* test: rewrite Lazy tests with full scenario coverage\n\nReplaced shallow tests with thorough scenario-based tests (27 total):\n\n- Round-trip: normalize API data → denormalize parent (Lazy stays raw) →\n  LazyQuery resolves to full entities with all fields checked\n- Mixed schema: non-Lazy Manager resolves alongside Lazy buildings on\n  same entity; verified instanceof, field values, paths\n- Dependency tracking: parent paths include Manager but exclude Building;\n  LazyQuery paths include Building PKs but exclude Department\n- LazyQuery edge cases: subset IDs, empty array, missing entity IDs\n  filtered out, single Entity delegation via Building.queryKey\n- Memoization isolation: parent ref equality preserved when Building\n  changes; LazyQuery result updates when entity changes; ref equality\n  maintained on unchanged state\n- Nested Lazy: resolved Building still has its own Lazy rooms as raw IDs;\n  second-level LazyQuery resolves Room entities\n- Bidirectional Lazy: 1500-node chain no overflow; step-through resolution\n  verifying each level's Lazy field stays raw while resolved entity is correct\n- Lazy.queryKey returns undefined (not queryable directly)\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* fix: lint errors and add changeset for Lazy schema\n\n- Prefix unused params with _ to satisfy @typescript-eslint/no-unused-vars\n- Fix prettier formatting (auto-fixed via eslint --fix)\n- Fix import order in schema.d.ts\n- Remove unused imports in test file\n- Add changeset for @data-client/endpoint, rest, graphql (minor)\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* fix: LazyQuery.queryKey skips delegation for non-keyed schemas (Array, Values)\n\nWhen the inner schema is an explicit class instance (e.g. new schema.Array(Building)),\nLazyQuery.queryKey would delegate to the inner schema's queryKey which always returns\nundefined for Array and Values schemas. This caused MemoCache.query to short-circuit\nand return no data, because the args[0] fallback was never reached.\n\nFix: only delegate to inner schema's queryKey when schema.key exists (Entity, Collection),\nwhich distinguishes schemas with meaningful queryKey logic from container schemas\n(Array, Values) that have no-op stubs.\n\nAlso fixes pre-existing TypeScript errors in Lazy.test.ts and adds tests for explicit\nschema.Array and schema.Values inner schemas.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* internal: lint\n\n* enhance: Stricter args typing\n\n* docs: Docs updates\n\n---------\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-03-29T17:53:21-04:00",
          "tree_id": "0724fc3bf227352af400ec1afc5703fe76b58235",
          "url": "https://github.com/reactive/data-client/commit/63633c714b5c041e04891255683e5a899c3d3f22"
        },
        "date": 1774821367500,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 169.49,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.48,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 5.7%",
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
            "value": 51.29,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 350.99,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 357.14,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.85,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 93.46,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 47.96,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 270.27,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 350.99,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 202.04,
            "range": "± 7.3%",
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
          "id": "e54c9b6e6a48939263f41496a90387ee614d35f5",
          "message": "feat(core): Expose __DC_CONTROLLERS__ for programmatic store access via MCP (#3753)\n\n* feat: Expose __DC_CONTROLLERS__ for MCP integration into devtools\n\n* internal(skill): Add devtools debugging reference\n\n* fix(core): guard DevtoolsManager cleanup with identity check\n\nWhen multiple DataProviders use the default DevToolsManager (same\ndevtoolsName), cleanup() unconditionally deleted the __DC_CONTROLLERS__\nmap entry by name. If Provider A unmounts first, it would remove\nProvider B's still-active controller from the map.\n\nAdd an identity check (map.get(name) === this.controller) before\ndeleting so only the instance that currently owns the entry removes it.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* docs: Update skill and blog\n\n---------\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-03-31T09:16:39-04:00",
          "tree_id": "e7cd19090f1f0774819598c48b10d4c8b1538435",
          "url": "https://github.com/reactive/data-client/commit/e54c9b6e6a48939263f41496a90387ee614d35f5"
        },
        "date": 1774963135746,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 178.57,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 46.62,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 434.78,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 384.62,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.25,
            "range": "± 1.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 92.6,
            "range": "± 2.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 51.28,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 322.58,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 416.67,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 219.81,
            "range": "± 5.7%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7727af9a63ec5bab28e3cb73f81e81b0f0d57aec",
          "message": "internal: Publish new version (#3754)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-03-31T09:24:39-04:00",
          "tree_id": "c788f6ad5ea698aa07b5b80be143c824a518ee83",
          "url": "https://github.com/reactive/data-client/commit/7727af9a63ec5bab28e3cb73f81e81b0f0d57aec"
        },
        "date": 1774963661175,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 172.41,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.33,
            "range": "± 3.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 425.72,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 384.62,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 51.55,
            "range": "± 2.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 370.37,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 363.76,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.34,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 116.28,
            "range": "± 2.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 49.51,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 281.75,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 434.78,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 210.55,
            "range": "± 4.5%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9b6c7f4ab82dc45d71dc0e31f5611a532bc6c759",
          "message": "internal: Publish new version (#3846)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-01T09:36:46-04:00",
          "tree_id": "30c87ecdcbb3fcc89308f09a614dc233919f6c30",
          "url": "https://github.com/reactive/data-client/commit/9b6c7f4ab82dc45d71dc0e31f5611a532bc6c759"
        },
        "date": 1775050753884,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 178.57,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 47.28,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 454.55,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 416.67,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.63,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 400,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.33,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 94.34,
            "range": "± 1.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 51.81,
            "range": "± 1.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 312.5,
            "range": "± 2.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 3.0%",
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "80a6e187efe7f75ecff282de81307fb356b6e6f2",
          "message": "internal: Publish new version (#3853)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-02T21:48:41-04:00",
          "tree_id": "9d31494e55c39f5d9df13e052d55ebdcb10f6968",
          "url": "https://github.com/reactive/data-client/commit/80a6e187efe7f75ecff282de81307fb356b6e6f2"
        },
        "date": 1775181064373,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 172.41,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.05,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 434.78,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 400,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 51.42,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 400,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 384.62,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.5,
            "range": "± 11.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 100,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 50.25,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 303.03,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 416.67,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 232.56,
            "range": "± 4.0%",
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
          "id": "9f6caa55ed0f152b13c2a687657d1831c7946780",
          "message": "pkg: Update playwright monorepo to v1.59.1 (#3854)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-03T07:25:01-04:00",
          "tree_id": "2c4dcd13c13234a390ed2f1d8580b722c72edaaf",
          "url": "https://github.com/reactive/data-client/commit/9f6caa55ed0f152b13c2a687657d1831c7946780"
        },
        "date": 1775215632990,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 180.19,
            "range": "± 3.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 48.31,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 526.32,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 476.19,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.29,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 434.78,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 434.78,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.58,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 105.26,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 53.48,
            "range": "± 3.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 363.76,
            "range": "± 2.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 434.78,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 210.55,
            "range": "± 8.8%",
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
          "id": "b3054413396cbc6355e885d6cba6f947a8511cec",
          "message": "pkg: Update `@tanstack/react-query` to v5.96.2 (#3856)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-03T09:48:19-04:00",
          "tree_id": "ac62dec1e39c0200dafb6641c1ec38eb1aee1630",
          "url": "https://github.com/reactive/data-client/commit/b3054413396cbc6355e885d6cba6f947a8511cec"
        },
        "date": 1775224245318,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 169.49,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.05,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 400,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.53,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 4.7%",
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
            "value": 13.74,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 86.21,
            "range": "± 1.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 48.91,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 285.71,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 384.62,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 250,
            "range": "± 3.5%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "53c70910dd4be4e2da5904a7d88212d1c1345df7",
          "message": "internal: Publish new version (#3859)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-03T16:00:27-04:00",
          "tree_id": "92ab65dc3a9d5c8cf3e7f81d74b11a356f6b22db",
          "url": "https://github.com/reactive/data-client/commit/53c70910dd4be4e2da5904a7d88212d1c1345df7"
        },
        "date": 1775246576132,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 172.41,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 49.64,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 500,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 425.72,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.75,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 400,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 416.67,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.32,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 103.09,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 49.76,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 277.78,
            "range": "± 3.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 253.21,
            "range": "± 3.0%",
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
          "id": "17d938bc768b52ac7830978d9ba9f152ed37e680",
          "message": "pkg: Update all non-major dependencies (#3861)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-03T16:36:19-04:00",
          "tree_id": "13b6f920194d6683f8e57777bf01631c26fd4c82",
          "url": "https://github.com/reactive/data-client/commit/17d938bc768b52ac7830978d9ba9f152ed37e680"
        },
        "date": 1775248713527,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 162.61,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.74,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 51.68,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.76,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 91.74,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 50.38,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 294.12,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 235.33,
            "range": "± 2.8%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "aa54c4c8eea9a1ed2b6176d358dadfc75ab7cc01",
          "message": "internal: Publish new version (#3864)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-03T17:58:35-04:00",
          "tree_id": "06349dbc3437cec47a64912299c7cdb5ed15b708",
          "url": "https://github.com/reactive/data-client/commit/aa54c4c8eea9a1ed2b6176d358dadfc75ab7cc01"
        },
        "date": 1775253659369,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 178.57,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 47.39,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 500,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 465.37,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.36,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 454.55,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 400,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.8,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 104.17,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 54.79,
            "range": "± 2.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 344.83,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 416.67,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 238.1,
            "range": "± 4.6%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "be8f8d0990ccf0bdf08a736f2694e97beb8e3946",
          "message": "internal: Publish new version (#3870)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-05T12:40:46-04:00",
          "tree_id": "59557378ffe91c94fc0b774db79f28fe5c06d6c2",
          "url": "https://github.com/reactive/data-client/commit/be8f8d0990ccf0bdf08a736f2694e97beb8e3946"
        },
        "date": 1775407388200,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 170.95,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 48.78,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 500,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 500,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.26,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 384.62,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.87,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 104.17,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 50.38,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 281.75,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 3.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 232.56,
            "range": "± 5.8%",
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
          "id": "467a5f6f9d4cdaf0927fa7e22520c5d2c1462ff5",
          "message": "fix(normalizr): Use Object.keys() in deepClone to avoid inherited properties (#3875)\n\n* fix(normalizr): Use Object.keys() in deepClone to avoid inherited properties\n\nfor...in iterates inherited properties, which could copy polluted\nObject.prototype entries. Object.keys() restricts to own enumerable\nproperties only.\n\nMade-with: Cursor\n\n* internal: Add changeset for deepClone fix\n\nMade-with: Cursor",
          "timestamp": "2026-04-05T16:06:36-04:00",
          "tree_id": "ce62ab9140628d97e477d5266a27ffb97a04b2ae",
          "url": "https://github.com/reactive/data-client/commit/467a5f6f9d4cdaf0927fa7e22520c5d2c1462ff5"
        },
        "date": 1775419746241,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 196.08,
            "range": "± 2.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 46.73,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 425.72,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.14,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 370.88,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 363.76,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.8,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 91.74,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 45.56,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 250,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 384.62,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 243.9,
            "range": "± 3.4%",
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
          "id": "f5797b4deb2b1c24534e29bf7e8b61e9918b20d0",
          "message": "internal(bench-react): Add V8 opt/deopt investigation (#3874)\n\n* internal(bench-react): Add V8 opt/deopt investigation\n\nAdd BENCH_V8_TRACE and BENCH_V8_DEOPT env vars to the React benchmark\nrunner. Trace mode uses launchServer to pipe Chromium's --trace-opt\n--trace-deopt output to v8-trace.log. Deopt mode passes --prof to\nwrite per-process V8 profiling logs to v8-logs/. Convenience scripts\nbench:trace and bench:deopt default to data-client small scenarios.\n\nMade-with: Cursor\n\n* fix: Bugbot\n\n* fix: Stale V8 logs corrupt \"largest file\" heuristic",
          "timestamp": "2026-04-05T16:48:49-04:00",
          "tree_id": "a4f875fc74491bd9c45dc9c098c2501087edae2b",
          "url": "https://github.com/reactive/data-client/commit/f5797b4deb2b1c24534e29bf7e8b61e9918b20d0"
        },
        "date": 1775422267360,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 170.95,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 47.17,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 444.66,
            "range": "± 3.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 416.67,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.49,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 416.67,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 400,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.06,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 94.34,
            "range": "± 0.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 51.55,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 303.03,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 202.04,
            "range": "± 6.1%",
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
          "id": "7d28629d07f6cade43e36f3cf1956f175f98d84f",
          "message": "enhance(normalizr): Pre-allocate dependency slot to avoid Array.unshift() (#3876)\n\nGlobalCache.getResults() called unshift() on every cache-miss denormalization,\nwhich is O(n) because it shifts all existing elements. Pre-allocate slot 0\nwith a placeholder and fill it in-place, turning the operation into O(1).\n\nBenchmarks showed 1.3–3.2% improvement on cold-denormalize paths\n(denormalizeLong variants).\n\nMade-with: Cursor",
          "timestamp": "2026-04-05T21:24:23-04:00",
          "tree_id": "6927928cda221adf761afedef72e8a894ce01c4c",
          "url": "https://github.com/reactive/data-client/commit/7d28629d07f6cade43e36f3cf1956f175f98d84f"
        },
        "date": 1775438799559,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 186.93,
            "range": "± 2.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.55,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 434.78,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 384.62,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.78,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 90.91,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 47.85,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 270.27,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 357.14,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 183.5,
            "range": "± 8.0%",
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
          "id": "98a78318770feaa8433708693bec90b81cbcb1b2",
          "message": "enhance(normalizr): Avoid hidden class mutation in normalize() result (#3878)\n\nThe normalize() return object was constructed with result: '' as any,\nthen mutated via ret.result = visit(...). This causes a V8 hidden class\ntransition when the property type changes from string to the actual\nresult type (array/object/string), triggering \"field type constness\nchanged\" invalidations that deoptimize code depending on this object\nshape.\n\nRestructured to compute the result first and construct the final\nNormalizedSchema in a single step, keeping the object shape stable from\ncreation.\n\nMade-with: Cursor",
          "timestamp": "2026-04-05T21:24:45-04:00",
          "tree_id": "1662fd6671638e3cc96d93dbabd1c59c9870afee",
          "url": "https://github.com/reactive/data-client/commit/98a78318770feaa8433708693bec90b81cbcb1b2"
        },
        "date": 1775438932877,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 177.01,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 48.47,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.13,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 384.62,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.87,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 99.01,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 50.76,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 333.33,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 416.67,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 227.27,
            "range": "± 3.3%",
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
          "id": "f57e9256b8dcc53865e27992edbff0e6a73b7ef8",
          "message": "enhance(normalizr,endpoint): Reduce allocations in hot cache paths (#3879)\n\n* enhance(normalizr,endpoint): Reduce allocations in hot cache paths\n\nInline getCacheKey in GlobalCache to avoid eagerly creating both\nlocalCache and cycleCache Maps per entity type. Replace push(...spread)\nwith an indexed for-loop when copying cached entity dependencies.\n\nPre-create _removeSchema in Collection.CreateMover so normalizeMove\nno longer calls Object.create on every invocation, eliminating hidden\nclass polymorphism that caused V8 \"wrong call target\" deoptimizations.\n\nMade-with: Cursor\n\n* docs: Add optimization rationale comments\n\nMade-with: Cursor\n\n* refactor: Extract getOrCreateLocalCache for readability\n\nMade-with: Cursor",
          "timestamp": "2026-04-06T09:07:09-04:00",
          "tree_id": "0153b754bb74b63d7602339066ffe88456be65e7",
          "url": "https://github.com/reactive/data-client/commit/f57e9256b8dcc53865e27992edbff0e6a73b7ef8"
        },
        "date": 1775480963414,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 173.93,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 49.75,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 513.16,
            "range": "± 5.0%",
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
            "value": 53.48,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 384.62,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.17,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 101.53,
            "range": "± 2.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 56.82,
            "range": "± 1.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 322.58,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 434.78,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 263.16,
            "range": "± 5.0%",
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
          "id": "cc330d669df5e58e19e86746f28c085cdd5d8ec3",
          "message": "internal(bench): Reduce benchmark variance for tighter CI results (#3880)\n\n* internal(bench-react): Reduce benchmark variance for tighter CI results\n\nTighten convergent config (15/10 warmup, 80/60 max iterations, 2%/3% CI\ntargets), add Chromium stability flags, double-GC between scenarios with\nlonger pauses, tune CI system (CPU governor, swap off, robust server wait).\n\nMade-with: Cursor\n\n* internal(bench): Add system tuning to Node benchmark CI\n\nSame CPU governor and swap tuning as bench-react for consistent results.\n\nMade-with: Cursor\n\n* internal(bench): Pin benchmarks to CPU cores via taskset\n\nConfig tuning alone didn't reduce variance — CI runner noise from CPU\nmigration and shared-infrastructure scheduling is the dominant factor.\nPin benchmark processes to cores 0,1 via taskset to eliminate L1/L2\ncache thrashing from core migration. Moderate warmup/iteration counts\nback to reasonable levels since extra iterations can't fix environmental\nnoise.\n\nMade-with: Cursor",
          "timestamp": "2026-04-06T09:32:37-04:00",
          "tree_id": "17fb6b15fcecdab9719cf3ce8e60bc8c805fe318",
          "url": "https://github.com/reactive/data-client/commit/cc330d669df5e58e19e86746f28c085cdd5d8ec3"
        },
        "date": 1775482560596,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 142.86,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.24,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 344.83,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 384.62,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.74,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 357.14,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.88,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 81.3,
            "range": "± 15.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.59,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 227.27,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 196.08,
            "range": "± 5.9%",
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
          "id": "7df6a49ee9fcdac10f9f24ec48c4df0931efa0b0",
          "message": "enhance(normalizr): Lazy-clone entity tables to fix getNewEntities deopt (#3884)\n\ngetNewEntities eagerly cloned entity and meta table POJOs on first\naccess per key, causing a Maglev bailout (\"Insufficient type feedback\nfor generic named access\") because this.entities lacked stable type\nfeedback at optimization time.\n\nMove the clone to setEntity (lazy, on first write per entity type) so\ngetNewEntities stays a pure Map operation that Maglev can optimize and\nkeep optimized. Also extract MetaEntry type alias to reduce repetition.\n\nMade-with: Cursor",
          "timestamp": "2026-04-07T08:40:42-04:00",
          "tree_id": "a4a8c3d5ccbb87c340ca42ffc1320681fdd14a56",
          "url": "https://github.com/reactive/data-client/commit/7df6a49ee9fcdac10f9f24ec48c4df0931efa0b0"
        },
        "date": 1775565830713,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 141.85,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 39.45,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.2,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.86,
            "range": "± 10.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 80.01,
            "range": "± 14.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.84,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 232.56,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 196.08,
            "range": "± 6.0%",
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
          "id": "d23cd80bbbe21d54100ec484c8ec606abdef9523",
          "message": "chore: React Native 0.85, @react-native/jest-preset, React 19.2.3 alignment (#3890)\n\n* pkg: Update react to v19.2.5\n\n* chore: upgrade React Native 0.85, align Jest preset, pin React 19.2.3\n\nBump react-native to 0.85.0, babel-plugin-syntax-hermes-parser to ^0.35.0,\nand add @react-native/jest-preset for the ReactNative Jest project (resolver,\nsetup, env, asset transformer, react-native subpath mapper). Pin react,\nreact-dom, and react-test-renderer to 19.2.3 to match react-native-renderer.\nFix subscriptions.native test import to use @data-client/test.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* chore: remove changeset for internal RN/Jest CI update\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* fix: align package-lock.json react versions to 19.2.3 to match package.json\n\nThe lockfiles for github-app, nextjs, and todo-app had react and react-dom\nat 19.2.5 while their package.json files pinned 19.2.3. This mismatch\nwould cause npm ci to fail. Regenerated lockfiles to resolve correctly.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* fix: remove redundant slash in react-native moduleNameMapper replacement\n\nThe capture group ($|/.*) already includes the leading slash for sub-path\nimports like react-native/Libraries/Text, so the extra / in the\nreplacement template produced double slashes (e.g. <rnDir>//Libraries/Text).\n\nRemoving the redundant / fixes both bare react-native (empty capture)\nand sub-path imports.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* fix(jest): avoid double slash in react-native moduleNameMapper replacement\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-04-09T09:21:35-04:00",
          "tree_id": "1eb6855d9591302e87b00ac8c0ffefe55e639cbc",
          "url": "https://github.com/reactive/data-client/commit/d23cd80bbbe21d54100ec484c8ec606abdef9523"
        },
        "date": 1775741094020,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 134.23,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 39.22,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 333.33,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 327.96,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.76,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.04,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 75.76,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.13,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 222.22,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 312.5,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 177.01,
            "range": "± 6.4%",
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
          "id": "e66cc9872f97955e6804b36f947a8c3007130b17",
          "message": "pkg: Update build packages (#3896)\n\n* pkg: Update build packages\n\n* fix: resolve webpackbar to ^7.0.0 for webpack 5.106 compatibility\n\nWebpack 5.106 enables ProgressPlugin schema validation by default.\nwebpackbar 6.0.1 extends ProgressPlugin and leaks custom options (name,\ncolor, reporters, reporter) into the super constructor, which now fails\nvalidation. webpackbar 7.0.0 properly separates ProgressPlugin options\nfrom its own options.\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>",
          "timestamp": "2026-04-10T09:12:51-04:00",
          "tree_id": "34fdcc48cbee0fc034f7b2d3a546d852e9c403ee",
          "url": "https://github.com/reactive/data-client/commit/e66cc9872f97955e6804b36f947a8c3007130b17"
        },
        "date": 1775826976411,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.06,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.73,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 294.12,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 333.33,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.76,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.46,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 78.12,
            "range": "± 1.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 33.9,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 172.41,
            "range": "± 6.2%",
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
          "id": "5e0b02c50479263fb0a02ec7f1abb69cc34992c4",
          "message": "test(endpoint): add process normalize sequencing tests (#3909)\n\nAdd comprehensive tests verifying that nested entity process() is\ncalled with correct parent, key, and args during normalize, covering\npk derivation, invalidation, validation, deep nesting, and circular\nreferences.\n\nMade-with: Cursor",
          "timestamp": "2026-04-15T09:23:55-04:00",
          "tree_id": "fa0b71b9ded41e1e29b877c3cdebe3d274176f6e",
          "url": "https://github.com/reactive/data-client/commit/5e0b02c50479263fb0a02ec7f1abb69cc34992c4"
        },
        "date": 1776259608469,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.61,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 363.76,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.1,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 298.57,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 10.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.07,
            "range": "± 2.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 70.67,
            "range": "± 14.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.34,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 2.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 185.19,
            "range": "± 5.3%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7f5611aa750b5f6b04003a2b209c85dfd6689255",
          "message": "internal: Publish new version (#3873)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-15T09:50:09-04:00",
          "tree_id": "e118d625aaf915b92c3529b69d52b4c36831f314",
          "url": "https://github.com/reactive/data-client/commit/7f5611aa750b5f6b04003a2b209c85dfd6689255"
        },
        "date": 1776261213058,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.03,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 312.5,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.92,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 270.27,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 303.03,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.25,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.91,
            "range": "± 11.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.97,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 266.71,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 180.19,
            "range": "± 6.2%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4f5b6b6717c403657deb0bdaadce12b80ced6713",
          "message": "internal: Publish new version (#3913)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-15T22:15:21-04:00",
          "tree_id": "0753fb4e2c973e60efafbae161b641f5a497af66",
          "url": "https://github.com/reactive/data-client/commit/4f5b6b6717c403657deb0bdaadce12b80ced6713"
        },
        "date": 1776306220858,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 141.85,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.24,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 377.49,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.74,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 377.49,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.8,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 79.68,
            "range": "± 14.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.36,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 227.27,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 289.92,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 192.31,
            "range": "± 4.5%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a196c0f7d5695c1cd39d8a3fb9c6d24f4c7a17a2",
          "message": "internal: Publish new version (#3915)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-16T07:17:38-04:00",
          "tree_id": "8bb4493dde371b9d3faa6dbb638c5719268b4c2b",
          "url": "https://github.com/reactive/data-client/commit/a196c0f7d5695c1cd39d8a3fb9c6d24f4c7a17a2"
        },
        "date": 1776338454430,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.06,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.1,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 10.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.57,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 307.77,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.59,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.63,
            "range": "± 12.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.09,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 289.92,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 183.5,
            "range": "± 5.3%",
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
          "id": "ce993593a71ff0473c52de2ad320050a7853e2e8",
          "message": "pkg: Update all non-major dependencies (#3917)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-16T20:50:44-04:00",
          "tree_id": "e37ad6e10edc6e5e6f10179f7b5222021080c438",
          "url": "https://github.com/reactive/data-client/commit/ce993593a71ff0473c52de2ad320050a7853e2e8"
        },
        "date": 1776387240572,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.85,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 333.33,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 46.08,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 317.54,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.48,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.91,
            "range": "± 14.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.1,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 238.1,
            "range": "± 2.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 5.0%",
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
          "id": "84078d7d36bf5cf0fd16a479ce16c48c5d804f32",
          "message": "feat(endpoint): add Scalar schema for lens-dependent entity fields (#3887)\n\n* feat(endpoint): add Scalar schema for lens-dependent entity fields\n\nIntroduces Scalar + ScalarCell classes following the Union pattern:\n- Scalar (SchemaSimple, not entity-like) routes normalize/denormalize\n- ScalarCell (entity-like, internal) stores grouped cell data\n- EntityMixin.normalize: if/else to pass whole entity to Scalar\n- EntityMixin.denormalize: completely unchanged (Union-like wrapper)\n- Entity stores lens-independent {id,field} wrappers\n- Denormalize joins correct cell based on endpoint args\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* test(endpoint): add Scalar schema tests\n\nTests cover:\n- normalize stores wrapper refs in entity, cell data in ScalarCell\n- multiple entities, different lenses produce separate cells\n- denormalize joins correct cell based on lens args\n- different lens args produce different results from same entity\n- missing lens returns undefined for scalar fields\n- column-only fetch via Values stores cells without modifying entities\n- column fetch cells joinable via denormalize with Company schema\n- merge accumulation updates existing cells\n- Scalar constructor and queryKey\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* docs(rest): add Scalar schema API documentation\n\nCovers usage (full entity + column-only endpoints), constructor options,\nnormalize/denormalize flow, normalized storage model, and related APIs.\n\nCo-authored-by: natmaster <natmaster@gmail.com>\n\n* Remove dead _lastCpk field from Scalar class\n\n_lastCpk was declared and initialized but never read or written\nelsewhere in the codebase.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* enchance: Better design\n\n* enhance(endpoint): clean up Scalar parent-entity context plumbing\n\nReplace the encoded-key hack with a direct `parentEntity` argument:\n- `EntityMixin.normalize` now dispatches schemas marked `acceptsPrimitives`\n  directly (bypassing `visit`'s primitive short-circuit) and passes `this`\n  as the 7th arg.\n- `Scalar.normalize` reads `parentEntity` to derive entity key and pk; no\n  more parsing `'<entityKey>|<entityPk>|<fieldName>'` out of the visit key.\n- `parent` is now the entity data row (standard `Visit` contract), not the\n  Entity class.\n- `getVisit` and the `SchemaSimple` interface are unchanged — zero impact\n  on the normalize hot path (verified at parity with HEAD across 8-run A/B\n  benchmarks).\n\nMade-with: Cursor\n\n* enhance(normalizr): track parentEntity in visit walker\n\nMove parent-entity context tracking into `getVisit` itself, eliminating\nthe per-schema-type dispatch in `EntityMixin`. The walker now:\n- Maintains a `currentEntity` closure variable, save/restored around\n  every entity visit (schemas with `pk`).\n- Passes it as a 7th `parentEntity` arg to every `schema.normalize` call.\n- Honors a new `acceptsPrimitives` opt-in marker so schemas like `Scalar`\n  receive primitive values instead of being short-circuited.\n\n`EntityMixin.normalize`'s field loop is now a single uniform `visit(...)`\ncall — no more conditional branch for Scalar fields. `Scalar.normalize`\nreads `parentEntity` from the standard 7th arg; `parent` is the entity\ndata row as the standard `Visit` contract specifies.\n\nTrade-off: ~3% normalize-throughput cost on the hot path (closure\nsave/restore around every entity visit). Validated with 8-run A/B\nbenchmarks. Buys a uniform schema contract — Scalar (and any future\ncontext-dependent schema) needs no special case in `EntityMixin`.\n\nMade-with: Cursor\n\n* refactor(normalizr): collapse entity/non-entity branches in visit walker\n\nBoth branches called `schema.normalize` with the same args except for the\nparent-entity context. Snapshot `prev = currentEntity` first, then\nconditionally update `currentEntity = schema` for entities. Pass `prev` —\nwhich equals the prior entity for entities and the still-current entity\nfor non-entities — and unconditionally restore. One call site instead of\ntwo, no behavior change. 8-run A/B benchmarks at parity with the prior\nversion (within noise).\n\nMade-with: Cursor\n\n* internal: Update website types\n\n* fix: visit edge case\n\n* fix(normalizr): tighten table-resident schema check in unvisit\n\nThe `else if` branch for table-resident schemas without `pk` was matching\nany schema exposing a `key` property. `Invalidate` extends PolymorphicSchema\nand exposes `key` via a getter, so it was being routed into `unvisitEntity`\n-> `unvisitEntityObject`, which calls `schema.createIfValid()` -- a method\n`Invalidate` does not implement. This caused `TypeError` on basic Invalidate\ndenormalization and broke deletion/symbol propagation.\n\nSwitch the discriminator to `typeof createIfValid === 'function'`, which is\nthe precise capability `unvisitEntityObject` requires. This matches Scalar\n(which now implements Mergeable) and regular entities, but not Invalidate,\nQuery, Union, etc. -- they continue falling through to their own\n`denormalize` methods.\n\nMade-with: Cursor\n\n* fix: edge cases\n\n* docs: updates\n\n* test(endpoint): cover Scalar merge, denormalize edge cases\n\nAdd direct tests for merge/shouldReorder/mergeWithStore/mergeMetaWithStore\nand denormalize passthroughs (falsy, symbol, object, missing-lens, missing\ncell, cpk string + Values round-trip) to bring Scalar.ts to 100% coverage.\n\nMade-with: Cursor\n\n* docs: Fix\n\n* fix(core): handle Scalar/wrapper schemas in skip-denormalize check\n\n`getResponseMeta` short-circuits `denormalize()` when the endpoint\nschema doesn't transform the response. The previous check\n(`schemaHasEntity`) had two bugs surfaced by Scalar:\n\n1. For `Values(Scalar)` it walked `Object.values(scalarInstance)`,\n   recursed into the `lensSelector` function, and looped forever.\n2. Scalar is table-resident without `pk`, so it was not detected as\n   needing denormalize — the raw cpk strings were returned instead of\n   the joined cell data.\n\nReplace with `requiresDenormalize`, which mirrors `getVisit.ts`:\nschemas that define `normalize` always need denormalize to reconstruct\nthe response. This collapses the entity check, the Scalar special-\ncase, the wrapper `.schema` recursion, and the self-loop guard into a\nsingle early-exit, so schema class instances never fall through to\n`Object.values()` traversal of their instance fields.\n\nAdds regression tests for both `Values(Scalar)` (column-only endpoint)\nand Entity-with-Scalar-fields, with a hard 2s timeout so a re-\nintroduced infinite recursion fails fast rather than hanging Jest.\n\nNet: -89B minified, neutral-to-positive on `core ^get` benchmarks.\nMade-with: Cursor\n\n* docs: Fix types\n\n* internal: Update tests for check for memoization paths\n\n* fix: cache busting with args\n\n* fix: does not over-denormalize a schema map containing string values\n\n* docs: Release notes and migration for breaking changes\n\n* docs(blog): Conform v0.17 release post to blog style guide\n\nAdd nonFilterArgumentKeys feature, embed a Scalar HooksPlayground demo\n(replacing dead imports), recategorize binary auto-detection under\nOther Improvements, and link PR #3887 for the Scalar / denormalize\ndelegate work.\n\nMade-with: Cursor\n\n* internal: Bench and upgrade skill\n\n* refactor(normalizr): drop precomputed key from Dep, pass args to set\n\nMakes the `Dep` shape strictly monomorphic (`{path, entity}` only) by\nremoving the optional `key` field and having `WeakDependencyMap.set`\nre-evaluate `path(args)` when the path is a `KeyFn`. Callers in\n`globalCache` now forward `this._args` to `set`.\n\nBenefits:\n- Eliminates the `wrong map` deopts observed on `WeakDependencyMap.set`\n  and `GlobalCache#paths` caused by the previously polymorphic Dep shape.\n- Simpler, tighter interface -- one fewer field to keep in sync at each\n  `argsKey` call site.\n- Slightly smaller gzipped esm bundle (-17 B); cjs flat.\n\nMacro throughput is statistically unchanged vs the prior shape across\nthe denormalize/normalize suites (all deltas well within 95% CI over\n5 runs). The change is a clarity + deopt-cleanup refactor, not a perf\noptimization.\n\nMade-with: Cursor\n\n* internal: Add WeakDependencyMap microbenchmarks\n\nMade-with: Cursor\n\n* bench: isolate Scalar MemoCache from shared priming\n\nPreviously, the shared `memo` used by Project/User/AllProjects/Values\nbenches was also primed with StockSchema (scalar) entries during suite\nsetup. Cross-schema priming in a single MemoCache perturbs V8\nhidden-class state for downstream cached-path benches — masking real\ndeltas by ~15% on `denormalizeLong Values withCache` and adding\nsystematic noise to other withCache benches.\n\nMove Stock priming to a dedicated `memoStock` MemoCache instance used\nonly by the two Scalar withCache benches. Non-Scalar benches now see\nthe same `memo` shape they did prior to the Scalar PR, so measurements\nare comparable against master.\n\nVerified with 5x full suite runs:\n  denormalizeLong Values withCache: 7273 -> 8674 ops/sec (+19%)\n  other benches within run-to-run noise.\n\nMade-with: Cursor\n\n* perf: restore entity-only fast paths in denormalize cache\n\nRecovers the 3–7% regressions introduced by \"fix: cache busting with\nargs\" (acdb4b161c) on cached denormalize benches. Root cause: `argsKey`\nsupport added unconditional `typeof === 'function'` branches, dynamic\n`push`-based path materialization, and post-hoc filter scans to the\nhot `WeakDependencyMap.get` / `GlobalCache.paths` / `GlobalCache.getResults`\npaths — every caller paid the cost, even entity-only chains.\n\nChanges\n-------\nnormalizr/memo/WeakDependencyMap\n  * Sticky `hasStr` flag: set true only when a `KeyFn` dep is stored.\n  * `get` uses the pre-acdb entity-only loop when `hasStr` is false\n    (common case), and a separate `_getMixed` slow path otherwise.\n  * Expose `hasStringDeps` for consumers to gate their own work.\n\nnormalizr/memo/globalCache\n  * Per-frame `_hasArgsKey` flag set in `argsKey()`.\n  * `paths()` restores pre-allocated `new Array(n)` + indexed writes\n    when no function-typed dep was pushed this frame.\n  * `getResults` skips the function-strip scan on cache hit unless the\n    result WDM has ever stored a string dep.\n\nnormalizr/denormalize/unvisit + schemas/{Array,Object}, endpoint/schemas/\n{Array,Object,Values,EntityMixin}\n  * Hoist `delegate.args` / `delegate.unvisit` out of per-entity and\n    per-array-element loops so hot denormalize walks read a closure\n    local instead of doing a property load per call.\n\nMeasurements (5-run medians, ops/sec, vs a9e9… pre-acdb baseline)\n-----------------------------------------------------------------\n                                           pre   at-acdb   HEAD\n  denormalizeShort 500x                   1234    1198    1583   +28.3%\n  denormalize bidirectional 50            8549    7922   10801   +26.3%\n  denormalizeLong                          437     424     552   +26.3%\n  denormalizeLong with mixin Entity        411     396     515   +25.3%\n  denormalizeLong All withCache          10479   10401   12242   +16.8%\n  denormalizeLong Values                   380     359     439   +15.5%\n  denormalizeLong Query-sorted withCache 10858   10763   12305   +13.3%\n  query All withCache                    11071   10619   12387   +11.9%\n  denormalizeLong withCache              12119   11708   12514   + 3.3%\n  denormalizeLong Values withCache        8879    8692    8875     0.0%\n  queryShort 500x withCache               4792    4556    4494   - 6.2%\n  denormalizeShort 500x withCache        13126   12364   12397   - 5.6%\n\nThe short 500x benches amplify per-call overhead ~500×; the residual\nregression there reflects the unavoidable delegate-object indirection\nstill required for `argsKey` support. Aggregate across the suite is\nstrongly net-positive vs pre-acdb.\n\nTests: packages/normalizr + packages/endpoint — all 680 pass.\nMade-with: Cursor\n\n* docs: Update docs\n\n* internal: More tests\n\n* fix(normalizr): propagate argsKey flag on entity-cache hit\n\nWhen the result cache missed (new input ref) but every entity ref was\nunchanged, `GlobalCache.getEntity` replayed cached deps without running\n`computeValue`, leaving `_hasArgsKey` false. `paths()` then took its\nfast path and leaked function-typed (`argsKey`) deps from the replayed\nchain into the returned `EntityPath[]` subscription list.\n\nSet `_hasArgsKey` on cache hit when the per-entity `WeakDependencyMap`\nhas ever stored a function dep (`hasStringDeps`), keeping the single\nbranch outside the push loop to preserve hidden-class stability on the\nhot path.\n\nMade-with: Cursor\n\n* internal: TODO on Scalar pk context mismatch\n\nScalar.normalize re-derives the enclosing entity's pk without the\n`parent`/`key` context that EntityMixin.normalize uses, so any custom\npk() reading those args would key the Scalar cell under a different id\nthan the entity is stored under.\n\nMade-with: Cursor\n\n* internal: clarify intent of Scalar.denormalize falsy guard\n\nMade-with: Cursor\n\n* internal: trim Scalar.denormalize guard comment\n\nMade-with: Cursor\n\n* docs: Tuning\n\n* docs: Update agents to latest design\n\n* fix(endpoint): guard Scalar.denormalize against truthy non-string primitives\n\nTruthy non-string primitives (e.g. `0.5`, `true`, `42`) previously fell\nthrough the falsy/symbol guard and into `delegate.unvisit(this, input)`.\nSince Scalar has no `pk`, `unvisit`'s `createIfValid` fast path only\nmatches string inputs, so non-string primitives re-dispatched to\n`Scalar.denormalize` — infinite recursion / stack overflow. This can\nsurface during schema migration when Scalar is added to an entity that\nstill has cached raw numeric or boolean field values in the store.\n\nTighten the guard to pass through any non-string, non-object input so\nstale values degrade gracefully instead of crashing.\n\nMade-with: Cursor\n\n* enhance: entityPk + queryKey\n\n* fix(endpoint): scope Scalar.entityPk surrounding-key heuristic to authoritative map keys\n\nPreviously `entityPk` returned any non-undefined `key`, but\n`Array.normalize` forwards the *parent's* field name as `key` to every\nelement. When `[Scalar]` or `Collection([Scalar])` was nested under a\nplain object schema like `{ stock: [Scalar] }`, every item received the\nsame field-name pk, collapsing all cells onto one compound pk and\nsilently corrupting data.\n\nTrust `key` only when the enclosing container literally maps it to the\ncell — `parent[key] === input` — which holds for `Values(Scalar)` (the\nintended use of the surrounding-key heuristic) but not for arrays.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n---------\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-04-28T01:10:04-04:00",
          "tree_id": "9f89073c4c6c55366699e9011782efac2326c655",
          "url": "https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32"
        },
        "date": 1777353192852,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 142.86,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.38,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 377.49,
            "range": "± 10.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.95,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.18,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 95.7,
            "range": "± 12.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 39.22,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 243.9,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 196.08,
            "range": "± 10.0%",
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
          "id": "6e8e499441741b58ad35127b517e8d83fc7a58fd",
          "message": "fix(normalizr): do not mutate cached journey on result-cache hit (#3925)\n\n* chore: rebase PR #3925 onto latest master\n\n* pkg: Bump peerdeps of @data-client/react to support 0.17 (#3927)\n\n* pkg: Bump peerdeps of @data-client/react to support 0.17\n\n* pkg: Update yarn.lock for peerdep bump\n\n* perf(normalizr): store consumer-facing journey at write time (#3928)\n\nMove the per-hit paths.slice(1) (and the hasStringDeps filter loop)\nout of GlobalCache.getResults and into the cache write.\n\nGlobalCache.paths() already produces the placeholder-free,\nfunction-free shape every consumer needs. Hand it to\nWeakDependencyMap.set as the journey, and the cache-hit branch can\nreturn that array by reference - no per-hit allocation, no per-hit\ntypeof === 'function' walk.\n\nSafety: paths is now a shared reference held by every subsequent\nhit. The contract that consumers must not mutate it was established\nby the journey-mutation fix (PR #3925) and is exercised by the\nexisting globalCache.test.ts regression test.\n\n* fix: Scalar reversion\n\n* test(core): add getResponseMeta-paths integration test (non-GC angle) (#3929)\n\n* test(core): replace getResponseMeta-countRef with getResponseMeta-paths\n\nThe previous integration test poked GCPolicy['entityCount'] directly to\nprove the journey-mutation bug. Replace it with a test that asserts the\npublic-API consequence the bug creates outside of GC: every subscriber\nto the same endpoint must observe the same expiresAt from\nController.getResponseMeta().\n\nThis is the property the bug actually broke for non-GC users: with the\nbuggy paths.shift(), entityExpiresAt(paths, …) iterates a\nprogressively-shorter list, dropping the entity with the earliest\nexpiry first. Subscriber 2 observes a too-late expiresAt; subscriber 3+\nobserve Infinity and never refetch. Fires under ImmortalGCPolicy too,\nsince entityExpiresAt is unconditional whenever the endpoint has no\ntop-level meta.expiresAt — typical for state populated via\ncontroller.set(Entity, …), SSR hydration, or useQuery.\n\nVerified the assertion fails on the buggy paths.shift() (m3.expiresAt\nreturns FOO_2_EXPIRY instead of FOO_1_EXPIRY) and passes on the fix.\n\n* test(core): keep existing countRef integration test alongside paths test\n\nRestore the GC-side getResponseMeta-countRef.ts integration test that\nthe prior commit replaced. The two tests cover the journey-mutation\nbug from complementary angles:\n\n- getResponseMeta-countRef.ts: GC consumer of paths (entityCount\n  under-counting → premature reaping under default GCPolicy).\n- getResponseMeta-paths.ts: non-GC consumer of paths\n  (entityExpiresAt → suppressed entity-expiry refetch; fires under\n  ImmortalGCPolicy too).\n\nBoth pass on the fix; both fail on the buggy paths.shift().",
          "timestamp": "2026-04-28T09:16:36-04:00",
          "tree_id": "74a366bf6fd771c76515b36a56378481b06c06bf",
          "url": "https://github.com/reactive/data-client/commit/6e8e499441741b58ad35127b517e8d83fc7a58fd"
        },
        "date": 1777382408425,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 129.87,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 39.6,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 303.03,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 312.5,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.02,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 250,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 277.78,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.91,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 71.18,
            "range": "± 11.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.42,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 200,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 263.16,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 165.3,
            "range": "± 9.5%",
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
          "id": "959465a064db687176e483932987b083f19718eb",
          "message": "feat(endpoint): allow shared Collection context keys (#3931)\n\nAllow one Collection schema to provide both argsKey and nestKey so it can be reused top-level and nested while preserving shared collection state.\n\nMade-with: Cursor",
          "timestamp": "2026-04-29T09:36:03-04:00",
          "tree_id": "46ad6841bc13544e7202ff45695eb8bba118d12d",
          "url": "https://github.com/reactive/data-client/commit/959465a064db687176e483932987b083f19718eb"
        },
        "date": 1777469965467,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 122.7,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 39.37,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 285.71,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 285.71,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 37.74,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 256.41,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 259.78,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.71,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 65.15,
            "range": "± 12.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 32.1,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 185.19,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 243.9,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 149.25,
            "range": "± 7.7%",
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
          "id": "396d163e6f4991818519ec33d903a85437483dfd",
          "message": "Move normalize args and visit into delegate (#3934)\n\n* Move normalize args and visit into delegate\n\n* Document normalize delegate migration\n\n* Update v0.18 normalize migration codemod\n\n* Fix normalize delegate entity type import\n\n* Fix normalize delegate type validation\n\n* Add normalize changeset migration example\n\n* docs: tighten v0.18 migration skill and anchor Collection section\n\n- Document codemod import gate, class-field/const gaps, and TS key rules\n- Correct denormalize type matching (interface method vs declare/property)\n- Expand skipped cases; shorten Collection cleanup with blog deep link\n- Add stable blog anchor for Collection consolidation heading\n\n* docs: move custom schema API to dedicated page\n\n* docs: align custom schema page structure",
          "timestamp": "2026-04-30T09:41:11-04:00",
          "tree_id": "ce0d76e53817a75bf328e746a04a88d283966c6e",
          "url": "https://github.com/reactive/data-client/commit/396d163e6f4991818519ec33d903a85437483dfd"
        },
        "date": 1777556672797,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 131.58,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.84,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 333.33,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.75,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 274.02,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 270.27,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.13,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 71.18,
            "range": "± 14.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.72,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 202.04,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 263.16,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 163.93,
            "range": "± 9.6%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "be1659373065c82147e80836b760abc6b11cf85b",
          "message": "internal: Publish new version (#3926)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-04-30T22:10:47-04:00",
          "tree_id": "3a721704e21d78140bb777a0428a4fd179fc8e15",
          "url": "https://github.com/reactive/data-client/commit/be1659373065c82147e80836b760abc6b11cf85b"
        },
        "date": 1777601639980,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 142.86,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.48,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 400,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 416.67,
            "range": "± 11.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 46.84,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.35,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 99.01,
            "range": "± 11.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.99,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 253.21,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 312.5,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 194.19,
            "range": "± 9.6%",
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
          "id": "ea6f86fa122bfbf9e917640ddf630e6aad3ed7c4",
          "message": "pkg: Update build packages (#3935)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-01T01:50:01-04:00",
          "tree_id": "bb1ae874bb8b4d582d586a0a3b0cd2cb23d10182",
          "url": "https://github.com/reactive/data-client/commit/ea6f86fa122bfbf9e917640ddf630e6aad3ed7c4"
        },
        "date": 1777614791071,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.57,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.92,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 345.24,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.16,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 78.74,
            "range": "± 14.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.39,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 224.75,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 185.25,
            "range": "± 9.9%",
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
          "id": "dee601ebc8ebfeb76d0c33b9756273154d435737",
          "message": "pkg: Update build packages (#3940)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-03T16:01:03-04:00",
          "tree_id": "ab590522ece9b397d1534b3200f6bee96cddfe21",
          "url": "https://github.com/reactive/data-client/commit/dee601ebc8ebfeb76d0c33b9756273154d435737"
        },
        "date": 1777838654380,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 143.89,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 37.74,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 333.33,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.6,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 39.71,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 307.77,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.22,
            "range": "± 11.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 80.32,
            "range": "± 15.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.36,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 185.25,
            "range": "± 8.5%",
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
          "id": "154585e12a2ee9ce9dbdbd916419830716b1764d",
          "message": "pkg: Update node (#3955)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-09T14:48:00-04:00",
          "tree_id": "a2946525875d875846cfb003478e4255216148cf",
          "url": "https://github.com/reactive/data-client/commit/154585e12a2ee9ce9dbdbd916419830716b1764d"
        },
        "date": 1778352678789,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.29,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 11.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 350.99,
            "range": "± 10.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.08,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.34,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 77.52,
            "range": "± 14.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.4,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 208.33,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 180.19,
            "range": "± 8.6%",
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
          "id": "dfa657eb419641845bc7c39abe52189905773190",
          "message": "fix(core): treat only undefined as missing for passthrough endpoint cache (#3960)\n\n* fix(core): treat only undefined as missing for passthrough endpoint cache\n\ngetResponseMeta used !cacheEndpoints, so falsy cached values ('', 0, false, null) were marked Invalid and hooks refetched indefinitely.\n\nUse cacheEndpoints === undefined to match shouldQuery semantics.\n\nAdd regression tests for schema-less endpoints; changeset for @data-client/core.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n* chore: add linked packages to falsy-cache changeset\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n* chore: rephrase changeset from user-facing outcome\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n---------\n\nCo-authored-by: Cursor <cursoragent@cursor.com>",
          "timestamp": "2026-05-13T08:38:58-04:00",
          "tree_id": "8b50ea70261cedc707954ea314505fbe816d34c1",
          "url": "https://github.com/reactive/data-client/commit/dfa657eb419641845bc7c39abe52189905773190"
        },
        "date": 1778676136292,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 135.14,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.84,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.58,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 303.03,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 298.57,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.09,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 68.97,
            "range": "± 12.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.15,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 8.7%",
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bf7b1c28187e3eb2caa100da31095b35c4846075",
          "message": "internal: Publish new version (#3942)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-13T08:58:11-04:00",
          "tree_id": "443bd9b4c73e6e2a7f5d3d2ca7ed60a45b3bbaa3",
          "url": "https://github.com/reactive/data-client/commit/bf7b1c28187e3eb2caa100da31095b35c4846075"
        },
        "date": 1778677302895,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.31,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 312.5,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.58,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 277.78,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 285.71,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.19,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 69.44,
            "range": "± 13.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 33.78,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 204.08,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 160.01,
            "range": "± 10.3%",
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
          "id": "b1d71114311094164e2a7d1e11620059a0c785bf",
          "message": "pkg: Update all non-major dependencies (#3961)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-16T21:37:12-04:00",
          "tree_id": "e793376870c99d16246936964b5afe4c4405009a",
          "url": "https://github.com/reactive/data-client/commit/b1d71114311094164e2a7d1e11620059a0c785bf"
        },
        "date": 1778982021409,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.93,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 400,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 40.74,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 370.37,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.35,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 89.29,
            "range": "± 11.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.09,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 238.1,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 303.03,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 10.0%",
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
          "id": "2b44f27176cbc2714b7e80e710d28bd32f7219a2",
          "message": "pkg: Update playwright monorepo to v1.60.0 (#3962)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-19T05:44:54-04:00",
          "tree_id": "b4a35e58de7f1af2fc4fe3e49f8ee910fb82b108",
          "url": "https://github.com/reactive/data-client/commit/2b44f27176cbc2714b7e80e710d28bd32f7219a2"
        },
        "date": 1779184099641,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 125,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 39.68,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 312.5,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 285.71,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.93,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 263.16,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 277.78,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.46,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 71.69,
            "range": "± 14.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 33.61,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 190.49,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 253.21,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 158.73,
            "range": "± 8.3%",
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
          "id": "5c8ae10b3daab6d22989f97d707e113942577815",
          "message": "pkg: Update all non-major dependencies (#3973)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-05-23T19:51:14-04:00",
          "tree_id": "18d153f0d61f00f5128667bb7e483cc9b1508f49",
          "url": "https://github.com/reactive/data-client/commit/5c8ae10b3daab6d22989f97d707e113942577815"
        },
        "date": 1779580464419,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 130.72,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.07,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.15,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.1,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.35,
            "range": "± 13.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.46,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 168.08,
            "range": "± 10.0%",
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
          "id": "2591197642bf65444c7e1396f47c2d32b2c1018b",
          "message": "pkg: Update build packages (#3995)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T07:58:23-04:00",
          "tree_id": "2a9e8c80047fc1d5547b9670a7c44fc474e511e1",
          "url": "https://github.com/reactive/data-client/commit/2591197642bf65444c7e1396f47c2d32b2c1018b"
        },
        "date": 1782216089731,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 141.85,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.86,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.14,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 46.95,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 392.31,
            "range": "± 2.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.96,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 96.15,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.32,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 222.22,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 186.93,
            "range": "± 8.4%",
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
          "id": "5e50a34e7624ab71bb92ed5988ecb7736bee1d80",
          "message": "pkg: Update actions/checkout action to v7 (#3997)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T07:58:49-04:00",
          "tree_id": "2b05acc806d7a3cb43f0d86cd5a9c070e18acf80",
          "url": "https://github.com/reactive/data-client/commit/5e50a34e7624ab71bb92ed5988ecb7736bee1d80"
        },
        "date": 1782216297997,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 140.87,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.19,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 317.54,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.3,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 294.12,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.06,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.35,
            "range": "± 13.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.83,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 204.08,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 163.93,
            "range": "± 9.7%",
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
          "id": "5c6d212cc00699d036f491d6a9bff10f816186da",
          "message": "pkg: Update playwright monorepo to v1.61.0 (#3998)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T08:22:47-04:00",
          "tree_id": "a0990a6e01210a6c0db9cdaa370be5493398a0f2",
          "url": "https://github.com/reactive/data-client/commit/5c6d212cc00699d036f491d6a9bff10f816186da"
        },
        "date": 1782217551755,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 143.89,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.58,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 9.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.14,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.77,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 357.14,
            "range": "± 3.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.63,
            "range": "± 10.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 70.67,
            "range": "± 12.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.5,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 222.22,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 175.49,
            "range": "± 11.1%",
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
          "id": "3da237c148b2f49e07b6ee099aff51aeaf52139b",
          "message": "pkg: Update all non-major dependencies (#4003)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-27T09:39:41-04:00",
          "tree_id": "535930f42d8e34bb13cad2e64313f8baabe7dd37",
          "url": "https://github.com/reactive/data-client/commit/3da237c148b2f49e07b6ee099aff51aeaf52139b"
        },
        "date": 1782567787772,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 135.14,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.01,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 10.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 39.87,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 285.71,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 298.57,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.16,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 73,
            "range": "± 11.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 37.74,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 208.33,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 274.02,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 10.3%",
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
          "id": "c264f15bc46dbd4407498f5e5163e2aaed58691a",
          "message": "pkg: Update playwright monorepo to v1.61.1 (#4006)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-28T09:14:45-04:00",
          "tree_id": "9850bb9ad295e33dfb4b5a0128f38eeb8b9fd5f8",
          "url": "https://github.com/reactive/data-client/commit/c264f15bc46dbd4407498f5e5163e2aaed58691a"
        },
        "date": 1782652674287,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 133.33,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.15,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 350.99,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.81,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 303.03,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10.8,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.05,
            "range": "± 12.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.63,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 196.08,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 263.16,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 173.93,
            "range": "± 9.1%",
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
          "id": "ad1fcbdd0d6f1c415d97cbc1b482716985680d49",
          "message": "internal: Cut CI wall-clock latency on the validation critical path (#4007)\n\n* internal: Cut CircleCI validation critical path latency\n\n- Compute esmodule relevance once in setup and persist a flag file;\n  downstream jobs read the flag instead of doing a full checkout + git\n  diff each (removes dead time from both hops of the esmodule chain)\n- Run ci:build:types and ci:build-test-lib concurrently in setup (they\n  are independent; babel/rollup compile from src, not tsc output)\n- Pin Jest --maxWorkers to the resource class vCPUs; os.cpus() reports\n  the docker host's CPUs, oversubscribing workers\n- Remove no-op checkout depth parameter (built-in checkout ignores it)\n\n* internal: Cache Playwright browsers in benchmark-react workflow\n\nKeyed on the resolved playwright version so Renovate bumps invalidate\nthe cache automatically. On cache hit only system deps are installed.\n\n* internal: retrigger CI to check unit_tests-native flakiness\n\n* fix(ci): esmodule relevance diff silently failed on PR branches\n\ngit fetch --depth=1 of the base branch severs the merge base, making\nthe three-dot diff error out; with the old '|| true' fallback the\nchanged-file list came back empty and every esmodule job halted on PR\nbranches. Fetch with full history and fail open (treat as relevant)\nwhen the diff cannot be computed.\n\n* fix(ci): Don't cap Jest workers for ReactNative suites\n\nThe native suites are dominated by fake-timer waits rather than CPU;\ncapping to 4 workers serialized the heavy hook suites (16s -> 26s) and\nflaked integration-garbage-collection's 5s timeout in two consecutive\nruns. Coverage/DOM runs keep the cap where it measurably helps\n(unit_tests-latest 49s -> 33s).\n\n* internal: Simplify CI relevance detection and Playwright caching\n\n- Unify fail-open handling in the esmodule detect step: one\n  ESMODULE_RELEVANT boolean instead of a sentinel filename that\n  depended on the grep regex matching it; identical diff-failure\n  behavior on default-branch and PR paths\n- Fetch base branch with --filter=blob:none (commit graph only is\n  needed for --name-only diffs; degrades to full fetch when the\n  server ignores the filter)\n- Add examples/normalizr-relationships/ to the relevance regex; it is\n  built by validate-esmodule-browser-build\n- Log fail-open explicitly when the relevance flag is missing\n- Replace inline PID juggling with run-p via new ci:build:setup script\n  (npm-run-all already a dev dependency; runnable locally)\n- Merge identical ^17/^18 Jest branches\n- Merge conditional Playwright install steps into one; resolve the\n  playwright version from the workspace explicitly so hoisting changes\n  can't break the cache key\n- Document worker pinning and the relevance flag in AGENTS.md\n\n* internal: Move CI guidance from AGENTS.md to glob-scoped cursor rule\n\nOnly attaches when editing .circleci/** or .github/workflows/*.yml\ninstead of costing context on every conversation.\n\n* internal: Halt esmodule jobs before attach_workspace\n\nTransport the relevance flag via save_cache/restore_cache (keyed on\nCIRCLE_SHA1) instead of the workspace. Halted jobs previously paid\n13-16s attaching the ~1.3GB workspace before reading the flag; a\ncache restore of one file takes ~1s. Cache miss fails open (jobs\nrun). Detection is deterministic per commit, so the immutable cache\nkey is safe across reruns.",
          "timestamp": "2026-07-04T14:05:00-04:00",
          "tree_id": "52d5f3d9a4968a30036ee98815f6cdc88e421b53",
          "url": "https://github.com/reactive/data-client/commit/ad1fcbdd0d6f1c415d97cbc1b482716985680d49"
        },
        "date": 1783188486770,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 144.93,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 45.98,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 400,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 377.49,
            "range": "± 10.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 48.78,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.28,
            "range": "± 10.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 98.52,
            "range": "± 10.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 40.33,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 243.9,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 312.5,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 192.31,
            "range": "± 9.6%",
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
          "id": "78d8a309524d6f37fd748d059d9c8486b550e882",
          "message": "pkg: Update all non-major dependencies (#4011)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-11T21:57:05-04:00",
          "tree_id": "62a45977568e04ee389c741eed58b15de55b6dea",
          "url": "https://github.com/reactive/data-client/commit/78d8a309524d6f37fd748d059d9c8486b550e882"
        },
        "date": 1783821602332,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 135.14,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 46.73,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 350.99,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 47.74,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 303.03,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.95,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 98.04,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 39.53,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 227.27,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 188.68,
            "range": "± 9.1%",
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
          "id": "aa15f29f6b0a3b4ae655e2d114a419a3fc94ac7e",
          "message": "pkg: Update `typescript` to v7 (#4019)\n\n* pkg: Update `typescript` to v7\n\n* pkg: Complete TypeScript 7 upgrade\n\nShip package.json exports `types` conditions required by TS7 resolution,\ndual-install the TS6 Compiler API for eslint/ts-jest/rollup-plugin-dts,\nand pin `tsc --build --builders 1` so parallel project builds do not race.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\nCo-authored-by: Cursor <cursoragent@cursor.com>",
          "timestamp": "2026-07-12T09:00:19-04:00",
          "tree_id": "9439555a315a79efb09fa67f5a92493e797f4604",
          "url": "https://github.com/reactive/data-client/commit/aa15f29f6b0a3b4ae655e2d114a419a3fc94ac7e"
        },
        "date": 1783861412911,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 132.46,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.9,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 303.03,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 303.03,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.66,
            "range": "± 10.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 303.03,
            "range": "± 2.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 303.03,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.14,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 69.2,
            "range": "± 9.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.43,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 198.04,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 156.25,
            "range": "± 10.0%",
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
          "id": "d432eba98aba5841e608a90afd872b236ad0ed0d",
          "message": "pkg: Update validation packages (#3996)\n\n* pkg: Update validation packages\n\n* fix: Align prettier and jest-environment-node for validation upgrades\n\nPrettier 3.9 reformats union types; force jest-environment-node@30.4.1 so React Native's Jest preset no longer ships a 29.x mocker that lacks clearMocksOnScope under Jest 30.4.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\nCo-authored-by: Cursor <cursoragent@cursor.com>",
          "timestamp": "2026-07-12T10:26:45-04:00",
          "tree_id": "cdc0243a22ebb3d172e9b12898b0c050de167e79",
          "url": "https://github.com/reactive/data-client/commit/d432eba98aba5841e608a90afd872b236ad0ed0d"
        },
        "date": 1783866593810,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.67,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 350.99,
            "range": "± 10.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 46.62,
            "range": "± 9.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 307.77,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.13,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.91,
            "range": "± 13.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 37.66,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 215.08,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 250.16,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 169.49,
            "range": "± 11.0%",
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
          "id": "38dbb5264961dfd86ba16311653b9428b7e160a7",
          "message": "internal: Run GitHub Actions on Node 26 (#4025)\n\nAlign GH Actions with CircleCI and .nvmrc on the Current Node line.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>",
          "timestamp": "2026-07-12T11:30:54-04:00",
          "tree_id": "2b0517093a0d08ad4c1a9753eb5a14427fb607da",
          "url": "https://github.com/reactive/data-client/commit/38dbb5264961dfd86ba16311653b9428b7e160a7"
        },
        "date": 1783870440839,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 129.87,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.07,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 312.5,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.86,
            "range": "± 10.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 303.03,
            "range": "± 2.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 285.71,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.2,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 68.03,
            "range": "± 12.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.78,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 200,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 263.16,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 162.61,
            "range": "± 8.0%",
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
          "id": "93555f877ac658aa3a178226d8c8ba8a53a8e8e5",
          "message": "pkg: Update build packages (#4029)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-12T15:34:31-04:00",
          "tree_id": "fe4f4b68935d5a1ba6a7cf51d170dd075c3b1d80",
          "url": "https://github.com/reactive/data-client/commit/93555f877ac658aa3a178226d8c8ba8a53a8e8e5"
        },
        "date": 1783885075684,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 121.95,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.65,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 285.71,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 307.77,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.02,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 270.27,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 277.78,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.96,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 63.9,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 30.58,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 185.19,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 227.27,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 141.85,
            "range": "± 6.9%",
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
          "id": "14d6f56984bb612b076125f09baad99c99bbd1d7",
          "message": "pkg: Update all non-major dependencies (#4054)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-25T07:08:37-04:00",
          "tree_id": "b84a18c71922e603507ca7b2676488c2ba632fd7",
          "url": "https://github.com/reactive/data-client/commit/14d6f56984bb612b076125f09baad99c99bbd1d7"
        },
        "date": 1784977904237,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 142.86,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.92,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.25,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 327.96,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10.65,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 78.74,
            "range": "± 13.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.23,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 178.57,
            "range": "± 10.1%",
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
          "id": "3fa47c8d3cdf05aa2af335e46d760b479fdb5c84",
          "message": "pkg(security): Bump transitive CVEs and non-major deps (#4068)\n\n* pkg(security): Bump transitive CVEs and non-major deps\n\nForce patched versions via yarn resolutions and example npm overrides,\nrefresh lockfiles, and fold in open Renovate/Dependabot dependency bumps.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n* fix(ci): Keep antd at 6.5.2 to avoid Yarn quarantine\n\nantd@6.5.4 is quarantined by Yarn's time gate, which broke the CircleCI\nsetup job when github-app is added to the workspace.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n* fix(ci): Deduplicate @types/react for website typecheck\n\nForce a single @types/react/@types/react-dom version via resolutions so\nDocusaurus nested types match the workspace after the 19.2.18 bump.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n* internal(pkg): Drop unnecessary resolution and override pins\n\nKeep lockfile-driven CVE bumps and only retain package.json changes that\nupdate existing entries or are required (@types/react dedupe).\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n* fix(ci): Revert @types/react 19.2.18 for TS 4.0 matrix\n\nThe forced 19.2.18 resolution blocked esmodule-types-4.0 from installing\n@types/react@ts4.0, so tsc 4.0 failed on template literal types.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n\n---------\n\nCo-authored-by: Cursor <cursoragent@cursor.com>",
          "timestamp": "2026-08-07T18:19:52-04:00",
          "tree_id": "5608f76ee3a7e15fc4e1ae323d0921cefa1bbc8b",
          "url": "https://github.com/reactive/data-client/commit/3fa47c8d3cdf05aa2af335e46d760b479fdb5c84"
        },
        "date": 1786141369213,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 137.94,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.05,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.11,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 327.96,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.9,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 72.2,
            "range": "± 14.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 37.67,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 219.81,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 177.01,
            "range": "± 7.9%",
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
          "id": "a76996a5ed350ce1869a438aab88bf72cdb1ed52",
          "message": "test(react): Lock concurrent rendering GOALS on public APIs (#4094)\n\n* test(react): Add commit-priority probe and streaming SSR harness\n\nInstall a DevTools hook before react-dom/client so suites can record\nscheduler priority, and share two-phase renderToPipeableStream replay\nhelpers for hydrateRoot tests.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Add concurrent probe control suite\n\nCalibrate Immediate vs Normal commits, document discrete-event SyncLane,\nand show that recreating Suspense elements client-renders a pending\nboundary so streamed nodes are not adopted.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Lock startTransition over useSuspense\n\nKeep the committed UI, accept urgent input, and require non-Immediate\nstore publishes for transition/default setResponse without flushSync or\nuseSyncExternalStore.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Add hydrateRoot streaming hydration suite\n\nLock gate-before-consumer identity and in-place reveal, and record\nper-version outcomes for read-then-suspend and two-pending public\nDataProvider topologies.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Assert public cache reads skip useSyncExternalStore\n\nHoist a throwing useSyncExternalStore wrapper so public hooks cannot\ncapture the real API, and label the React 19 use() vs React 18\nuseContext fallback.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* ci: Add React 19.3 ReactDOM matrix row\n\nDelete root React resolutions, install 19.3.0, and run the concurrent\nrendering suites so latest React is locked in CI rather than the 19.2.3 pin.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Run streaming hydration suites on React 18\n\nLoad renderToPipeableStream from the Node server build, hoist React 18\n$RC function declarations onto the global, and lock 18.3/19.2/19.3\nshape 2–3 rows. React 18 default-lane publishes still client-render a\npending sibling; transition publishes keep it dehydrated without host text.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Deduplicate concurrent rendering test harness\n\nShare replayRest, getHydrateRoot, and probe calibration helpers so the\nsuites stop copying stream install and notify-store boilerplate. Keep\nreactCommitProbe as the first import so the DevTools hook still installs\nbefore react-dom/client.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Allow React 18 hydration-update warning in recreate control\n\nThe recreate-Suspense probe client-renders the pending sibling on 18, which\nlogs the pre-hydration update warning. Expect that warning in this case only;\nleave other suites' empty-console afterEach asserts unchanged.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Discover pending Suspense ids and install DevTools in setup\n\nDiscover template[id] from the installed shell (fallback-text + <!--$?-->\nif missing) so React HTML-protocol numbering does not brick the suites.\nInstall __REACT_DEVTOOLS_GLOBAL_HOOK__ in ReactDOM testSetup.js and attach\nthe commit recorder to that object. Share Todo/Endpoint/mockInitialState\nvia concurrentFixtures.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* test(react): Apply follow-up harness to concurrent suites\n\nDrop the import/order ritual and duplicate Immediate/Normal calibration\nfrom hydration/transition. Keep fail-loud calibration in probe-controls.\nPreserve the React 18 hydration-update allowlist.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* docs: Add fully concurrent rendering GOALS bullet\n\nLock the public @data-client/react concurrent-rendering goal with the\ntests on this PR. Same wording as HOLD 4090, without adapter APIs:\nuseTransition/startTransition over useSuspense, streaming SSR, hydration;\nstore reads must not force SyncLane; older React may use a labeled fallback.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n---------\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-09-18T11:16:54-04:00",
          "tree_id": "8d43aaa79433987fcf0dc3330c110b138d71dff8",
          "url": "https://github.com/reactive/data-client/commit/a76996a5ed350ce1869a438aab88bf72cdb1ed52"
        },
        "date": 1789744811389,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 125,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 39.84,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 312.5,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 294.12,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.39,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 263.16,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 277.78,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.22,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 71.43,
            "range": "± 12.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 32.95,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 188.68,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 250,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 158.77,
            "range": "± 8.3%",
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
          "id": "f343f9d42a12f3ad763fac96362166d3b3156b69",
          "message": "fix(core): Allow controller.set() with Array schemas (#4103)\n\n* fix(core): Allow controller.set() with Array schemas\n\ncontroller.set([Entity], rows) and controller.set(new schema.Array(Entity), rows)\nalready batch-write at runtime (one SET action, one normalize), but the\nQueryable constraint rejected Array schemas because their queryKey is undefined.\nAdd an overload for Array schemas that takes only the value.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* chore: Format controller-set-array changeset\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* docs(skills): Teach controller.set([Entity], rows) batch writes\n\nAdd a short batch-write gotcha to the data-client-manager and\ndata-client-react skills, with evals that fail a per-row\ncontroller.set(Entity, ...) loop or a setResponse/push-endpoint\nworkaround and pass controller.set([Entity], rows).\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* fix(core): Keep Entities off the Array set() overload\n\nEntity's any-typed normalize/queryKey matched the Array overload, so\ncontroller.set(Entity, [row]) typechecked but was a runtime no-op.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* docs: Tighten controller.set Array wording in docs, skills, and evals\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* docs: Document batch set() for streams; batch coin-app ticker writes\n\n- managers.md: add \"Batching high-frequency updates\" with a buffered\n  set([Entity], rows) flush; fix stream example's controller reference\n- Controller.md: anchor the Array form, note pk()/process() get no args\n- Array.md: show ctrl.set([User], rows)\n- DevTools predicate examples also skip batched [Ticker] writes\n- coin-app StreamManager buffers ticker messages and flushes them with\n  one set([Ticker], rows) per 50ms; Ticker.process tolerates empty args\n- skills: fold batch-write guidance into one line each; drop evals\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n* fix(coin-app): Reset stream buffer state on cleanup so re-init flushes\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n* docs(blog): Start draft v0.19 release post with batch Controller.set()\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n* docs: Show before/after for batch set() in changeset and blog\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n* bench: Compare per-row set() to batch set([Entity], rows); chart in v0.19 post\n\nAdds core suite benchmarks 'setMany {50,500}x one-per-row' and\n'setMany {50,500} batch' writing into a 500-entity store. Locally the\nbatch is ~20x faster for 50 rows and ~95x for 500 rows.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n* docs: Show set([Entity], rows) signature in Controller docs; restore skill evals\n\nAddresses staff review: the Controller.set heading only showed the\n...args form, and the skill evals belong with this change.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n* docs: Note same-pk rows in a batch skip shouldReorder; keep latest ticker per product\n\nCoin-app buffers only the latest message per product so batched writes keep\nTicker.shouldReorder() ordering. Clarify the DevTools tip applies to [Ticker].\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01QygSDvhjbnZRtLhyLvuBB8\n\n---------\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-03T18:56:16-04:00",
          "tree_id": "63c79a12d7a83f28b16ab23a015659d908a845c2",
          "url": "https://github.com/reactive/data-client/commit/f343f9d42a12f3ad763fac96362166d3b3156b69"
        },
        "date": 1791068346411,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 163.93,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 54.35,
            "range": "± 3.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.88,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 54.06,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 377.49,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.84,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 80.01,
            "range": "± 14.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 44.44,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 238.1,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 333.33,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 194.19,
            "range": "± 8.7%",
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
          "id": "8b3bb892b61bf433abed923e33446f3d6be16e5d",
          "message": "fix(core): Type batch controller.set() rows; allow Union and Invalidate (#4130)\n\n* fix(core): Type batch controller.set() rows and reject multi-Entity arrays\n\nThe Array overload of controller.set() accepted any Schema[] with untyped\nrows, so [User, Admin] (throws in dev, uses User in prod), [[User]],\n[() => 1] and [{ bogus: 1 }] typechecked, as did ctrl.set([User], [1]).\n\nNow the schema must hold a single Entity or Union, in an array, a\nschema.Array, or a schema.Values (which takes rows keyed by id). Rows are\ntyped by the Entity's fields, with number/string coercion; object values\nstay open since rows are raw input. Polymorphic rows may carry a\ndiscriminator that is not an Entity field, and untyped Entities like\nEntityMixin accept any row.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MbthieGWrKshPjDkH7mGz2\n\n* refactor(core): Simplify batch set() types\n\nName the Entity map shape once, drop constraint members the value type\nalready enforces, reuse Denormalize<> for Array/Values rows, and collapse\nSetField's tail branches.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MbthieGWrKshPjDkH7mGz2\n\n* fix(core): Keep schema.Object off the batch set() overload\n\nRestore the schemaKey() member; schema.Object's queryKey() returns any, so\nqueryKey(): undefined alone no longer excluded it. Adds type tests for\nschema.Object with keyed rows and schema.Lazy.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MbthieGWrKshPjDkH7mGz2\n\n* test(react): Construct schema.Lazy correctly in batch set() type tests\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MbthieGWrKshPjDkH7mGz2\n\n* feat(core): Allow batch delete with set([Invalidate(Entity)], rows)\n\nType batch set() elements by what makes them writable: one row normalizes to\none stored entity (_normalizeNullable() returns an entity ref). That admits\nEntity, Union and Invalidate, and keeps out Query/All (lists) and\nCollection (keyed by args). Docs lead with Union and Invalidate examples.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MbthieGWrKshPjDkH7mGz2\n\n* refactor(core): Move batch set() types to setManyTypes.ts\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MbthieGWrKshPjDkH7mGz2\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T11:12:39-04:00",
          "tree_id": "292ca611e7d07e8482f72780cfeee9b0bfd5e59b",
          "url": "https://github.com/reactive/data-client/commit/8b3bb892b61bf433abed923e33446f3d6be16e5d"
        },
        "date": 1791126932554,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 175.44,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 52.22,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 55.26,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 339.08,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.58,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 79.68,
            "range": "± 10.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 46.73,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 250,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 333.33,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 192.31,
            "range": "± 8.7%",
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
          "id": "b4b502d545aab0cf75bf030f3de4607a2e3ab7dc",
          "message": "fix(types): Fix TS 4.x legacy types with skipLibCheck off; internal(ci): fail-open esmodule relevance, faster rest legacy types (#4122)\n\n* internal(ci): Fail open on esmodule relevance and speed up rest legacy types\n\nThe esmodule relevance flag now uses a denylist of provably irrelevant\npaths, so new inputs run the esmodule jobs by default. rest's legacy\ntypes build uses scripts/build-legacy-types.sh (direct downlevel-dts,\nd.ts-only copies) with --newer-overlays-last to keep its overlay order;\nts4.0/ts4.1 output is byte-identical (8.6s -> 4.5s locally).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEcQdob4nGVuMq91oUHC2V\n\n* internal(ci): Simplify legacy types overlay order and share docs-only paths\n\nDownlevel always runs first; --inherit-newer-overlays (rest) then applies\nearlier versions' custom types. Without the flag those copies were always\noverwritten by downlevel-dts, so endpoint/normalizr output is unchanged\n(ts*/ byte-identical). The esmodule and tests relevance checks now share\none DOCS_ONLY path list.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEcQdob4nGVuMq91oUHC2V\n\n* fix(types): Apply newer legacy type overlays to older TS outputs (#4138)\n\n* fix(types): Apply newer legacy type overlays to older TS outputs\n\nendpoint and normalizr legacy outputs (ts4.2, ts4.0, ts3.4) now inherit\nevery newer version's src-*-types overlay, as rest already did. This\nreplaces the TS 5.4 NoInfer builtin with the NI<T> = T fallback for\nTS < 4.8 consumers.\n\nnormalizr re-exports memo types by name instead of `export type *`\n(TS 5.0 syntax that downlevel-dts leaves as is).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n* docs(blog): Note legacy TypeScript types fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>\n\n* fix(types): Fix endpoint/rest legacy type errors with skipLibCheck off (#4140)\n\n* fix(types): Apply newer legacy type overlays to older TS outputs\n\nendpoint and normalizr legacy outputs (ts4.2, ts4.0, ts3.4) now inherit\nevery newer version's src-*-types overlay, as rest already did. This\nreplaces the TS 5.4 NoInfer builtin with the NI<T> = T fallback for\nTS < 4.8 consumers.\n\nnormalizr re-exports memo types by name instead of `export type *`\n(TS 5.0 syntax that downlevel-dts leaves as is).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n* docs(blog): Note legacy TypeScript types fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MpCgcZt8G8R5KARZ7z5CKE\n\n* fix(types): Fix endpoint/rest legacy type errors with skipLibCheck off\n\n- TS 4.0: unroll RemoveArray and approximate PartialArray (recursive\n  conditional types need 4.1) in new src-4.0-types overlays\n- TS <4.2: rewrite `abstract new` to `new` in the downleveled output and\n  drop the stale src-4.0-types Entity/EntityTypes copies\n- TS 4.2: ConstructorInstance<> replaces InstanceType<> on abstract TBase\n- TS 4.2-4.4: UnionInstance Args is unconstrained\n- TS 4.0-4.5: rest getPage narrows paginationField with Extract<>\n- CI: esmodule-types also typechecks a skipLibCheck: false consumer\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* docs(blog): Link #4140 in v0.19 notes\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* refactor(types): Isolate recursive tuple types so the 4.0 overlay is one small file\n\n- RemoveArray and PartialArray move to tupleTypes.ts; the src-4.0-types\n  overlay replaces only that module instead of copying endpointTypes/utility\n- Legacy build only rewrites files that contain `abstract new (`\n- libcheck typetest skips TypeScript's own lib checks\n- Split the legacy types bullet in ci-config.mdc\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* internal: Resolve leftover merge conflict in ci-config rule\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n* internal: Resolve leftover merge conflict in build-legacy-types.sh\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01AMEHZGboXdMFRkF4D2ktki\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>\n\n* internal(ci): Harden legacy types script and libcheck lib/ on latest TS\n\nversion_lt compares major.minor in bash instead of relying on sort -V\n(a missing -V silently skipped the abstract new rewrite), and the\nabstract new grep no longer fails the build under pipefail when nothing\nmatches. esmodule-types-latest also runs the skipLibCheck: false\ntypetest so lib/ is checked on the newest compiler.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEcQdob4nGVuMq91oUHC2V\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T11:20:54-04:00",
          "tree_id": "1a3cb0f4485f4588e2bb3560c1844f78bad1da11",
          "url": "https://github.com/reactive/data-client/commit/b4b502d545aab0cf75bf030f3de4607a2e3ab7dc"
        },
        "date": 1791127411956,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 212.77,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 63.7,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 465.37,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 454.55,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 63.9,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 408.33,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 444.66,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 20.2,
            "range": "± 10.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 114.29,
            "range": "± 13.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 58.49,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 294.12,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 416.67,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 243.9,
            "range": "± 8.8%",
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
          "id": "cc57a77d2e563071926f50cb9054516d2ab9101e",
          "message": "fix(endpoint): Make Entity classes assignable to EntityInterface (#4149)\n\n* fix(endpoint): Make Entity.pk() args readonly to match EntityInterface\n\nEntity classes now satisfy normalizr's EntityInterface, so Controller\ndrops its private EntityLike workaround. Endpoint's own EntityInterface\nalso takes readonly args, so both contracts match.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01F92DVcdVpL6sVLSA69App5\n\n* docs(changeset): Only static pk() overrides need readonly args\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01F92DVcdVpL6sVLSA69App5\n\n* fix(endpoint): Keep Entity.pk() readonly-args change non-breaking\n\nDeclare static pk() with method syntax so subclass overrides that type\nargs as a mutable array still compile. Revert endpoint EntityInterface\nand keep core's loose EntityLike so mixed package versions keep working.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01F92DVcdVpL6sVLSA69App5\n\n* fix(core): Use EntityInterface for batch set() schemas\n\nEntity now satisfies EntityInterface, so the private EntityLike type is\nno longer needed. Batch set() is unreleased, so this only requires\nmatching endpoint versions for a new feature.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01F92DVcdVpL6sVLSA69App5\n\n* docs: Track deferred Entity pk() cleanups; recommend readonly args\n\nAdd plans/next-breaking-release.md for the compatibility shims, and note\nin the v0.19 blog and changeset that static pk() overrides should type\nargs as readonly ahead of that release.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01F92DVcdVpL6sVLSA69App5\n\n* internal: Document breaking change strategy as a cursor rule\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01F92DVcdVpL6sVLSA69App5\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T12:55:04-04:00",
          "tree_id": "0ba57b8ca10b5708f473051ae78a3ab0312c7e10",
          "url": "https://github.com/reactive/data-client/commit/cc57a77d2e563071926f50cb9054516d2ab9101e"
        },
        "date": 1791133090275,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 140.85,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.1,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.96,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.77,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 72.2,
            "range": "± 14.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.03,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 208.33,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 173.93,
            "range": "± 9.8%",
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
          "id": "74e67fa2c4f9f104f5b7a49e877a48e5963e4bd2",
          "message": "fix: Deleted entities return undefined instead of an internal Symbol (#4150)\n\n* fix(core): Return undefined instead of INVALID symbol from getResponseMeta\n\nDeleted entities leaked the internal INVALID symbol as data through\ngetResponse()/fetchIfStale() and into useCache()/useDLE() (React and Vue)\nand Vue useSuspense(). Map it to undefined like get() and getQueryMeta().\n\nAlso share the Vue useCache()/useDLE() response logic in useCacheResponse().\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LJicJQAHR76VGM7mYL6Ygt\n\n* test: share errored state in getResponse tests; blog: note deleted entity fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LJicJQAHR76VGM7mYL6Ygt\n\n* refactor(vue): Drop useSuspense INVALID check now that getResponseMeta maps it\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LJicJQAHR76VGM7mYL6Ygt\n\n* refactor(vue): Share response setup across Vue composables (#4152)\n\n* refactor(vue): Share response setup across useSuspense, useFetch, useCacheResponse\n\nExtract stateRef/controller/resolvedArgs/argsKey/responseMeta and the GC\nrefcount watch into useResponseMeta(). Vue useFetch() now holds GC refs\nwhile mounted, like React useFetch().\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KfSmjsGHGGSxfsj8ve7NHA\n\n* refactor(vue): Share GC refcount watch with useQuery\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KfSmjsGHGGSxfsj8ve7NHA\n\n* refactor(vue): Share isStale() across useSuspense, useFetch, useDLE\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KfSmjsGHGGSxfsj8ve7NHA\n\n* docs(blog): Note Vue useFetch GC fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KfSmjsGHGGSxfsj8ve7NHA\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>\n\n* docs(changeset): Show the user-facing impact of the deleted entity Symbol\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LJicJQAHR76VGM7mYL6Ygt\n\n* docs(blog): Explain deleted entity fix impact and workaround removal\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LJicJQAHR76VGM7mYL6Ygt\n\n* docs(blog): Use DiffEditor for deleted entity workaround removal\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01LJicJQAHR76VGM7mYL6Ygt\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T13:46:08-04:00",
          "tree_id": "2a989f85741e34cd04a01750a9c2b0480476a9a0",
          "url": "https://github.com/reactive/data-client/commit/74e67fa2c4f9f104f5b7a49e877a48e5963e4bd2"
        },
        "date": 1791136130963,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 192.31,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 58.82,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 526.32,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 571.9,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 58.66,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 454.55,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 500,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 14.2,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 131.58,
            "range": "± 16.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 53.33,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 322.58,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 434.78,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 277.78,
            "range": "± 8.5%",
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
          "id": "a82758cd1998e58d7ad280407db28bd84f5d7b18",
          "message": "fix(core): Type controller.set() values by schema (#4133)\n\n* fix(core): Type controller.set() values by schema\n\ncontroller.set() typed its value (and updater return) as `{}`, so\n`set(new schema.All(User), 42)` or `set(UserResource.getList.schema, 'x')`\ntypechecked. Values are now the raw input the schema normalizes: Entity\nfields, rows for Collection/All, and a Query's inner schema input.\nBatch set() shares the same row typing.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01BN4uSb49CL2pwcZFnTCJkc\n\n* enhance(core): Simplify controller.set() value types\n\nOne overload for value or updater; SetRow handles primitives; rename the\nQuery unwrap to InputSchema and exclude Entity with pk?: never.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01BN4uSb49CL2pwcZFnTCJkc\n\n* enhance(core): Speed up controller.set() value type checking\n\n- Infer S from the schema only (SkipInfer), so TS doesn't walk the value\n  against every conditional in SetValue\n- Merge a Union's members into one row type instead of a union of rows,\n  so each row is one comparison rather than one per member\n- Keep string/number literal fields exact\n\nOn a 30-member Union with 1000 updater calls, check time drops from\n16.8s to 4.7s (master, with untyped values: 3.3s); other extreme cases\nare now at or below master.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01BN4uSb49CL2pwcZFnTCJkc\n\n* fix(core): Unwrap nested Queries in set() value types; document Union row tradeoff\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01BN4uSb49CL2pwcZFnTCJkc\n\n* docs(blog): Interactive demo of typed controller.set() values\n\nRegenerate the playground's @data-client editor types so the demo\nreflects v0.19 set() typing.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01BN4uSb49CL2pwcZFnTCJkc\n\n* docs(blog): Move typed set() section under Other improvements\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01BN4uSb49CL2pwcZFnTCJkc\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T14:08:40-04:00",
          "tree_id": "eb6fbc6feb6b0f23f1cb3943a6d6e90ccdf6a367",
          "url": "https://github.com/reactive/data-client/commit/a82758cd1998e58d7ad280407db28bd84f5d7b18"
        },
        "date": 1791137464418,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 200,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 67.11,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 526.32,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 476.19,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 67.57,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 416.67,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 526.32,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 23.56,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 119.05,
            "range": "± 11.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 55.71,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 303.03,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 256.41,
            "range": "± 7.8%",
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
          "id": "b23988347fcb403b402a1aaffe69f98140e5e8f2",
          "message": "internal(react): Type hook implementation return values (#4147)\n\n* internal(react): Type hook implementation return values\n\nOverloaded useSuspense, useDLE and useLive declared their implementation\nsignature `: any`, so TypeScript never checked the overloads against the body.\nDeclare the real container type (with `unknown` inner values) and drop casts\nthat only existed for the old `any`. useDLE now keeps the cached value and the\nloading-adjusted value in separate consts, since reassigning `data` widened it.\n\nAdd a no-restricted-syntax lint rule against `any` (or `Promise<any>`) on\noverload implementation signatures in packages/*/src. Vue is excluded until\n#4114 and #4125 land.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KQdp9wSRM7XD2RXNrrKTCc\n\n* internal: Simplify overload lint rule and cover class methods\n\nCollapse the selectors into one, match `any` anywhere in the implementation's\nreturn annotation, and cover class method overloads. That flagged\nCollection.denormalize, which now returns `unknown`.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KQdp9wSRM7XD2RXNrrKTCc\n\n* internal(react): Add compile-time tests for hook return types\n\nPin every useSuspense, useLive and useDLE overload (schema and plain\nendpoints, null args, DLE discrimination), including that none resolve to\n`any`. Implementation signatures aren't visible to callers, so these guard\nthe public types the lint rule can't see.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KQdp9wSRM7XD2RXNrrKTCc\n\n* internal(react): Move hook type tests to typescript-tests\n\nFollow the repo's convention for compile-time-only tests (checked by\ntsconfig.test.json, not run by jest). Drop the notAny helper since each\n@ts-expect-error already fails on `any`, and make the useLive and plain\nuseDLE cases match the others.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KQdp9wSRM7XD2RXNrrKTCc\n\n* internal(react): Limit compile tsconfig to src\n\nAdding typescript-tests to the package tsconfig broke `tsc --build`, since\nthe compile config inherited that include despite rootDir src. Match\nendpoint's tsconfig.compile.json.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01KQdp9wSRM7XD2RXNrrKTCc\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-04T14:32:32-04:00",
          "tree_id": "1155495d57cea0a3871609a14c7f346ba43d1128",
          "url": "https://github.com/reactive/data-client/commit/b23988347fcb403b402a1aaffe69f98140e5e8f2"
        },
        "date": 1791138924441,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 175.44,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 55.71,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 454.55,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 454.55,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 56.03,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 408.33,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 416.67,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 14.71,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 85.84,
            "range": "± 16.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 47.96,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 263.16,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 357.14,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 212.77,
            "range": "± 8.3%",
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
          "id": "159c9633679d95427fe4f626aec341c76e4578f8",
          "message": "fix(core): Speed up Redux DevTools serialization of timestamps (#4163)\n\n* fix(core): Reuse DevTools date formatter instead of creating one per timestamp\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HJNAqsGkg5XHQYV9Bp5DXx\n\n* docs(blog): Note DevTools serialization speedup in v0.19\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HJNAqsGkg5XHQYV9Bp5DXx\n\n* docs(blog): Chart the DevTools serialization speedup in v0.19\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HJNAqsGkg5XHQYV9Bp5DXx\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T04:12:32-04:00",
          "tree_id": "fddbf1b3203341bcac2411bf8378905db86b94a0",
          "url": "https://github.com/reactive/data-client/commit/159c9633679d95427fe4f626aec341c76e4578f8"
        },
        "date": 1791188137075,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 137.94,
            "range": "± 3.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.55,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.01,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 298.57,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 317.54,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.29,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 79.06,
            "range": "± 15.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 37.31,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 170.95,
            "range": "± 7.6%",
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
          "id": "eb8aacdfc0ecd381c41165e5504f35f5eeaf88fe",
          "message": "pkg: Update non-major dependencies (excluding React Native) (#4187)\n\nThe non-React Native half of Renovate's #4059. yarn.lock regenerated with\nyarn (dedupe --strategy highest); example npm lockfiles regenerated with\nnpm 11.\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-10-05T13:16:00-04:00",
          "tree_id": "ccad8ceb4d58738994c881bf3feb0afd7f42a72f",
          "url": "https://github.com/reactive/data-client/commit/eb8aacdfc0ecd381c41165e5504f35f5eeaf88fe"
        },
        "date": 1791220747667,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 132.46,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.29,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.64,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 303.03,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 357.14,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.23,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 77.52,
            "range": "± 14.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.42,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 194.19,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 243.9,
            "range": "± 2.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 166.67,
            "range": "± 9.3%",
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
          "id": "10e15cccf43a2bdbc9b48a65d9d3f2cc72847a89",
          "message": "enhance(core): Check set() Union rows per member (#4179)\n\n* enhance(core): Check set() Union rows per member\n\nA Union row is now checked against the member its discriminator selects,\nwithout the index signature that let a row fall through to another member.\nSpread updaters on a 30-member Union check about 3x faster than before\n(TS 6: 9.4s to 3.3s per 1000 calls), and rows that mix members' fields or\ncarry unknown keys are now errors.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01GzkTc2gisCbeWKi5F3v472\n\n* docs(blog): Link the set() updater speedup\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01GzkTc2gisCbeWKi5F3v472\n\n* docs: Note Union rows need literal discriminators to check per member\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01GzkTc2gisCbeWKi5F3v472\n\n* internal: Update type-check budget for per-member Union rows\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01GzkTc2gisCbeWKi5F3v472\n\n* docs(blog): Re-time Typical app row over 10 runs\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01GzkTc2gisCbeWKi5F3v472\n\n* docs(blog): Re-time every type-check benchmark over 10 runs\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01GzkTc2gisCbeWKi5F3v472\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T14:00:35-04:00",
          "tree_id": "89aad3a637a6ae92691b04845f2725031c9decd5",
          "url": "https://github.com/reactive/data-client/commit/10e15cccf43a2bdbc9b48a65d9d3f2cc72847a89"
        },
        "date": 1791223410353,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 173.93,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 53.76,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 434.78,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 425.72,
            "range": "± 10.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 55.26,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 400,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 408.33,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.71,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 84.03,
            "range": "± 15.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 45.98,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 263.16,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 333.33,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 204.17,
            "range": "± 9.8%",
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
          "id": "0ca688fa18f02fc120ab5722aeab5a2e56b1ae6e",
          "message": "ci: Queue benchmark master push runs instead of cancelling them (#4211)\n\nBenchmark workflows share one concurrency group for master pushes. With\nGitHub's default single pending slot, a third quick push cancels the\npending one and marks master red. Push runs now use queue: max; PR runs\nkeep cancel-in-progress.\n\n\nClaude-Session: https://claude.ai/code/session_01FbcU32urUKzbRdg672xQUG\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T19:57:04-04:00",
          "tree_id": "54e9afa7ab7bb474602d2387108db5b1dc63fe31",
          "url": "https://github.com/reactive/data-client/commit/0ca688fa18f02fc120ab5722aeab5a2e56b1ae6e"
        },
        "date": 1791244819980,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.96,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.95,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 312.5,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.86,
            "range": "± 9.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 69.93,
            "range": "± 14.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.85,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 208.33,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 263.16,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 172.47,
            "range": "± 10.1%",
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
          "id": "94f82a6ed5a53bf478845a2b3260b2750b8d94cc",
          "message": "docs: Type-check the Vue code examples (#4215)\n\n* internal: Type-check Vue docs examples (WIP)\n\n* ci: Run the Vue docs example check in the skills workflow\n\n* internal: Loose Vue examples import the nearest same-titled block\n\n* docs: Fix imports and Vue-only issues in docs/core Vue examples\n\n* docs: Fix imports and Vue-only issues in docs/rest Vue examples; regenerate skill references\n\n* internal: Simplify the Vue example check; type-check @data-client/vue/test examples\n\n- Reuse index.js walk() and docsInstances paths; derive placeholders from the playground DesignSystem\n- Map errors through the fence's raw lines instead of a per-line map\n- Group playgrounds by node instead of a module counter\n- Add @data-client/vue/test and core/mock editor types so Vue testing examples are checked\n- React expiry-policy demo uses the same typed set([Invalidate]) form as Vue\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NhTHFsx27AbMsxqkSuCvFe\n\n* ci: Run the Vue example check when the playground design system changes; keep check-only editor types out of the playground chunk\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NhTHFsx27AbMsxqkSuCvFe\n\n* Check Vue-only doc pages' examples too\n\nThe checker skipped every foo.vue.md as an override of foo.md, so pages\nthat only exist for Vue (DataClientPlugin, unit-testing-composables) were\nnever type-checked. Skip an override only when its base page exists, and\nadd the imports those pages' examples were missing.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NhTHFsx27AbMsxqkSuCvFe\n\n* Check untitled Vue SFC fences; fix Codex review findings\n\n- Treat any html fence with <script> or <template> as a Vue SFC, titled or\n  not, and fix the examples that surfaced (useController, RestEndpoint\n  pagination, Entity fragment marked nocheck)\n- Name a file by its fence language when the title's extension differs;\n  rewrite the _EndpointLifecycle Component.vue snippet as an SFC\n- Don't report success when vue-tsc exits without diagnostics\n- Run the skills workflow when the root package.json changes\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NhTHFsx27AbMsxqkSuCvFe\n\n* Keep the StreamManager spread; support Node 18 in the Vue check\n\n- Restore ...msg.args in the README StreamManager (args is variadic),\n  typing msg like the Managers page does\n- Group playground blocks without Map.groupBy, which Node 18 and 20 lack\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NhTHFsx27AbMsxqkSuCvFe\n\n* Simplify the Vue examples check\n\n- List pages the way the site resolves them: foo.vue.md stands for foo.md\n  (reusing index.js VUE_OVERRIDE), instead of a third override rule\n- Only root-level <script>/<template> make an html fence an SFC\n- A code title's extension is replaced by the fence language's\n- One grouping helper for playgrounds and stubs; rewrap README\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NhTHFsx27AbMsxqkSuCvFe\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T20:19:25-04:00",
          "tree_id": "ce0a6955c08057201fa08a0158131a4f92b7d75e",
          "url": "https://github.com/reactive/data-client/commit/94f82a6ed5a53bf478845a2b3260b2750b8d94cc"
        },
        "date": 1791246169841,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.92,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.83,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 344.83,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 327.96,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.2,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 312.5,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.89,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.64,
            "range": "± 16.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.78,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 208.33,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 168.08,
            "range": "± 10.0%",
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
          "id": "a403df8f22dadb0dbd9a6cf72a65f9187ae63176",
          "message": "docs(rest): Make SchemaSimple page concise and human-oriented (#4224)\n\n* docs(rest): Make SchemaSimple page concise and human-oriented\n\nCut library-internal implementation snippets, replace per-member delegate\nsections with tables, lead with a realistic args-dependent schema, and add\nverified caveats (primitives skip normalize, entity-like requirements,\nDepthLimited memoization). Fix maxEntityDepth default (64, not 128) in\nEntity docs and JSDoc.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HcaXWVmRV1cJxpNfotPufC\n\n* docs(rest): Address review on SchemaSimple wording; add maxEntityDepth changeset\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HcaXWVmRV1cJxpNfotPufC\n\n* docs(website): Redirect old /rest/api/CustomSchema URL to SchemaSimple\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HcaXWVmRV1cJxpNfotPufC\n\n* docs(rest): Point SchemaSimple to Schema Overview instead of its own table\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01HcaXWVmRV1cJxpNfotPufC\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T20:20:49-04:00",
          "tree_id": "eb28d5d111b55ef4ff1e1f01870edc6bea4b11e5",
          "url": "https://github.com/reactive/data-client/commit/a403df8f22dadb0dbd9a6cf72a65f9187ae63176"
        },
        "date": 1791246366056,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 140.85,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.86,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 350.99,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.14,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.51,
            "range": "± 9.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.31,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.63,
            "range": "± 14.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.3,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 215.08,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 173.93,
            "range": "± 10.5%",
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
          "id": "47502c664df913297fba3e5011a975dfd01c0d8d",
          "message": "fix: Type FETCH action.meta.promise as Promise (#4227)\n\n* fix: Type FETCH action.meta.promise as Promise\n\ncreateFetch always creates a real Promise, so managers can now call\n.finally()/.catch() on it. Restores the .finally MetricsManager docs example.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7W8qPpSd8d4KvckzscoNv\n\n* docs: Catch the derived finally() promise in the MetricsManager example\n\nA bare .finally() rejects again on a failed fetch, causing an unhandled\nrejection in apps that copy the example.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7W8qPpSd8d4KvckzscoNv\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T20:34:16-04:00",
          "tree_id": "fd97ca4d05921306a54e33ee6a16ea70dfe8228f",
          "url": "https://github.com/reactive/data-client/commit/47502c664df913297fba3e5011a975dfd01c0d8d"
        },
        "date": 1791247042973,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 160.01,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 52.49,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 55.56,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 370.37,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 384.62,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 14.09,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 83.34,
            "range": "± 13.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 46.08,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 238.1,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 312.5,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 188.68,
            "range": "± 7.5%",
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
          "id": "46f1f24bcb04824805747ed2a1effe7baece337c",
          "message": "fix(core): Type controller.set() with a single Invalidate (#4230)\n\n* fix(core): Type controller.set() with a single Invalidate\n\n`ctrl.set(new Invalidate(Post), { id: '5' })` worked at runtime but\nfailed to type-check, since Invalidate isn't Queryable. The batch set()\noverload now also accepts Invalidate schemas, typing the row by the\nEntity's fields. It takes no args and no updater, like batch set().\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Qp3vZmf4Z7EDq4zKUvfDfJ\n\n* chore(website): Regenerate playground editor types\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Qp3vZmf4Z7EDq4zKUvfDfJ\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T20:40:43-04:00",
          "tree_id": "56f1fea2096a6327d7cd6bca34e229ddfe945a04",
          "url": "https://github.com/reactive/data-client/commit/46f1f24bcb04824805747ed2a1effe7baece337c"
        },
        "date": 1791247440207,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.64,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.15,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 289.92,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 277.78,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.31,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.63,
            "range": "± 11.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.9,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 200,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 158.73,
            "range": "± 9.2%",
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
          "id": "b55696c72ad3e73e0a2f50d3751c7104cd4ad9ee",
          "message": "fix: Accept Controller subclasses in DataProvider and DataClientPlugin types (#4228)\n\n* fix: Accept Controller subclasses in DataProvider and DataClientPlugin types\n\nA plain `class MyController extends Controller` failed to type-check as\nthe Controller option, since `typeof Controller` has a generic\nconstructor. Type the option as a constructor taking { gcPolicy } and\nreturning a Controller, and drop the generic workaround in ActController.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01RQRrz45Jpij7MBho8N4Xj5\n\n* fix: Accept Controller subclasses in MockController(); blog entry\n\nAlso align the Controller option headings in the DataProvider and\nDataClientPlugin docs with their interface blocks.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01RQRrz45Jpij7MBho8N4Xj5\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T20:43:59-04:00",
          "tree_id": "9dd4a7d841c65b6c1390cb46796fefb9a47747df",
          "url": "https://github.com/reactive/data-client/commit/b55696c72ad3e73e0a2f50d3751c7104cd4ad9ee"
        },
        "date": 1791247638265,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 133.33,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 45.05,
            "range": "± 3.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 327.96,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 333.33,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 39.14,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 357.14,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 350.99,
            "range": "± 10.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.38,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 77.82,
            "range": "± 14.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 37.38,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 294.12,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 165.3,
            "range": "± 9.7%",
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
          "id": "31b182033106d5ce44352481577d3c321e39ebe9",
          "message": "fix: Parse declarations on TypeScript 4.0–4.4 (#4232)\n\n* fix: Parse @data-client declarations on TypeScript 4.0-4.4\n\nEmit separate `import type` statements instead of inline `type`\nspecifiers, which TypeScript < 4.5 can't parse even with skipLibCheck.\nLint against inline type specifiers, type-check react subpaths and\n@data-client/test on every TS in CI, and add a Vue typetest (TS >= 4.5).\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01RcdHPq6pDjEct8MLnsMeSf\n\n* internal: Parse every published declaration on each matrix TypeScript\n\nCatches syntax newer than the supported TypeScript on entry points no\ntypetest imports. Also reuse the libcheck tsconfig for the Vue typetest\nand move the Vue TypeScript note into the TypeScript section.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01RcdHPq6pDjEct8MLnsMeSf\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T21:28:48-04:00",
          "tree_id": "b2ac419b32f8ab9c003b6dd79c493ef37c062837",
          "url": "https://github.com/reactive/data-client/commit/31b182033106d5ce44352481577d3c321e39ebe9"
        },
        "date": 1791250332116,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 132.46,
            "range": "± 3.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.46,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 307.77,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 38.91,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 303.03,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.91,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.07,
            "range": "± 13.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.65,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 200,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 256.41,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 166.67,
            "range": "± 9.1%",
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
          "id": "954b1e9041ba47b39b9ffdd53a55b0b16adc8675",
          "message": "fix(react): Type prepareStore()'s store as a redux Store (#4238)\n\n* fix(react): Type prepareStore()'s store as a redux Store\n\nreact-redux's <Provider> rejected prepareStore()'s store, typed as a\nminimal { getState, subscribe }. Type it as the vendored redux Store and\nrestore replaceReducer() and [Symbol.observable]() in the vendored\ncreateStore so the type matches what it returns.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01YY2pHnmcWHzdQTJcPopPKQ\n\n* test(react): Run react-redux Provider test on React 18+; simplify\n\nreact-redux 9 needs React 18, so the React 17 CI job can't render\n<Provider>. Drop a redundant typed local and keep the vendored\nobservable() verbatim from redux 5.0.1.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01YY2pHnmcWHzdQTJcPopPKQ\n\n* fix(react): Stub replaceReducer and observable instead of vendoring them\n\nreact-redux's types need the members but never call them, so throwing\nstubs typed as never keep the type honest without the extra bytes.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01YY2pHnmcWHzdQTJcPopPKQ\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-05T23:24:30-04:00",
          "tree_id": "e013867055510a8d5db2a336601189ef633104ec",
          "url": "https://github.com/reactive/data-client/commit/954b1e9041ba47b39b9ffdd53a55b0b16adc8675"
        },
        "date": 1791257264003,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 173.93,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 51.95,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 408.33,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 363.76,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.3,
            "range": "± 9.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 370.37,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 14,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 81,
            "range": "± 15.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 43.67,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 238.1,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 322.58,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 200,
            "range": "± 10.9%",
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
          "id": "f992c212a20fb20323b9ed0770e1efe7f7c35332",
          "message": "pkg(security): Bump patched releases for security advisories (#4248)\n\nRefresh in-range lockfile resolutions and pin transitive packages\nwhose parents still depend on a vulnerable version.\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-10-06T11:24:49-04:00",
          "tree_id": "477d963bafafdaaac99e1abf0fd0e89d3e580013",
          "url": "https://github.com/reactive/data-client/commit/f992c212a20fb20323b9ed0770e1efe7f7c35332"
        },
        "date": 1791300492801,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 139.87,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.75,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 312.5,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.3,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 298.57,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 303.31,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 6.71,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 70.92,
            "range": "± 11.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.4,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 192.31,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 168.08,
            "range": "± 9.9%",
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
          "id": "fc4b015ca0899a2685af881d17f765dce27ffc1a",
          "message": "fix(test): Fixture args accept readonly tuples (#4250)\n\nFixtures written with `args: [...] as const` were rejected because\n`args` was typed as the mutable `Parameters<E>`. Type it as\n`Readonly<Parameters<E>>` in @data-client/core/mock and @data-client/test,\nrestore `as const` in the docs examples #4246 dropped, and add a\n`fixtures` typeperf scenario.\n\n\nClaude-Session: https://claude.ai/code/session_01K9dm6BAco8rRjbd6aLcJZB\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-06T12:15:55-04:00",
          "tree_id": "66dde639d9ebf8e2fe87c9815e4de35db520bd95",
          "url": "https://github.com/reactive/data-client/commit/fc4b015ca0899a2685af881d17f765dce27ffc1a"
        },
        "date": 1791303570780,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 169.49,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 51.95,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 53.62,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 416.67,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.38,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 80.65,
            "range": "± 15.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 46.73,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 250,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 322.58,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 192.31,
            "range": "± 8.0%",
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
          "id": "6ed4f01feefc9c3e8b0831f359db74553fef624b",
          "message": "chore: Bump React to 19.3.0 (#4264)\n\n* chore: Bump React to 19.3.0\n\nPin react, react-dom and react-test-renderer at 19.3.0 everywhere they\nwere pinned at 19.2.3. CI's extra React job now covers 19.2 (the\nprevious minor) instead of 19.3, and the native job runs the installed\nReact like latest does.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01SHijwZ57GWD8EtGYd7WWry\n\n* ci: Pass the pinned previous-minor React through the matrix parameter\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01SHijwZ57GWD8EtGYd7WWry\n\n* ci: Keep the React Native job on React 19.2.3, which RN 0.86 pairs with\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01SHijwZ57GWD8EtGYd7WWry\n\n* chore: Regenerate standalone example lockfiles for React 19.3.0\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01SHijwZ57GWD8EtGYd7WWry\n\n* ci: Cover the previous React minor in the native job instead of a separate job\n\nBoth jobs installed React 19.2.3, so the native job now also runs the\nper-minor ReactDOM suites, dropping one job per pipeline.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01SHijwZ57GWD8EtGYd7WWry\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-07T23:04:46Z",
          "tree_id": "94c62e65a8feb652c0e8cdb146446ac7357f7208",
          "url": "https://github.com/reactive/data-client/commit/6ed4f01feefc9c3e8b0831f359db74553fef624b"
        },
        "date": 1791414698317,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 135.14,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.24,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 392.31,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 363.76,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.05,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.47,
            "range": "± 10.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 78.13,
            "range": "± 14.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.3,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 289.92,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 8.7%",
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
          "id": "6d35253a942df0c31e40dc6d9a07b0e5717318a7",
          "message": "internal: Default GitHub Actions tokens to read-only (#4271)\n\n* internal: Default GitHub Actions tokens to read-only\n\nEvery workflow now sets top-level contents: read. Jobs that write\n(benchmark result pushes and reviews, bundle size comments, releases)\ndeclare their own permissions, so gates and reusable workflows no longer\ninherit write scopes.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01FkN6kekrEGTUVwjWuJSKiP\n\n* internal: Keep the write token out of benchmark PR code\n\nBenchmark jobs run PR code with a write-scoped token, so don't persist\nit in .git/config; github-action-benchmark passes its own token to git.\nDrop the rule sentence restating GitHub's reusable workflow behavior.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01FkN6kekrEGTUVwjWuJSKiP\n\n* internal: Keep the write token out of bundle size PR code\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01FkN6kekrEGTUVwjWuJSKiP\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-08T03:18:33Z",
          "tree_id": "7c2916d93cd5675a6696e4016f8eecf1c15ecb9e",
          "url": "https://github.com/reactive/data-client/commit/6d35253a942df0c31e40dc6d9a07b0e5717318a7"
        },
        "date": 1791429773240,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 117.65,
            "range": "± 1.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.29,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 333.33,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.25,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 312.5,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 317.54,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.12,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 75.76,
            "range": "± 10.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.91,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 188.68,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 190.49,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 169.49,
            "range": "± 7.7%",
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
          "id": "a3c6564e3cfc6ec3b497374a4c3c359a4f161311",
          "message": "internal(website): Build the site with Docusaurus Faster (#4290)\n\n* internal(website): Build the site with Docusaurus Faster\n\nRspack, SWC and Lightning CSS minifiers, the MDX cross-compiler cache and\nSSG worker threads. JS keeps compiling with Babel so the React Compiler\nstill runs. A full four-locale build drops from 294s to 108s cold and 84s\nto 54s warm locally.\n\nThe SWC HTML minifier rewrites the homepage logo's inline `currentcolor`\nto `currentColor`, which React reported as a hydration mismatch; the SVG\nnow spells it that way. CI's cache key changes so Rspack's cache doesn't\ncarry the old webpack cache along.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEuAfapYTo3F75pPjhm8xz\n\n* internal(website): Turn on every Faster flag but swcJsLoader via fasterByDefault\n\nFlags Docusaurus adds later turn on too, without listing each one. Also drop\n`start`'s webpack 4 OpenSSL workaround, which Rspack doesn't need.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01EEuAfapYTo3F75pPjhm8xz\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-10T03:21:36Z",
          "tree_id": "4eb97813ab558d417b771e51c2d02beb1e5d25e2",
          "url": "https://github.com/reactive/data-client/commit/a3c6564e3cfc6ec3b497374a4c3c359a4f161311"
        },
        "date": 1791602883812,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.86,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.67,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 327.96,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.39,
            "range": "± 10.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 96.15,
            "range": "± 11.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.91,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 219.81,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 303.03,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 183.5,
            "range": "± 9.3%",
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
          "id": "2df300abae32b55031f3d0ea7ff167f66b8852b5",
          "message": "fix(normalizr): set([Entity], rows) types with exactOptionalPropertyTypes (#4312)\n\n* fix(normalizr): set([Entity], rows) types with exactOptionalPropertyTypes\n\nEntityInterface's optional maxEntityDepth and cacheWith now accept undefined,\nso Entity classes (which declare maxEntityDepth?: number | undefined) satisfy it\nwhen exactOptionalPropertyTypes is on, as in the website's playground editor.\n\nThe docs example checker now uses the editor's exactOptionalPropertyTypes for\nReact examples, so this class of editor-only error fails CI.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01URQtAdEQvgzt8KxtmdEvSE\n\n* chore: regenerate skill references\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01URQtAdEQvgzt8KxtmdEvSE\n\n* refactor(website): share the playground editor's type-check flags with the docs example check\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01URQtAdEQvgzt8KxtmdEvSE\n\n* chore(ci): run the docs example check when the editor's type-check flags change\n\nAlso restores why noImplicitAny is off, next to the shared flags.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01URQtAdEQvgzt8KxtmdEvSE\n\n* docs(website): checkExamples header says only React examples match the editor\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01URQtAdEQvgzt8KxtmdEvSE\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-11T17:25:44Z",
          "tree_id": "ed2ec70c4d3d927ce689b1def480b280a8f0815a",
          "url": "https://github.com/reactive/data-client/commit/2df300abae32b55031f3d0ea7ff167f66b8852b5"
        },
        "date": 1791739799545,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 173.93,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 53.48,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 416.67,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 55.71,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 344.83,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 377.49,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.44,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 86.21,
            "range": "± 15.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 46.51,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 243.9,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 333.33,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 196.15,
            "range": "± 9.1%",
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
          "id": "cb6d9f21ae73ab79ac5f1d6aea04f68d7c2c6336",
          "message": "enhance(rest): Type getOptimisticResponse() returns by schema (#4198)\n\n* enhance(rest): Type getOptimisticResponse() returns by schema\n\ngetOptimisticResponse() returned ResolveType<F>, which is `any` for any\nendpoint without a typed process(), so its return was never checked.\nIt now returns the raw input the schema normalizes (like a\nController.set() value) in those cases.\n\n- Move SetValue types from core into normalizr, mirrored in endpoint\n- EndpointExtraOptions takes the schema as an optional second param\n- resource().extend({...}): endpoints whose options set no generic\n  member (only getOptimisticResponse) fall back to the endpoint's args\n- resource().extend(key) no longer retypes an existing key from `get`\n  when its own overload fails, which hid errors\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* internal: Share IsUnion in rest types, drop dead test lines\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* docs(blog): Link optimistic response types PR\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* internal: Fail CI when endpoint's SetValue mirror drifts from normalizr's\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* internal: Move IsUnion to its own file so the TS 4.0 types see it\n\nThe hand-written ts4.0 utiltypes override doesn't export it.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* internal: Regenerate playground editor types\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* internal: Cover Invalidate in the SetValue mirror test\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* fix(rest): Type object-form extend getOptimisticResponse with an overridden schema\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* internal: Regenerate playground editor types\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* fix(endpoint): Type Endpoint.extend getOptimisticResponse by its schema\n\nEndpoint.extend() constrained options with the default schema, so\ngetOptimisticResponse() went unchecked when the fetch resolves any; it now\nuses the options' schema, else the endpoint's. The TS 4.2 overlay also\npasses the schema to EndpointExtraOptions.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n* fix(endpoint): Keep getOptimisticResponse() untyped for schema: null\n\nnormalize() treats null like undefined (no schema), so getOptimisticResponse()\nreturns the fetch's resolved type for both. Also cover resource().extend()'s\nnew-key and function forms.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01TZb5b5RZW46WNQRDrBWFC4\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-12T04:09:50Z",
          "tree_id": "d15f0f32523f48c436acf6abe29f8afa12191e16",
          "url": "https://github.com/reactive/data-client/commit/cb6d9f21ae73ab79ac5f1d6aea04f68d7c2c6336"
        },
        "date": 1791778565609,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 129.04,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.59,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 312.5,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 327.96,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 41.41,
            "range": "± 11.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 327.96,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.11,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 70.42,
            "range": "± 9.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.01,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 196.08,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 256.41,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 166.67,
            "range": "± 9.3%",
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
          "id": "0799aa6723d84b76239c534577fcffb479aa27c8",
          "message": "website: Work offline as an installed app (#4327)\n\n* website: Read pages offline\n\nA service worker keeps a copy of each page and file the site loads and\nanswers from it only when the network fails, so online visits always get\nthe deployed build. The web manifest gets a name and start URL so the\ninstalled site opens at its root.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Simplify offline worker registration and trim one at a time\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Keep only page files offline, one copy per page\n\nSkips media and data on the first-visit backfill, requests each page once\nper tab, stores pages without their query, and falls back to a normal\nrequest when navigation preload fails.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Keep the manifest scope explicit and register after a late load\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Fetch pages in browsers without navigation preload\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Count the landing page as kept offline\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Backfill the page a first visit landed on\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Use @docusaurus/plugin-pwa, only in the installed app\n\nThe installed site (or ?offlineMode=true) precaches the whole build and\nshows the plugin's refresh popup after a deploy. Browser tabs never load\nthe plugin's registration, so they get no service worker. A small\nswCustom serves pages offline under trailingSlash: false, which the\nplugin's lookup misses. Replaces the custom network-first worker.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Install each build as its own app, and find dotted pages offline\n\nThe manifest link moves to the plugin's pwaHead so it sits under each\nbuild's baseUrl (/next/, /es/), and its start_url, scope and icons are\nrelative to it, so installing from /next opens /next, the build with the\nworker. swCustom now tries every page path, including ones with a dot.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Clarify the PWA comments\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: cache pages under their served URL instead of a custom worker lookup\n\nRewrite precache entries like docs/intro.html to docs/intro so the PWA\nplugin's own offline lookup finds them, and precaching fetches the URL\nVercel serves rather than one it redirects.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Load static files from each build's own path\n\nThe /next/ and locale builds linked fonts, favicons and images at the site\nroot, outside their installed app's offline worker. Link them under the\nbuild's baseUrl instead, and leave /next/'s blog out of its precache since\nits blog links go to the root site.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n* website: Load the homepage's Agent Skills icon from the build's own path\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01JWinBKW3mPyLScYiPD3j7S\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-12T21:55:05Z",
          "tree_id": "bf667ab34805bbfc3ae6a20c06aa181dfc53ad62",
          "url": "https://github.com/reactive/data-client/commit/0799aa6723d84b76239c534577fcffb479aa27c8"
        },
        "date": 1791842460436,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 217.39,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 68.97,
            "range": "± 3.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 645.83,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 555.56,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 71.69,
            "range": "± 9.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 476.19,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 500,
            "range": "± 12.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 20.49,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 118.35,
            "range": "± 13.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 59.88,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 322.58,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 250.16,
            "range": "± 11.3%",
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
          "id": "b4899d05731ad672cf17432ba603008a8c888169",
          "message": "pkg: Update build packages (major) (#4209)\n\n* pkg: Update build packages\n\n* pkg: Adapt build to Babel 8, webpack-dev-server 6, linaria 8\n\n- CI: run node_matrix on Node 22.18/24.11 (Babel 8 engines); limit full-app\n  tsc to TS 5.3 since linaria 8 types need TS 5.0+\n- babel-node 8 passes flags after the script to the script; move them first\n- Published packages accept @babel/runtime ^7.20.0 || ^8.0.0 so Babel 7 apps\n  keep deduping (output only uses helpers present in both)\n- declare fields assigned in constructors so Babel 8 doesn't emit\n  `this.x = void 0`\n- Example apps: engines node >=22.18.0; drop unused @linaria/shaker\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n* internal: Tidy Babel 8 CI follow-ups\n\n- Gate the full-app tsc on TS >= 5.0 (matching the linaria reason) instead of\n  the single 5.3 matrix entry\n- Drop the stale legacy-node npm comment in node_matrix\n- normalizr-redux engines match its Babel 8 babel-node script\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n* internal: Example engines match Babel 8's Node range\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n* internal: Next.js example engines match Babel 8's Node range\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n* internal: Restore libc fields in example lockfiles\n\nRegenerated with npm 11 so platform libc metadata stays intact.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n* internal: One Node floor for the Babel 8 toolchain; drop @types/babel__core\n\nRoot and remaining Babel 8 examples declare ^22.18.0 || >=24.11.0, and\n@types/babel__core goes since Babel 8 ships its own types.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n* internal: Point initialize skill at the root Node engines\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NkGRqFawhBWCcgbgXZLtg4\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-13T22:26:31Z",
          "tree_id": "bba7ca5fe36c14e2c9c55d8855dbda46df2391ea",
          "url": "https://github.com/reactive/data-client/commit/b4899d05731ad672cf17432ba603008a8c888169"
        },
        "date": 1791930793916,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 129.87,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.98,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 322.58,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.25,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 285.71,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 285.71,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 7.07,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 69.69,
            "range": "± 12.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.09,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 202.04,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 263.16,
            "range": "± 3.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 161.29,
            "range": "± 9.5%",
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
          "id": "d86525996f318ed5a4c80125e012d23b4426bfe8",
          "message": "pkg: Update all non-major dependencies (#4208)\n\n* pkg: Update all non-major dependencies\n\n* fix(react): Support React Native 0.87\n\nReact Native 0.87 removed InteractionManager, which the native useSuspense,\nuseFetch, useDLE, GCPolicy and IdlingNetworkManager used. Use\nrequestIdleCallback, which React Native always installs; the native GCPolicy\nand IdlingNetworkManager overrides are now redundant with the web ones.\n\nMap react-native/setup-env for jest (only exposed via package exports in\n0.87) and polyfill requestIdleCallback in the native jest environment.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0168AAhQCiVrG1C6JWvjQZUY\n\n* docs: Describe React Native idle scheduling accurately after InteractionManager removal\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0168AAhQCiVrG1C6JWvjQZUY\n\n* Revert \"docs: Describe React Native idle scheduling accurately after InteractionManager removal\"\n\nThis reverts commit 8b17a404dfb3ebaa3f2464fc24dfbe505c7c9db2.\n\n* Revert \"fix(react): Support React Native 0.87\"\n\nThis reverts commit 5122327368d288988b81ace07e71820a33c8f5e2.\n\n* pkg: Keep react-native at 0.86.2\n\nThe React Native 0.87 update needs code changes, so it moves to its own PR.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0168AAhQCiVrG1C6JWvjQZUY\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-13T23:52:53Z",
          "tree_id": "02fbc0567076dab3db3941ee71cbd887f3c93807",
          "url": "https://github.com/reactive/data-client/commit/d86525996f318ed5a4c80125e012d23b4426bfe8"
        },
        "date": 1791935953684,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 173.93,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 49.63,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.14,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 53.76,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 317.54,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.23,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 90.09,
            "range": "± 14.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 43.86,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 224.75,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 322.58,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 6.7%",
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
          "id": "4829b1033a24f52e2a1d0e5a03532f9cfa4f525f",
          "message": "pkg: Update react-native to 0.87.1 (#4355)\n\n* pkg: Update react-native to 0.87.1\n\nReact Native 0.87 removed InteractionManager, which the native useSuspense,\nuseFetch, useDLE, GCPolicy and IdlingNetworkManager used. Keep using it where\nReact Native still provides it, and fall back to requestIdleCallback.\n\nMap react-native/setup-env for jest (only exposed via package exports in\n0.87) and polyfill requestIdleCallback in the native jest environment.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0168AAhQCiVrG1C6JWvjQZUY\n\n* fix(react): Read InteractionManager through a default import\n\nA namespace import of react-native enumerates every export, which evaluates\nall of its lazy getters under Metro's experimentalImportSupport and skips the\nnon-enumerable InteractionManager stub in 0.87.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0168AAhQCiVrG1C6JWvjQZUY\n\n* enhance: Simplify idleCallback InteractionManager detection\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0168AAhQCiVrG1C6JWvjQZUY\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-14T00:08:10Z",
          "tree_id": "51a7db8001fbfae65ca873ec8c1e18c7bf0aa3da",
          "url": "https://github.com/reactive/data-client/commit/4829b1033a24f52e2a1d0e5a03532f9cfa4f525f"
        },
        "date": 1791936741507,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 138.89,
            "range": "± 3.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.48,
            "range": "± 3.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 363.76,
            "range": "± 12.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.14,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.66,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 350.99,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.36,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.34,
            "range": "± 13.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.39,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 222.22,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 178.57,
            "range": "± 9.1%",
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
          "distinct": false,
          "id": "bd0f31f5d2afc358ac868b80c703edb3579acfb1",
          "message": "pkg: Update `@anansi/cli` to v4 (#4356)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-14T01:46:36Z",
          "tree_id": "2dfafb2128c22579e61c7fafc67afe3cdd5ac0a0",
          "url": "https://github.com/reactive/data-client/commit/bd0f31f5d2afc358ac868b80c703edb3579acfb1"
        },
        "date": 1791942653080,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 132.46,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.37,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 333.33,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 45.77,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 303.03,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.2,
            "range": "± 11.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 77.52,
            "range": "± 12.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.34,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 270.27,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 168.08,
            "range": "± 9.6%",
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
          "id": "f454bb428a84cfd0d9e624484a8110eaaddce865",
          "message": "pkg: Update `@anansi/eslint-plugin` to v2 (#4357)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-14T01:46:51Z",
          "tree_id": "86259b4752e1889cdfd28173eef9f2bfd3aea15e",
          "url": "https://github.com/reactive/data-client/commit/f454bb428a84cfd0d9e624484a8110eaaddce865"
        },
        "date": 1791942850155,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 144.93,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 45.25,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 416.67,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 392.31,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 47.96,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 357.14,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 377.49,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.67,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 95.7,
            "range": "± 13.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 40,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 243.9,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 322.58,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 186.93,
            "range": "± 10.7%",
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
          "id": "ad31756cbc57d27b051b5f3e451c029fdcaa04cd",
          "message": "pkg: Update validation packages (#4360)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-14T01:56:23Z",
          "tree_id": "1fc2c6264bc05fa0a8f1f0f808ee085668b2ce6c",
          "url": "https://github.com/reactive/data-client/commit/ad31756cbc57d27b051b5f3e451c029fdcaa04cd"
        },
        "date": 1791943375086,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 3.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 43.57,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 344.83,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 303.03,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 44.55,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 285.71,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 307.77,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.05,
            "range": "± 11.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 72.99,
            "range": "± 11.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.03,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 277.78,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 172.41,
            "range": "± 10.2%",
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
          "id": "2830db290c502691490d9a66004a7265a11fbd53",
          "message": "pkg: Update `@types/node` to v26 (#4365)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-14T02:19:12Z",
          "tree_id": "bee5b363e89de57886e69aa097169d1ea853bbf2",
          "url": "https://github.com/reactive/data-client/commit/2830db290c502691490d9a66004a7265a11fbd53"
        },
        "date": 1791944603897,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.06,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.5,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 344.83,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 312.5,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.57,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 277.78,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 285.71,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.37,
            "range": "± 11.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 69.93,
            "range": "± 14.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.46,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 185.19,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 281.75,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 166.67,
            "range": "± 10.6%",
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
          "distinct": false,
          "id": "f3be7db263b988b0a9e58fd76070286a20a7a4fb",
          "message": "pkg: Update actions/setup-node action to v7 (#4370)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-14T02:38:06Z",
          "tree_id": "a4f032f2f38bc374eee60b18ecc0422f9b85476f",
          "url": "https://github.com/reactive/data-client/commit/f3be7db263b988b0a9e58fd76070286a20a7a4fb"
        },
        "date": 1791945679781,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 232.56,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 75.19,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 666.67,
            "range": "± 11.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 588.24,
            "range": "± 10.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 72.2,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 606.62,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 555.56,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 22.1,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 126.58,
            "range": "± 14.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 60.61,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 370.37,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 476.19,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 277.78,
            "range": "± 7.8%",
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
          "id": "ed7de64c3c5ecde940d0ae9c3198ec55ab31abfc",
          "message": "pkg(website): Update react-live to v5 and adopt its fixes (#4366)\n\n* pkg: Update `react-live` to v5\n\n* pkg(website): Adopt react-live v5 cleanups\n\nreact-live v5 gives its error boundary getDerivedStateFromError and stops\nemitting __self from sucrase, so the playground no longer needs to demote\nthose two console messages.\n\nDrop @docusaurus/theme-live-codeblock: no docs use live code blocks, and it\nbundled a second copy of react-live (v4) into every page with a code block.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019RCvGPJXB1cCWsppCh9yQE\n\n* internal(website): Tidy playground console demotion after react-live v5\n\nMatch React's caught-error log on its stable line (the 'component:' pattern\nno longer matched React 19's text), explain why a console patch is used, drop\nthe stale translate lock key, and cover the hook with a test.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019RCvGPJXB1cCWsppCh9yQE\n\n* internal(website): Test console demotion against React's real caught-error log\n\nThrow inside a real error boundary instead of copying React's text, cover\noverlapping previews, and match the single remaining pattern directly.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019RCvGPJXB1cCWsppCh9yQE\n\n* internal(website): Reuse ErrorBoundary in console demotion test\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019RCvGPJXB1cCWsppCh9yQE\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-14T02:44:35Z",
          "tree_id": "a10d3d532df4a38c655b4367166ae3a581f4c520",
          "url": "https://github.com/reactive/data-client/commit/ed7de64c3c5ecde940d0ae9c3198ec55ab31abfc"
        },
        "date": 1791946275759,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 136.99,
            "range": "± 4.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.64,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 350.99,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 40.82,
            "range": "± 8.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 333.33,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 327.96,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.48,
            "range": "± 11.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 78.74,
            "range": "± 14.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 35.91,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 212.77,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 285.71,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 172.41,
            "range": "± 10.4%",
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
          "id": "4eb1c1efc3c85c4067e2c480a6a4878c90af7398",
          "message": "pkg: Update build packages (#4363)\n\n* pkg: Update build packages\n\n* pkg: Regenerate yarn.lock; hold rollup at 4.64.5\n\nrollup 4.64.6 is under a day old, so yarn's npmMinimalAgeGate quarantines\nit and Renovate's lockfile update failed.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01X9faGn9X1XtsnJoubudpnJ\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-13T23:05:58-04:00",
          "tree_id": "9c154e6005130061da30c39f2509916c158a6aaf",
          "url": "https://github.com/reactive/data-client/commit/4eb1c1efc3c85c4067e2c480a6a4878c90af7398"
        },
        "date": 1791947337419,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 200,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 63.9,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 500,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 476.19,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 73.53,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 454.55,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 434.78,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 22.19,
            "range": "± 12.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 114.29,
            "range": "± 12.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 54.65,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 303.03,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 243.9,
            "range": "± 9.5%",
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
          "distinct": false,
          "id": "5b1c7b8bd385f87e2d5e91a72dfa9b4d3eb4fd53",
          "message": "fix: Managers without middleware, React Native focus refetch, fetchIfStale docs (#4378)\n\n* fix(core): Managers without middleware pass actions through\n\napplyManager called manager.middleware() unconditionally, though Manager\ntypes middleware as optional, so a Manager with only init/cleanup threw.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* fix(react): Native focus refetch uses current expiry and args\n\nThe useFocusEffect in the native useSuspense/useFetch/useDLE had [] deps,\nso it compared against the first render's expiresAt and args, refetching\nfresh data on every refocus. Also refetch Invalid data, like the render path.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* docs(core): fetchIfStale returns cached data when fresh\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* chore: regenerate skill references\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* docs(blog): note Manager and native focus fixes\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* fix(core): Managers must define middleware\n\nReplace the pass-through with a clear development error naming the\nManager, and plan making middleware required in the type. Also cover\nuseDLE and useFetch in the native refocus test.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-14T07:46:17Z",
          "tree_id": "920022ca5ba447d99cf3648f295ad1c6be779013",
          "url": "https://github.com/reactive/data-client/commit/5b1c7b8bd385f87e2d5e91a72dfa9b4d3eb4fd53"
        },
        "date": 1791964336787,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 161.29,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 53.06,
            "range": "± 2.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 344.83,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.22,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 333.33,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 12.33,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 86.58,
            "range": "± 10.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 41.58,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 227.27,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 317.54,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 190.49,
            "range": "± 8.1%",
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
          "id": "31f3ddbc178ade2a7f59f7029a54c416df70e003",
          "message": "BREAKING: Manager.middleware is required; remove getMiddleware() (#4382)\n\n* BREAKING: Manager.middleware is required; remove getMiddleware()\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* docs(blog): link #4382\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* fix(website): Playground reports Managers without middleware\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n* test(website): give the swap fixture a middleware\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_018H8V1uRUssFCPyAjSupYgi\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-14T13:58:32Z",
          "tree_id": "8b136073b3b2663c05e94df6a357ffd43aef7fa1",
          "url": "https://github.com/reactive/data-client/commit/31f3ddbc178ade2a7f59f7029a54c416df70e003"
        },
        "date": 1791986559507,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 170.95,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 51.02,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 54.06,
            "range": "± 10.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 344.83,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 11.38,
            "range": "± 5.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 95.24,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 45.35,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 224.75,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 333.33,
            "range": "± 4.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 9.7%",
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
          "id": "140fab3b579d3afdb6790824b69744a45333d265",
          "message": "pkg: Update playwright monorepo to v1.64.0 (#4383)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-14T19:44:24Z",
          "tree_id": "e33e6caa88e39aa7b0a45dfff979c981cd72422e",
          "url": "https://github.com/reactive/data-client/commit/140fab3b579d3afdb6790824b69744a45333d265"
        },
        "date": 1792007474842,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 165.3,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 53.48,
            "range": "± 3.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 408.33,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 454.55,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 55.56,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 357.14,
            "range": "± 10.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 363.76,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10.62,
            "range": "± 7.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 90.5,
            "range": "± 10.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 43.57,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 263.16,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 322.58,
            "range": "± 9.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 204.08,
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
          "id": "a50e3aa0aadda31b59b4adb63cbf3794f5ef170a",
          "message": "pkg: Update react to v19.3.1 (#4398)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-17T13:32:59Z",
          "tree_id": "92861b0ed44a36817cde0455a5f8a87592f6b3ee",
          "url": "https://github.com/reactive/data-client/commit/a50e3aa0aadda31b59b4adb63cbf3794f5ef170a"
        },
        "date": 1792244232484,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 151.52,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 52.91,
            "range": "± 3.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 339.08,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 384.62,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.22,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 281.75,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10.8,
            "range": "± 7.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 85.11,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 41.5,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 227.27,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 363.76,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 183.5,
            "range": "± 6.7%",
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
          "id": "7c55890a6bb95958899ee2267d9acdbe2d1a4b63",
          "message": "pkg: Update react-native to 0.88 (#4401)\n\n* pkg: Update all non-major dependencies\n\n* pkg: Support React Native 0.88 in tests and CI\n\nTake react-native's jest aliases from @react-native/jest-preset instead of\ncopying them: 0.88 adds the exports-only react-native/react-private-interface\nentry, which the copied mapper resolved as a missing directory.\n\nReact Native 0.88 bundles the React 19.3 renderer, so the native job runs\nthe ReactNative suites on the installed React and only then downgrades to\n19.2.3 for the previous-minor ReactDOM suites.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01DtLiYpnhzjcWBNPipb6j8W\n\n* internal: Explain the native job's React 19.2 pin\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01DtLiYpnhzjcWBNPipb6j8W\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-17T19:15:18Z",
          "tree_id": "62c5193d1c28658fdd0334e7a34b1df759eb1961",
          "url": "https://github.com/reactive/data-client/commit/7c55890a6bb95958899ee2267d9acdbe2d1a4b63"
        },
        "date": 1792264886703,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 157.49,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 49.38,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 357.14,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 53.63,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 318.18,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.07,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 76.05,
            "range": "± 10.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 41.84,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 274.02,
            "range": "± 1.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 298.57,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 185.19,
            "range": "± 6.8%",
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
          "id": "a32740d14de86b7006ccc497484dd52c0bc54c23",
          "message": "feat(core): Log recent actions on __DC_ACTIONS__ and give same-named stores unique keys (#4393)\n\n* feat(core): Log recent actions on __DC_ACTIONS__ and give same-named stores unique keys\n\nDevToolsManager now records each store's recent actions in development,\nfrom startup and with or without the Redux DevTools extension, on\nglobalThis.__DC_ACTIONS__ (keyed like __DC_CONTROLLERS__). A store whose\ndevtools name is taken registers as 'name (2)' instead of replacing the\nfirst. The debugging skill uses the built-in log and falls back to\nwrapping dispatch on older versions.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Keep replacing same-named stores when server rendering\n\nPer-request SSR stores (e.g. Vue's DataClientPlugin with default managers)\nnever run cleanup, so suffixing their keys would keep every request's\nstore alive in development. Unique keys now apply only on a page.\n\nAlso covers the third-collision key and the cleanup guard in tests.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Detect server rendering with typeof window, keeping unique keys on React Native\n\nReact Native has no document but does define window, so the document\ncheck made same-named React Native stores replace each other.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* test(core): Cover unique keys where window exists without document\n\nPins the React Native case, and words the docs and comment as the\ncondition the code checks.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* feat(core): Keep __DC_ACTIONS__ small: summarize old actions, cap polling keys\n\nOnly the newest 20 actions keep args and response; older ones keep type,\nkey, endpoint, meta and error responses. While an endpoint polls, the log\nkeeps only its last maxPollingActions (default 4) actions.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Type the polling scan without narrowing the log\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Trim a key's older actions when it starts polling\n\nAlso say the polling cap is per key (endpoint and args), and rename the\nsubscriber count map.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* test(core): Polling cap holds across unsubscribe and resubscribe\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Track polling for skipped subscribes; keep a held registry key on re-init\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Forget polling keys on cleanup\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* fix(core): Fresh action log for a reused manager; treat pollFrequency 0 as polling\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* docs(skills): Lead devtools debugging with a symptom table, drop unused sections\n\nSkill evals (with and without the skill on three bugs) showed agents never\nused the polling pattern, checklist or network-correlation sections, and\nasked for a symptom-to-first-check hint.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* docs(skills): Cover reverting changes, stored-only errors and invalidation loops in devtools debugging\n\nHarder evals (refetch loop, wrapped mutation response, stale list cache) on\nSonnet and Haiku showed: normalization errors live only in meta, so the\nerrors snippet missed them; agents sliced the trimmed log by index; and one\nrun never opened the reference.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* refactor(core): Keep the DevToolsManager action log out of production builds\n\nMove trackPolling and logAction into the development-only prototype block and\ncreate their state in a development-only constructor branch, so production\nbundles drop them (DevToolsManager's minified gzip size goes from +381 B over\nmaster to +35 B). Share one polling test setup.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* chore: Regenerate website editor types\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* refactor(core): Keep DevToolsManager log helpers private to the middleware\n\ntrackPolling and logAction are only called from the middleware, so they\nbecome local functions there instead of protected prototype members,\ndropping them from the published types. Comments in init() now sit by\nthe statements they explain.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n* docs(skills): Tighten the devtools-debugging Where to Start table\n\nSplit the request-rate row so a request that never fires points at\nmeta.expiresAt and a missing rdc/subscribe, point meta errors at the\nsnippet that reads them, and cover a created item missing from a list.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U7fXTuhewgyp2SGAqY6LgJ\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-17T19:26:30Z",
          "tree_id": "327487de7a0f13e3fc96fccdbdbcf7fc02206e93",
          "url": "https://github.com/reactive/data-client/commit/a32740d14de86b7006ccc497484dd52c0bc54c23"
        },
        "date": 1792265533861,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 149.25,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 41.76,
            "range": "± 12.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 392.31,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 54.95,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 317.54,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 8.08,
            "range": "± 10.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 91.33,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 38.99,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 256.41,
            "range": "± 3.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 317.54,
            "range": "± 10.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 192.31,
            "range": "± 9.4%",
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
          "distinct": false,
          "id": "ecac998f03dcf5480bf5a90e7dcef6ba0886e7e5",
          "message": "pkg: Update build packages (#4406)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-18T13:16:58Z",
          "tree_id": "0dd428860f18ac902f904fd2bea6b98be6d3afab",
          "url": "https://github.com/reactive/data-client/commit/ecac998f03dcf5480bf5a90e7dcef6ba0886e7e5"
        },
        "date": 1792329684984,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 163.98,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 52.08,
            "range": "± 4.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 370.37,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 434.78,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 53.91,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 384.62,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 384.62,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 10.62,
            "range": "± 9.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 92.59,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 42.02,
            "range": "± 5.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 238.1,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 312.5,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 190.49,
            "range": "± 7.6%",
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
          "id": "dc61f24185a12d1e13323d397a0514ec925bdb3c",
          "message": "docs: Note Vue's mounted useSuspense keeps data after invalidate (#4411)\n\n* docs: Note Vue's mounted useSuspense keeps data after invalidate\n\nVue can't re-suspend a mounted component, so useSuspense keeps returning\nits current data while an invalidated endpoint refetches. Add that\ncarve-out to the invalidate/invalidateAll JSDoc, the useSuspense\nbehavior table, and Controller's ExpiryStatus.Invalid notes.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Tj5PXbDEpJbnwML9CXTHFb\n\n* chore: Regenerate website editor types\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Tj5PXbDEpJbnwML9CXTHFb\n\n* docs: Tighten Vue invalidate carve-outs\n\nFold the Vue caveat into the invalidate JSDoc's first sentence and point\nthe footnotes at expiry-policy instead of restating the reason.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Tj5PXbDEpJbnwML9CXTHFb\n\n* docs: Show how to re-suspend a Vue component after invalidate\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Tj5PXbDEpJbnwML9CXTHFb\n\n* docs: Name the Vue remount key for its purpose\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Tj5PXbDEpJbnwML9CXTHFb\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-19T16:43:31Z",
          "tree_id": "46ba51e4983ed13c9f32c68e736ee4c6f9b083a2",
          "url": "https://github.com/reactive/data-client/commit/dc61f24185a12d1e13323d397a0514ec925bdb3c"
        },
        "date": 1792428450690,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 194.19,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 76.92,
            "range": "± 4.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 555.56,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 666.67,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 74.36,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 513.16,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 555.56,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 20.86,
            "range": "± 10.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 111.12,
            "range": "± 17.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 59.53,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 339.08,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 540.94,
            "range": "± 12.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 270.27,
            "range": "± 6.1%",
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
          "distinct": false,
          "id": "c3b8c54bc3062cf082e67c215310cb98b3a03078",
          "message": "fix(core): Resolve mock fixture types without @data-client/endpoint (#4420)\n\n* fix(core): Resolve mock fixture types without @data-client/endpoint\n\ncore/mock fixture types imported EndpointInterface and ResolveType from\n@data-client/endpoint, which core doesn't depend on; import them from\ncore itself. Also raise @data-client/test's @data-client/react peer floor\nto ^0.15.3, the first release whose /mock subpath loads under CommonJS.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01DWrXQsPLEpjGyPxXxv8Yhc\n\n* fix(core): Import mock fixture types from normalizr, like the rest of core\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01DWrXQsPLEpjGyPxXxv8Yhc\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-19T17:49:54Z",
          "tree_id": "e4558db663a1ebc41a0f5b50015e7ba49db54c89",
          "url": "https://github.com/reactive/data-client/commit/c3b8c54bc3062cf082e67c215310cb98b3a03078"
        },
        "date": 1792432531070,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 224.75,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 76.64,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 400,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 555.56,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 79.05,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 416.67,
            "range": "± 8.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 444.66,
            "range": "± 12.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 23.5,
            "range": "± 11.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 112.36,
            "range": "± 8.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 58.65,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 333.33,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 243.9,
            "range": "± 6.7%",
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
          "id": "ebf3c6893ed49efd7e1f90b3b7997f8a923ed4b6",
          "message": "fix(core): Keep extended endpoint schema when polling (#4437)\n\n* fix(core): Keep extended endpoint members when polling\n\nPollingSubscription built its poll endpoint with Object.assign, which\nonly copies own properties. Endpoints made with .extend() keep schema\nand methods on the prototype, so polls stored responses un-normalized.\nInherit from the endpoint instead.\n\nFixes REACT-4\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01XXCKK3t5oPaCQYGuW5FkBY\n\n* docs(blog): Note polling extended endpoint fix\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01XXCKK3t5oPaCQYGuW5FkBY\n\n* test: Cover polled useLive list of an extended endpoint\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01XXCKK3t5oPaCQYGuW5FkBY\n\n* refactor: Inherit poll endpoint name instead of copying it\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01XXCKK3t5oPaCQYGuW5FkBY\n\n* chore: Clarify poll endpoint name inheritance\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01XXCKK3t5oPaCQYGuW5FkBY\n\n* test: Always clean up the poll subscription\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01XXCKK3t5oPaCQYGuW5FkBY\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-20T23:17:45Z",
          "tree_id": "c90aa5ac2f6774cb7b0d385e6be2fea27d65ae4a",
          "url": "https://github.com/reactive/data-client/commit/ebf3c6893ed49efd7e1f90b3b7997f8a923ed4b6"
        },
        "date": 1792538619640,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 175.44,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 62.11,
            "range": "± 2.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 400,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 476.19,
            "range": "± 9.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 61.92,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 392.31,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 425.72,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 16.26,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 98.05,
            "range": "± 10.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 51.68,
            "range": "± 4.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 266.71,
            "range": "± 5.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 400,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 222.22,
            "range": "± 9.1%",
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
          "distinct": false,
          "id": "b091c5f21a14321393315193642242d8e97c1acd",
          "message": "enhance(core): Add globalThis.__DC__ to read a store's Controller and action log (#4435)\n\n* enhance(core): Add globalThis.__DC__ to read a store's Controller and action log in development\n\nSummarized actions keep args, so logged keys can be read back with getResponse.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* docs(core): Read only endpoint-backed actions in the __DC__ example\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* enhance(core): Keep only side-effect-free args in summarized actions\n\nMutation args hold request bodies, which the summaries exist to drop.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* docs(core): Find logged actions that kept their args\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* enhance(core): Document __DC__ as the one debug entry point\n\nAdds __DC__.stores and folds the action log changeset into one __DC__ changeset;\n__DC_ACTIONS__ is now undocumented storage.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* enhance(core)!: Keep the debug registry on __DC__ alone\n\n__DC__.registry replaces __DC_CONTROLLERS__ and __DC_ACTIONS__, so __DC__ is the\nonly debug global.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* fix(core): Keep deprecated __DC_CONTROLLERS__ synced with the debug registry\n\nThe registry values are { controller, actions }, so the shipped Map cannot be\nthat same instance. It is a live view that returns each Controller and follows\nregistry updates, and its global type is marked @deprecated.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* docs: Note that __DC_CONTROLLERS__ is deprecated, not removed\n\nThe patch notes, DevToolsManager docs, and the coding-agents draft point at\n__DC__ and keep the old Map as a development alias. Removing it is tracked\nfor the next breaking release.\n\nCo-authored-by: Nathaniel Tucker <me@ntucker.me>\n\n* enhance(core)!: Drop the __DC_CONTROLLERS__ alias; __DC__ is the only debug global\n\nReverts c07b0301 and fc684fb3. Only debugging agents read these dev-only\nglobals and they learn __DC__ from the skills, so the changeset is a\nbreaking minor with a migration guide entry instead of keeping a shim.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* docs(core): Skip mutations in the __DC__ response recipe\n\nThe newest action under '/todos' can be a PATCH or POST, whose response\nisn't the list; match only endpoints without side effects.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n* internal: Simplify __DC__ store lookup\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01VvySSBgX1ZiMWZ31xzFRLa\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>",
          "timestamp": "2026-10-21T01:58:01Z",
          "tree_id": "adf582e1084ada87a3d747c2898db66f1c691113",
          "url": "https://github.com/reactive/data-client/commit/b091c5f21a14321393315193642242d8e97c1acd"
        },
        "date": 1792548218038,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 238.1,
            "range": "± 10.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 79.37,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 625,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 690.48,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 69.5,
            "range": "± 10.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 526.32,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 588.24,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 20,
            "range": "± 6.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 143.89,
            "range": "± 11.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 65.36,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 400,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 588.24,
            "range": "± 9.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 322.58,
            "range": "± 8.0%",
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
          "id": "3e45bac4bc06e9bfd3a38cc1b2118e5eee126a2e",
          "message": "fix(react): Only warn about DataProvider SSR when a fetch starts (#4449)\n\nDataProvider warned on every server render, even for pages that only\nload data after mount, such as Expo Router's static web output. Warn\nonce, from a dev-only middleware, the first time a fetch is dispatched\nduring SSR, since only that data is lost.\n\n\nClaude-Session: https://claude.ai/code/session_01WBaTij4gPJo7ymy384kK4E\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-23T17:18:57Z",
          "tree_id": "3c21b6023de50c13f7cc0bfc9324bd4e75af0442",
          "url": "https://github.com/reactive/data-client/commit/3e45bac4bc06e9bfd3a38cc1b2118e5eee126a2e"
        },
        "date": 1792776179939,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 148.16,
            "range": "± 7.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 49.39,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 298.57,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 350.99,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 53.2,
            "range": "± 5.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 294.12,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 303.31,
            "range": "± 6.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.86,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 74.07,
            "range": "± 11.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 39.14,
            "range": "± 4.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 227.27,
            "range": "± 3.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 370.37,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 165.3,
            "range": "± 6.1%",
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
          "id": "2c260a97b2d5b482de9de4b960d52b5c7f579777",
          "message": "fix(react): Don't warn \"Uncaught suspense\" for discarded SSR fallbacks (#4450)\n\nReact 19's streaming server renderer also renders the fallback of a\nboundary with over 500 bytes of content so it can outline it, then\nthrows it away. BackupLoading warned from useMemo during render, so\nSSR logged \"Uncaught suspense\" when nothing suspended. Warn from an\neffect instead, as the native version already does.\n\n\nClaude-Session: https://claude.ai/code/session_01WBaTij4gPJo7ymy384kK4E\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-23T18:25:48Z",
          "tree_id": "675b1dae1e3dbc3feadebedf002a80ca71da8bbc",
          "url": "https://github.com/reactive/data-client/commit/2c260a97b2d5b482de9de4b960d52b5c7f579777"
        },
        "date": 1792780326253,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 153.85,
            "range": "± 8.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 47.3,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 384.62,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 392.31,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.5,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 327.96,
            "range": "± 12.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 307.77,
            "range": "± 8.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.7,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 82.99,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 36.76,
            "range": "± 4.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 243.9,
            "range": "± 4.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 303.03,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 185.19,
            "range": "± 7.2%",
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
          "id": "8817f474d269b84cdc97c0fb40fdfd1bb4eb4dd7",
          "message": "pkg: Bump vulnerable packages from security audit (#4456)\n\nPatches body-parser, fast-uri, happy-dom, ip-address, launch-editor,\nserialize-javascript and undici in the yarn workspaces and the npm\nexample apps (github-app, todo-app).\n\n\nClaude-Session: https://claude.ai/code/session_01LPaw2xHUR1A23Jmfzu19sF\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-24T03:56:21Z",
          "tree_id": "1ad693937b728ebdfdb003525cf4a79dbffce364",
          "url": "https://github.com/reactive/data-client/commit/8817f474d269b84cdc97c0fb40fdfd1bb4eb4dd7"
        },
        "date": 1792814402152,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 222.22,
            "range": "± 8.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 73.27,
            "range": "± 6.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 666.67,
            "range": "± 6.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 625,
            "range": "± 6.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 64.78,
            "range": "± 9.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 444.66,
            "range": "± 10.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 555.56,
            "range": "± 7.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 20.64,
            "range": "± 8.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 125.79,
            "range": "± 11.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 60.61,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 384.62,
            "range": "± 0.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 555.56,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 307.77,
            "range": "± 6.0%",
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
          "id": "17458fb27503c6c93b2b8cc9bff72abe372bfbfa",
          "message": "fix(core): Type push/unshift with a list in ctrl.fetch() and ctrl.set() (#4421)\n\n* fix(core): Type ctrl.fetch() of push/unshift with a list body as a list\n\nCollection.push/unshift schemas are typed as the Collection adders they\nare at runtime, marking that a list body resolves a list. Controller.fetch\ngets two overloads for those endpoints (single and list body), which\nother endpoints skip by arity so their errors are unchanged.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* docs: Format changeset\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* docs(blog): Note list result type for push\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(endpoint): Export CollectionArrayAdder so inferred resource types can be emitted\n\nDeclaration emit of an inferred resource() type needs to name the push/unshift\nschema (TS2883 otherwise). Also share the Array Collection guard between push\nand unshift, and cover ctrl.set with unshift and a plain Collection's push.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(endpoint): Keep casts between Collection types comparable on TS < 6\n\nThe adder's _denormalizeNullable() typed as DenormalizeNullable<S['schema']>\nmade TypeScript 4.x-5.x reject casts like Collection<[T]> -> Collection<T[]>\n(github-app's Base.ts, esmodule-types CI). Inferring the schema keeps them\ncomparable with the same result type.\n\nAlso covers Values Collections having no push/unshift.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(endpoint): Type polymorphic Collection adders by the Collection's items\n\npush/unshift on a polymorphic Collection (schema.Array of an entity map)\ndenormalized to the map's shape; they now resolve the Collection's own item\ntype (e.g. Todo | Group), for one item or a list. Also keeps a non-adder's\nown result when ctrl.fetch() gets a union with an adder.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(endpoint): Keep adder's nullable result as before; share fetch result type\n\nRestores the adder's _denormalizeNullable() to DenormalizeNullable of the\nitem, which keeps nested fields nullable (as on master) and Collection casts\ncomparable on TS 4-5. Also covers polymorphic unshift and Denormalize, and\nnotes polymorphic results in the changeset.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(endpoint): Type a polymorphic adder's nullable result as one of its entities\n\nDenormalizeNullable of a polymorphic Collection's push/unshift gave the\nentity map's shape; it now gives one of its entities or undefined, like\nschema.Array. Single-entity adders keep DenormalizeNullable of the entity.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* feat(endpoint): Type ctrl.set() of Collection push/unshift with a list\n\nCollection.push and unshift take one row or a list of rows in ctrl.set(),\nread from the same _denormalizeList schema marker ctrl.fetch() uses.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* chore: Release normalizr with the ctrl.set list typing\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* test(rest): Type-test ctrl.set() of Collection unshift with a list\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(core): Reject updater functions in ctrl.set() of Collection push/unshift\n\nAn adder has no previous value, so setReducer returned early and the\nupdater never ran. Also keeps ControllerFetch out of the package exports.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(core): Keep a schema-less endpoint's result when fetched in a union with an adder\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* fix(endpoint): Don't throw when Collection.push/unshift writes without args\n\nThe default collection filter read args[0][key], so ctrl.set(collection.push, row)\nthrew once a filtered list was in the store, and the write was dropped.\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* docs(changeset): Scope the argless push fix to the default filter\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* refactor: Simplify adder args typing and its tests\n\nSplit list/single args only for adder endpoints, drop unshift type\ntests that repeat push's, and build the argless push test's state\nwith normalize().\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* docs(blog): Add before/after for pushing a list of items\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* refactor: Name AdderArgs's list-body flag\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* chore: Regenerate playground editor types\n\nCo-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n* docs(core): Note why fetch's list signatures are a TypeScript workaround\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_012mADYcnnaj6N19k7H6nHte\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-27T02:31:13Z",
          "tree_id": "819f80e7a5b6c948a4f4f4106dcea04365efa221",
          "url": "https://github.com/reactive/data-client/commit/17458fb27503c6c93b2b8cc9bff72abe372bfbfa"
        },
        "date": 1793068611822,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 250,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 81.63,
            "range": "± 7.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 555.56,
            "range": "± 11.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 690.48,
            "range": "± 12.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 71.69,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 526.32,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 500,
            "range": "± 13.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 22.08,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 109.89,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 68.03,
            "range": "± 5.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 400,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 555.56,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 259.78,
            "range": "± 7.9%",
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
          "id": "fff1ec59b048671d364e2964960b83d103972893",
          "message": "pkg: Update build packages (#4500)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-27T17:39:06Z",
          "tree_id": "d2100fa0385d2f6289df9068f4d7392673c9d1c0",
          "url": "https://github.com/reactive/data-client/commit/fff1ec59b048671d364e2964960b83d103972893"
        },
        "date": 1793123141037,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 175.44,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 59.35,
            "range": "± 5.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 357.14,
            "range": "± 7.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 370.37,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 50.27,
            "range": "± 11.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 322.58,
            "range": "± 5.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 322.58,
            "range": "± 6.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 13.07,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 90.09,
            "range": "± 11.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 47.62,
            "range": "± 5.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 256.41,
            "range": "± 3.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 363.76,
            "range": "± 8.8%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 208.33,
            "range": "± 6.7%",
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
          "distinct": false,
          "id": "cbf0b2d1488594d0f31557557f4f7837ecc825de",
          "message": "pkg: Update all non-major dependencies (#4504)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-10-27T19:55:05Z",
          "tree_id": "2ea07d269a1720e0038ac011e010bba4c75bbbe6",
          "url": "https://github.com/reactive/data-client/commit/cbf0b2d1488594d0f31557557f4f7837ecc825de"
        },
        "date": 1793131307704,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 156.29,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 50,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 327.96,
            "range": "± 7.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 281.75,
            "range": "± 9.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 52.49,
            "range": "± 7.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 281.75,
            "range": "± 6.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 298.57,
            "range": "± 6.6%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.25,
            "range": "± 11.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 72.46,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 41.07,
            "range": "± 5.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 5.5%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 317.54,
            "range": "± 9.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 172.41,
            "range": "± 7.2%",
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
          "id": "7b5e2bb5ef9e79df6c5c2c586ff5cee242c8481e",
          "message": "docs: Show useCancelling as an inbox you skim on a slow connection (#4516)\n\n* docs: Show useCancelling as an inbox you skim on a slow connection\n\nThe abort guide and the useCancelling() page showed a todo pager with\n« » buttons. Its only cue was the Store, and clicking fast could leave\nit loading forever.\n\nThe demo is now an inbox. The autorun clicks down five messages. Each\nmessage is a 150 KB download over a 100 KB/s link that open downloads\nshare. Without cancelling (new first demo on the abort guide), the one\nit stops on opens about 5 s after the last click. With useCancelling(),\nit opens in about 1.5 s. The Store lists each skipped download as\ncancelled.\n\n- useCancelling(): a suspended render's retry rebuilt its memo and\n  aborted the request it was waiting on, so with slow requests the\n  component could stay suspended forever. The controller is now kept per\n  params key in a ref. Regression test included.\n- Fixtures: a fetch's AbortSignal rejects the fixture delay with an\n  AbortError. fetchResponse() interceptors can be async and read\n  init.signal.\n- Store inspector: aborted responses read \"cancelled\" instead of a red\n  error.\n- Design system: `.split` (list beside what it opens when there's room)\n  and button rows with an `aria-current` wash.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Y5C5Z9gQVAeRRVdEHvTjRW\n\n* docs: One useCancelling demo per page, without autoplay; simplify cleanups\n\nDrops the abort guide's duplicate \"without\" demo and the autorun.\nCleanups: fixture-abort tests reuse ArticleResource and createFetch;\nslowLink removes its abort listener once a download finishes; the\nbutton-row hover and focus ring join the existing rules; Fixtures.md\nkeeps its original wrapping.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Y5C5Z9gQVAeRRVdEHvTjRW\n\n* docs: Count fetches in flight in the useCancelling demo; open message on a tinted pane\n\nPlaygrounds take `inFlight`: a header badge counting requests in\nflight, one per endpoint key from its fetch until its response or abort.\nSkimming the inbox keeps it at 1 with useCancelling(); without it, every\nskipped message piles on. The open message sits on a tinted pane, apart\nfrom the list.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Y5C5Z9gQVAeRRVdEHvTjRW\n\n* docs: Regenerate skill references for async fetchResponse\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Y5C5Z9gQVAeRRVdEHvTjRW\n\n---------\n\nCo-authored-by: Claude <noreply@anthropic.com>",
          "timestamp": "2026-10-28T23:33:52Z",
          "tree_id": "5792a6a78af1736b2cb903e6c52b04ce387dacf8",
          "url": "https://github.com/reactive/data-client/commit/7b5e2bb5ef9e79df6c5c2c586ff5cee242c8481e"
        },
        "date": 1793230848052,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 150.38,
            "range": "± 9.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500",
            "value": 46.73,
            "range": "± 6.7%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity",
            "value": 307.77,
            "range": "± 7.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user",
            "value": 322.58,
            "range": "± 6.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 49.54,
            "range": "± 8.3%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 277.99,
            "range": "± 7.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 281.75,
            "range": "± 8.9%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: list-detail-switch-10",
            "value": 9.02,
            "range": "± 9.2%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 78.12,
            "range": "± 9.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 34.72,
            "range": "± 4.0%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: unshift-item",
            "value": 217.39,
            "range": "± 4.1%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: delete-item",
            "value": 274.02,
            "range": "± 9.4%",
            "unit": "ops/s"
          },
          {
            "name": "data-client: move-item",
            "value": 181.82,
            "range": "± 6.8%",
            "unit": "ops/s"
          }
        ]
      }
    ]
  }
}