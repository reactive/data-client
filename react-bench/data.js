window.BENCHMARK_DATA = {
  "lastUpdate": 1773924692853,
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
      }
    ]
  }
}