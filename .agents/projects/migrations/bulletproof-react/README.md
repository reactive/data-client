# bulletproof-react → data-client migration

Target: `alan2207/bulletproof-react` @ `9506629ed003a561c6627735480cce4994244bb4`, `apps/react-vite`
(react-query + axios + react-query-auth, MSW mock API, vitest + playwright).
Migrated with the `data-client-setup` skill, `@data-client/react|rest|test` 0.18.2, Sonnet 5.5 (medium, no advisor).
Result: [`migration.patch`](./migration.patch) (`git apply` at the repo root of bulletproof-react on the commit above; it includes the new `stale-list.spec.ts`). Problems found: [`problems.md`](./problems.md).

## Validation (same tests before and after)

| Check | Baseline | Migrated |
| --- | --- | --- |
| `tsc --noEmit` | pass | pass |
| vitest | 21/21 | 22/22 (+1 load-more-comments test) |
| playwright (setup, profile, smoke) | 3/3 | 3/3 (9/9 over 3 repeat runs; 1 cold-start failure on the first run) |
| playwright `stale-list` (new) | **fail** | pass |
| playwright `optimistic` (new): discussion update, comment create and delete show within 250ms; mock API answers in >=300ms | **fail** | pass (3/3) |

`stale-list.spec.ts`: create a discussion, update its title on the discussion page, navigate back to the list.
Baseline shows the old title (`['discussions', id]` is refetched, the list's `['discussions', {page}]` is not, staleTime 60s).
Migrated shows the new title because `Discussion` is one normalized Entity shared by list and detail.

## Impact (master / PR style table; unit in column header)

| Metric | Baseline | Migrated | Change |
| --- | --- | --- | --- |
| Main JS chunk, gzip (kB) | 182.37 | 165.83 | -16.5 (-9%) |
| Main JS chunk, raw (kB) | 566.39 | 521.10 | -45.3 (-8%) |
| App source LoC (non-test, non-mock) | 5010 | 4550 | -460 (-9%) |
| Data-access layer LoC (`features/*/api`, `lib/api-client`, `lib/auth`, react-query helpers, `hooks/use-mutate`) | 626 | 338 | -288 (-46%) |
| Files importing react-query | 20 | 0 | -20 |
| API requests in a 7-step navigation flow (register, list, create, view, back, view, back, dashboard, list) | 6 | 5 | -1 |
| Requests to open a discussion from the list | 2 (detail + comments) | 1 (comments; detail renders from the list's normalized Entity) | -1 |
| Landing page script time, 4x CPU throttle, median of 5 (ms) | 495-589 | 575 | within noise |
| Landing page load, 4x CPU throttle, median of 5 (ms) | 2057-2163 | 2150 | within noise |
| JS heap after landing (MB) | 8.1 | 7.7 | -0.4 |

Notes: the script/load rows are noise-dominated (baseline varied by 20% between two runs); the bundle includes the MSW mock
DB chunk (209 kB gzip, same in both) because mocking is enabled in the build. Tokens-per-feature and cache hit/miss counters
were not measured in this run. Reproduce: from the app folder, `node measure.cjs <label> <preview-url> <runs>` (resolves Playwright from the current folder; set `CHROMIUM_PATH` to use a specific browser).
The data-access LoC includes the Entity definitions (data-definition, cheap to maintain).
The migration kept `yarn.lock` untouched (installed with npm, see problem P10); regenerate it before merging anywhere.

## Optimistic updates (added after the first measurement)

Comment create and delete, discussion update and profile update are optimistic (`getOptimisticResponse`); the other mutations are not. Main chunk is 165.87 kB gzip with them (165.83 before). Tests: vitest 22/22, playwright 5/5. See problem P11.
