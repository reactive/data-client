window.BENCHMARK_DATA = {
  "lastUpdate": 1774011570592,
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
      }
    ]
  }
}