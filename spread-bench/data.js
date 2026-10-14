window.BENCHMARK_DATA = {
  "lastUpdate": 1791946146048,
  "repoUrl": "https://github.com/reactive/data-client",
  "entries": {
    "Benchmark Spread": [
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
          "id": "f3b96b0784ba3cf5188c3d21a1eec4e1a04a0927",
          "message": "bench: Add degenerate-case spread benchmarks and memory pressure measurement (#4014)\n\n* bench: Add degenerate-case spread benchmarks and memory pressure script\n\nSpread operations in the core write path scale with store size rather\nthan payload size (per-type entity map clone in NormalizeDelegate,\nendpoints/meta spreads in setResponseReducer, Collection pushMerge).\n\nAdds a 'spread' Benchmark.js suite measuring the degenerate cases\n(single-entity setResponse into 1k/10k/100k stores plus a flat control,\n10k cached endpoints, collection push, invalidateAll/expireAll) and a\nstart:memory script reporting allocation/op, GC churn, and retained\nheap. Scenario fixtures build lazily per filter.\n\nOne fast stable case (setOneEntity in 10k entity store) is tracked over\ntime via a new benchmark-spread.yml workflow that triggers only on\nstore-write code paths and reports to a separate spread-bench history\ndir; everything else is manual-only.\n\n* bench: Simplify spread benchmark harness\n\n- Un-export schemas.js fixtures only used internally (FlatItem,\n  ControlItem, list endpoints, collection, buildControlItemData)\n- buildManyEndpointsState no longer builds an n-entity store the\n  endpoint-spread scenarios never depended on (faster cold start)\n- Table-drive the setOneEntity 1k/10k/100k sweep scenarios\n- Drop redundant second filter pass in spread.js (buildScenarios\n  already filters); name the collection push id offset\n- memory.js samples heap every 10 ops so the sampler's own\n  allocations stay out of allocated/op and GC counts\n\n* bench: Clarify spread benchmark fixtures and metrics",
          "timestamp": "2026-07-11T17:43:43-04:00",
          "tree_id": "bf919d7ff0e850a80cfdabe5ceb0bd4bd19ad9ce",
          "url": "https://github.com/reactive/data-client/commit/f3b96b0784ba3cf5188c3d21a1eec4e1a04a0927"
        },
        "date": 1783806275054,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 133,
            "range": "±0.92%",
            "unit": "ops/sec",
            "extra": "84 samples"
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
        "date": 1783870308145,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 153,
            "range": "±0.97%",
            "unit": "ops/sec",
            "extra": "86 samples"
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
        "date": 1791127305654,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 155,
            "range": "±0.95%",
            "unit": "ops/sec",
            "extra": "87 samples"
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
        "date": 1791246035107,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 154,
            "range": "±0.99%",
            "unit": "ops/sec",
            "extra": "87 samples"
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
        "date": 1791246100976,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 264,
            "range": "±1.76%",
            "unit": "ops/sec",
            "extra": "91 samples"
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
        "date": 1791300390512,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 154,
            "range": "±0.67%",
            "unit": "ops/sec",
            "extra": "86 samples"
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
        "date": 1791414530634,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 151,
            "range": "±0.94%",
            "unit": "ops/sec",
            "extra": "85 samples"
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
        "date": 1791429628075,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 150,
            "range": "±1.18%",
            "unit": "ops/sec",
            "extra": "84 samples"
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
        "date": 1791602750102,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 154,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "87 samples"
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
        "date": 1791842362677,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 153,
            "range": "±0.74%",
            "unit": "ops/sec",
            "extra": "86 samples"
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
        "date": 1791930651169,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 151,
            "range": "±1.00%",
            "unit": "ops/sec",
            "extra": "85 samples"
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
        "date": 1791935825182,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 152,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "85 samples"
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
        "date": 1791942504722,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 250,
            "range": "±1.38%",
            "unit": "ops/sec",
            "extra": "86 samples"
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
        "date": 1791942659989,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 150,
            "range": "±0.96%",
            "unit": "ops/sec",
            "extra": "85 samples"
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
        "date": 1791943229731,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 152,
            "range": "±1.36%",
            "unit": "ops/sec",
            "extra": "86 samples"
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
        "date": 1791945586272,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 154,
            "range": "±0.79%",
            "unit": "ops/sec",
            "extra": "87 samples"
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
        "date": 1791946143153,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "setOneEntity in 10k entity store",
            "value": 151,
            "range": "±0.99%",
            "unit": "ops/sec",
            "extra": "85 samples"
          }
        ]
      }
    ]
  }
}