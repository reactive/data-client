# bulletproof-react on data-client 0.19.0-beta-20261108175612 (3ae266b): re-run

Repo alan2207/bulletproof-react @ 9506629 (apps/react-vite). Packages from npm `@beta`, skills from `npx --no data-client-skills`, codemod via `npx @data-client/codemods axios-to-rest src/`. Sonnet 5.5 medium, guide-driven (setup skill -> TanStack guide). `migration.patch` = diff of the migration (lockfile excluded). Results in `results/`.

Validation: tsc clean; eslint 0 errors (0 import/no-restricted-paths); vitest 21/21 with default vitest config; playwright 5/5 (baseline 3/5: stale-list and optimistic fail).

## Old problems on 0.19
| P | Status | Note |
|---|---|---|
| P1 TanStack guide | solved | followed the guide, no hints needed |
| P2 codemod host | solved | npx resolves; `latest` is the 0.0.0 placeholder (same code as beta now). Real versions only under `beta` |
| P3 Suspense inside provider | solved | DataProvider at root first try |
| P4 vitest inline | gone | no server.deps.inline needed |
| P5 empty nested entity | solved | Entity.md process() recipe found and used |
| P6 conditional zero-arg | solved | `useDLE(TeamResource.getList, cond ? {} : null)` type checks |
| P7 envelope + getPage/push | solved by guide | worked from the guide's Infinite queries section |
| P8 skill/version mismatch | gone | |
| P9 codemod formatting/interceptors | solved | interceptors commented out with TODO; prettier step in skill |
| P10 env | persists | npm --legacy-peer-deps; test helper fixed per guide's Tests section |
| P11 optimistic w/o pk | solved | profile optimistic reads user from snapshot; measured 127ms |
| P12 import boundaries | solved | entities in src/lib/resources first try, 0 lint errors |

## New problems
### N1 (S, high): `super.getRequestInit(body)` spread without await turns every mutation into a GET
- Step: rest-setup "Override only what the app does today" table: "Cookies, CSRF, other RequestInit: getRequestInit(body), spreading super.getRequestInit(body)". Porting axios `withCredentials = true`.
- Tried: `getRequestInit(body) { return { ...super.getRequestInit(body), credentials: 'include' } }`.
- Occurred: getRequestInit is async; spreading a Promise yields no method/body/headers. Every PATCH/POST went out as a GET; tsc and eslint pass. Showed up only as vitest "Error processing PATCH ... Missing usable primary key" (GET envelope processed by the PATCH endpoint).
- Expected: skill says `async` + `await super.getRequestInit(body)`, or for static options `requestInit = { credentials: 'include' }`; axios guide maps `withCredentials` -> `credentials: 'include'`; ideally a dev warning when init has no method.
- Repro: ApiEndpoint with the override above; `fetch` a PATCH endpoint; observe method GET.
- Pass: skill text uses await or requestInit and mentions withCredentials; (library) dev-mode warning when getRequestInit result lacks `method`.
### N2 (S, low): data-client-skills links the two upgrade skills (v0.18 migration, path-to-regexp-v8) into fresh apps
They are irrelevant to a new install and add skill-list noise. Pass: not linked unless the app depends on the old version.
### N3 (S, low): monorepo
Skills are linked into the app folder (apps/react-vite), not the repo root; Claude Code started at the root will not load them. Pass: setup skill says where to run it for monorepos.
### N4 (L, medium, perf): optimistic updates raise slowest interaction 56 -> 92ms and TBT 1 -> 22ms (4x CPU)
Optimistic dispatch renders synchronously in the click (seen on 0.18 too). Open question: default optimistic fetch to transition priority.

## Not done
Feature-cost (tokens per feature) and the P12 partial-migration eval were not re-run (they spend model tokens; see results note).
