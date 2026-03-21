window.BENCHMARK_DATA = {
  "lastUpdate": 1774122723426,
  "repoUrl": "https://github.com/reactive/data-client",
  "entries": {
    "Benchmark": [
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
          "id": "1f34136f1d0902ee5456089f2d2f9f35c9f4a758",
          "message": "demo: Add benchmark-react with normalization and ref-stability scenarios (#3783)\n\n* demo: Add benchmark-react with normalization and ref-stability scenarios\n\n- Browser benchmark comparing @data-client/react (Playwright, customSmallerIsBetter).\n- Scenarios: mount, update entity/author, ref-stability (item/author ref counts).\n- Hot-path (CI) vs with-network (local): simulated delay for overfetch comparison.\n- CI workflow runs hot-path only; reports to rhysd/github-action-benchmark.\n\nMade-with: Cursor\n\n* more of the plan\n\n* More scenarios\n\n* more scenarios\n\n* add react compiler option\n\n* bugbot: dead code\n\n* No throttling\n\n* yarn lock\n\n* bugbot + fix test data client correctness\n\n* fair comparisons\n\n* ts 6\n\n* bugbot\n\n* update website types\n\n* improve ci\n\n* internal: Bench runs concurrently\n\n* better abstractions\n\n* CRUD\n\n* virtualize\n\n* create adds to list; larger high end case\n\n* No seeding\n\nfix yarn lock\n\n* fix test conditions to be more accurate\n\n* dynamic accuracy\n\n* fix bench measurements\n\n* remove unneeded bench\n\n* fix measurement by eliminating paint timings from measurement\n\n* increase scale, remove redundant\n\n* bench name updates\n\n* more realistic data\n\n* MutationObserver timeout silently fails without signaling completion\n\n* Make sorted mount consistent\n\n* fix sorted-view-update-entity for some frameworks\n\n* change reporting\n\n* move scenario\n\n* Init scenarios capture wrong react-commit-update measurement\n\n* Upgrade benchmark baseline from dual list to triple list\n\nMade-with: Cursor\n\n* bugbot\n\n* server sim\n\n* Make author component more expensive\n\n* network sim flag; new scenario\n\n* bugbot\n\n* DRY\n\n* Potential fix for code scanning alert no. 83: DOM text reinterpreted as HTML\n\nCo-authored-by: Copilot Autofix powered by AI <62310815+github-advanced-security[bot]@users.noreply.github.com>\n\n* delete dead code\n\n* movewith docs\n\n* review\n\n* switch to github data\n\n---------\n\nCo-authored-by: Copilot Autofix powered by AI <62310815+github-advanced-security[bot]@users.noreply.github.com>",
          "timestamp": "2026-03-19T08:48:59-04:00",
          "tree_id": "13274576377a66200ab60031f43920d2d98df5f8",
          "url": "https://github.com/reactive/data-client/commit/1f34136f1d0902ee5456089f2d2f9f35c9f4a758"
        },
        "date": 1773924689720,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 21.4,
            "range": "± 1.41",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 33.9,
            "range": "± 2.65",
            "unit": "ms"
          },
          {
            "name": "data-client: update-single-entity",
            "value": 6.3,
            "range": "± 0.81",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-shared-user-500-mounted",
            "value": 6.2,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-mount-500",
            "value": 25.9,
            "range": "± 0.69",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-update-entity",
            "value": 5.6,
            "range": "± 0.29",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 85.9,
            "range": "± 3.72",
            "unit": "ms"
          },
          {
            "name": "data-client: update-shared-user-10000-mounted",
            "value": 27.5,
            "range": "± 0.29",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 11.8,
            "range": "± 0.63",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 6.8,
            "range": "± 0.46",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7,
            "range": "± 0.53",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.4,
            "range": "± 0.78",
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
          "id": "3d7a57789ef4c83a365c5081b82c3d099a9b8e2b",
          "message": "internal: Trim CI workspaces to only what each job needs (#3793)\n\n* internal: Trim CI workspaces to only what each job needs\n\nEach GitHub Actions workflow now sets exactly the workspaces it requires\ninstead of installing everything. This avoids pulling in heavy deps like\nplaywright, @tanstack/react-query, swr, and webpack in jobs that never\nuse them.\n\nCircleCI setup also updated to exclude the website workspace.\n\nMade-with: Cursor\n\n* fix: Add YARN_ENABLE_IMMUTABLE_INSTALLS=false for modified workspaces\n\nYarn 4 auto-enables immutable installs in GitHub Actions (and hardened\nmode on public PRs), so modifying workspaces before install requires\nexplicitly opting out.\n\nMade-with: Cursor\n\n* fix: Don't stage package.json and yarn.lock changes in github actions\n\n* fix: Extract ci-install.sh to prevent dirty tree in GitHub Actions\n\nThe workspace-trimming one-liner left package.json and yarn.lock dirty,\ncausing changesets to commit them and github-action-benchmark to fail on\ngit switch. Centralize trim-install-restore into a single script so the\ntree is always clean before downstream actions run.\n\nMade-with: Cursor",
          "timestamp": "2026-03-19T20:04:44-04:00",
          "tree_id": "15b5a1567766be4ed418481b56d07ceb338a39c6",
          "url": "https://github.com/reactive/data-client/commit/3d7a57789ef4c83a365c5081b82c3d099a9b8e2b"
        },
        "date": 1773965220010,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 22,
            "range": "± 1.44",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 35.4,
            "range": "± 0.29",
            "unit": "ms"
          },
          {
            "name": "data-client: update-single-entity",
            "value": 5.5,
            "range": "± 0.79",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-shared-user-500-mounted",
            "value": 6.6,
            "range": "± 0.78",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-mount-500",
            "value": 27,
            "range": "± 0.88",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-update-entity",
            "value": 6,
            "range": "± 0.59",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 92.1,
            "range": "± 7.74",
            "unit": "ms"
          },
          {
            "name": "data-client: update-shared-user-10000-mounted",
            "value": 27.3,
            "range": "± 3.14",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12.4,
            "range": "± 0.58",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7.2,
            "range": "± 0.2",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.8,
            "range": "± 0.69",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.8,
            "range": "± 0.87",
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
          "id": "9e9fb70ce1760ce9a3390a4dcc6a942ffeb1ac3b",
          "message": "demo(benchmark-react): remove plain React baseline app (#3796)\n\n* demo(benchmark-react): remove plain React baseline app\n\nDrop the baseline webpack entry, scenarios, and implementation; keep\ncomparisons to TanStack Query and SWR only. Update README and\nbenchmarking cursor rule.\n\nMade-with: Cursor\n\n* update types",
          "timestamp": "2026-03-19T22:14:20-04:00",
          "tree_id": "9401601b688fa63198cd06173b6833c72fe80680",
          "url": "https://github.com/reactive/data-client/commit/9e9fb70ce1760ce9a3390a4dcc6a942ffeb1ac3b"
        },
        "date": 1773973000277,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "data-client: getlist-100",
            "value": 21.1,
            "range": "± 1.34",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 31.9,
            "range": "± 1.67",
            "unit": "ms"
          },
          {
            "name": "data-client: update-single-entity",
            "value": 6.1,
            "range": "± 0.77",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-shared-user-500-mounted",
            "value": 7.1,
            "range": "± 1.01",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-mount-500",
            "value": 25.9,
            "range": "± 0",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-update-entity",
            "value": 5.3,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 83.3,
            "range": "± 0.98",
            "unit": "ms"
          },
          {
            "name": "data-client: update-shared-user-10000-mounted",
            "value": 28.9,
            "range": "± 2.94",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12.6,
            "range": "± 0.13",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7.2,
            "range": "± 0.41",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.5,
            "range": "± 0.64",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.6,
            "range": "± 0.81",
            "unit": "ms"
          }
        ]
      }
    ],
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
          "message": "internal: Remove unused actions/cache from benchmark workflows (#3797)\n\nThe rhysd/github-action-benchmark action fetches data directly from\ngh-pages-bench branch — the actions/cache steps were never used.\nAlso set name: 'Benchmark React' so PR comments are distinguishable.\n\nMade-with: Cursor",
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
            "range": "± 0.79",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 35.8,
            "range": "± 6.65",
            "unit": "ms"
          },
          {
            "name": "data-client: update-single-entity",
            "value": 5.6,
            "range": "± 0.26",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-shared-user-500-mounted",
            "value": 6.6,
            "range": "± 0.00",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-mount-500",
            "value": 28.6,
            "range": "± 1.86",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-update-entity",
            "value": 6.2,
            "range": "± 0.98",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 89,
            "range": "± 0.20",
            "unit": "ms"
          },
          {
            "name": "data-client: update-shared-user-10000-mounted",
            "value": 30.6,
            "range": "± 4.80",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12.1,
            "range": "± 0.40",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7.5,
            "range": "± 0.11",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.7,
            "range": "± 0.11",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 6.5,
            "range": "± 0.81",
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
            "range": "± 1.67",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 33.7,
            "range": "± 1.37",
            "unit": "ms"
          },
          {
            "name": "data-client: update-single-entity",
            "value": 5.3,
            "range": "± 0.47",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-shared-user-500-mounted",
            "value": 7.4,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-mount-500",
            "value": 26,
            "range": "± 1.57",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-update-entity",
            "value": 5.5,
            "range": "± 0.1",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 83.7,
            "range": "± 0.49",
            "unit": "ms"
          },
          {
            "name": "data-client: update-shared-user-10000-mounted",
            "value": 26.4,
            "range": "± 0.78",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12,
            "range": "± 0.75",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 8,
            "range": "± 0.97",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.3,
            "range": "± 0.4",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.7,
            "range": "± 0.24",
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
            "range": "± 2.29",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 33.1,
            "range": "± 3.14",
            "unit": "ms"
          },
          {
            "name": "data-client: update-single-entity",
            "value": 5.9,
            "range": "± 0.69",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 5,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-shared-user-500-mounted",
            "value": 6.5,
            "range": "± 0.78",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-mount-500",
            "value": 26.3,
            "range": "± 0.98",
            "unit": "ms"
          },
          {
            "name": "data-client: sorted-view-update-entity",
            "value": 6.7,
            "range": "± 0.88",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 84.6,
            "range": "± 1.08",
            "unit": "ms"
          },
          {
            "name": "data-client: update-shared-user-10000-mounted",
            "value": 26.5,
            "range": "± 1.37",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 12,
            "range": "± 1.52",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7.4,
            "range": "± 0.52",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 7.1,
            "range": "± 0.24",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5,
            "range": "± 0.62",
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
            "range": "± 1.57",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 44.3,
            "range": "± 2.35",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 4.1,
            "range": "± 0.26",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 4.7,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 39.7,
            "range": "± 1.86",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 4.7,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 149.9,
            "range": "± 27.82",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 21.5,
            "range": "± 0.20",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 28.8,
            "range": "± 1.33",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 5.3,
            "range": "± 0.36",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 4.3,
            "range": "± 0.13",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 6,
            "range": "± 0",
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
            "range": "± 1.25",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 38.5,
            "range": "± 2.84",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 3.8,
            "range": "± 0.49",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 4.3,
            "range": "± 0.1",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 35.6,
            "range": "± 0.2",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 4.3,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 128.9,
            "range": "± 3.72",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 18.4,
            "range": "± 0",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 28.5,
            "range": "± 2.14",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 4.9,
            "range": "± 0.35",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 3.8,
            "range": "± 0.41",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 5.9,
            "range": "± 0.26",
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
          "message": "demo(benchmark-react): improve measurement stability (#3805)\n\nReduce benchmark variance and improve result reliability:\n\n- IQR outlier trimming in stats (single GC spikes no longer widen CI)\n- Force V8 GC via CDP between scenarios and after pre-mount\n- Shuffle scenario order within each library to eliminate ordering bias\n- Bump minMeasurement (small: 3→5, large: 2→3) for more reliable convergence\n- Increase large maxMeasurement in CI (4→6) for more convergence headroom\n\nMade-with: Cursor",
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
            "range": "± 0.65",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 40.9,
            "range": "± 0.79",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 4.3,
            "range": "± 0.27",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 6.4,
            "range": "± 0.3",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 42.7,
            "range": "± 4.74",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 5.6,
            "range": "± 0",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 144.3,
            "range": "± 22.87",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 32.5,
            "range": "± 2.84",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 31.6,
            "range": "± 0.71",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 6.4,
            "range": "± 0.32",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 5.3,
            "range": "± 0.39",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 9.7,
            "range": "± 0.61",
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
          "message": "demo(benchmark-react): add multi-view entity update scenario (#3806)\n\n* demo(benchmark-react): add multi-view entity update scenario\n\nAdd `update-entity-multi-view` benchmark where the same issue entity\nis displayed across three structurally different component trees (list\nrow, detail panel, pinned card strip). A single entity update must\npropagate to all three views, exercising normalized cache cross-query\npropagation vs. multi-query invalidation + refetch.\n\nMade-with: Cursor\n\n* demo(benchmark-react): fix post-mount GC inflating data-client times\n\nRemove forced HeapProfiler.collectGarbage after pre-mount. The full GC\npromoted all recently-allocated entities into V8's old generation,\ncausing write-barrier overhead during the timed action that\ndisproportionately penalized data-client's CPU-bound optimistic updates\n(~1.8x inflation) while leaving network-bound libraries unaffected.\n\nAlso re-measure all scenarios and reorganize the README summary table\ninto Navigation / Mutations / Scaling categories.\n\nMade-with: Cursor\n\n* demo(benchmark-react): fix initMultiView double-setComplete race\n\nmeasureMount's MutationObserver called setComplete() (setting\ndata-bench-complete) as soon as list items appeared, before the\ndetail panel and pinned card views were ready. The runner could\nsee this premature signal, proceed to the timed update phase, and\nthen receive a stale second setComplete() — corrupting the\nmeasurement.\n\nRefactor measureMount to return a Promise and accept\n{ signalComplete: false } so initMultiView can suppress the\nearly completion signal and call setComplete() once after all\nthree views are ready.\n\nMade-with: Cursor",
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
            "range": "± 0.2",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500",
            "value": 42.6,
            "range": "± 2.66",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity",
            "value": 5.1,
            "range": "± 0.51",
            "unit": "ms"
          },
          {
            "name": "data-client: ref-stability-issue-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: ref-stability-user-changed",
            "value": 50,
            "range": "± 0",
            "unit": "count"
          },
          {
            "name": "data-client: update-user",
            "value": 6.2,
            "range": "± 0.71",
            "unit": "ms"
          },
          {
            "name": "data-client: getlist-500-sorted",
            "value": 43.9,
            "range": "± 5.27",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-sorted",
            "value": 6.6,
            "range": "± 1.05",
            "unit": "ms"
          },
          {
            "name": "data-client: update-entity-multi-view",
            "value": 4.4,
            "range": "± 0.69",
            "unit": "ms"
          },
          {
            "name": "data-client: list-detail-switch",
            "value": 143.8,
            "range": "± 22.22",
            "unit": "ms"
          },
          {
            "name": "data-client: update-user-10000",
            "value": 47.4,
            "range": "± 2.21",
            "unit": "ms"
          },
          {
            "name": "data-client: invalidate-and-resolve",
            "value": 31.1,
            "range": "± 0.6",
            "unit": "ms"
          },
          {
            "name": "data-client: unshift-item",
            "value": 7,
            "range": "± 0.9",
            "unit": "ms"
          },
          {
            "name": "data-client: delete-item",
            "value": 6.2,
            "range": "± 0.47",
            "unit": "ms"
          },
          {
            "name": "data-client: move-item",
            "value": 6.5,
            "range": "± 0.09",
            "unit": "ms"
          }
        ]
      }
    ]
  }
}