window.BENCHMARK_DATA = {
  "lastUpdate": 1775826981491,
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
      }
    ]
  }
}