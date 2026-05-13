window.BENCHMARK_DATA = {
  "lastUpdate": 1778676139831,
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
      }
    ]
  }
}