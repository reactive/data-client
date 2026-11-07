# Problems found migrating bulletproof-react

**Version note:** found on 0.18.2. P2, P4 and P8 exist only on 0.18 (P4 is fixed on master by #4613; on 0.19 `npx --no data-client-skills` links the skills from the packages, which removes P8, and P2's codemod handling is re-checked on 0.19). P5 now uses a documented `process()` recipe instead of a library change (#4611 was dropped). Re-evaluate the rest on the 0.19 beta.

Context for every record: repo `alan2207/bulletproof-react` @ `9506629` (`apps/react-vite`), packages `@data-client/*` 0.18.2,
skills from `reactive/data-client` master @ `433dcfb`, agent Sonnet 5.5 medium. Each record is an eval: run **Repro**,
the problem is solved when the **Pass** criterion holds without the workaround.

Type: S = skill gap, L = library, D = docs, E = environment (not a data-client fix, noted so the next migration is faster).

## P1 (S, high): no migration path from TanStack Query to data-client hooks

- Fix: #4608.

- Step: setup skill, REST setup, "Migrate each HTTP library". Axios guide says "Components still call them directly, so how the app loads and stores data doesn't change".
- Tried: followed the axios guide, then needed to replace 20 files of `useQuery`, `useMutation`, `queryOptions`, `invalidateQueries`, `refetchQueries`, `prefetchQuery`, `useInfiniteQuery`, `QueryClient` in react-router loaders, and `react-query-auth`.
- Occurred: no skill section covers it; the model reconstructed the mapping from the schema, rest and react skills (worked, but cost the most time of any step).
- Expected: a guide (like axios-migration) mapping react-query concepts to `useSuspense`, `useController().fetch`, `useLoading`, `fetchIfStale` (loaders and prefetch), `expireAll`, Collection `push` and `getPage`, `resetEntireStore` (logout), `null` args (enabled:false), plus auth libraries.
- Repro: apply the baseline commit, run the setup skill with the prompt "migrate to data-client".
- Pass: with no extra hints, an agent reaches `tsc`, vitest, playwright (incl. `e2e/tests/stale-list.spec.ts` from this PR) all green with zero `@tanstack` imports, and its mapping follows a documented guide.

## P2 (S/E) [0.18 only]: axios codemod URL unreachable offline or behind an egress proxy

- Fix: #4609.

- Step: axios migration step 2, `npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js`.
- Occurred: `getaddrinfo ENOTFOUND dataclient.io` (jscodeshift's fetch ignores `HTTPS_PROXY`; the proxy also returns 403 for dataclient.io).
- Expected: codemod available without that host, e.g. shipped in an npm package or linked skill folder.
- Workaround used: ran `website/static/codemods/axios-to-rest.js` from a data-client checkout.
- Repro: sandbox with proxy-only egress, run the skill's step 2 command.
- Pass: the codemod runs from `npx` or from files shipped with the linked skills, with no request to dataclient.io.

## P3 (S, high): Suspense boundary must live inside `DataProvider`

- Fix: #4609.

- Step: provider setup. App had `<Suspense><ErrorBoundary><Providers>` with the provider inside the app's Suspense.
- Occurred: every `useSuspense` rendered DataProvider's built-in "Uncaught Suspense. Try adding a suspense boundary" fallback; all vitest suites failed with `waitForElementToBeRemoved ... already removed`. Moving `<Suspense>` inside `<DataProvider>` fixed it.
- Expected: the provider section or Common Issues says a boundary (or `AsyncBoundary`) must be a descendant of `DataProvider`, and the setup verification checklist checks it.
- Repro: `<Suspense fallback="x"><DataProvider><Comp/></DataProvider></Suspense>` where `Comp` calls `useSuspense` on a pending endpoint.
- Pass: skill text covers it, and the checklist item "a Suspense/AsyncBoundary is inside DataProvider" exists; an agent migrating this app places it correctly first time.

## P4 (L, high) [0.18 only]: vitest + jsdom cannot render `DataProvider` without `server.deps.inline`

- Fix: #4613. Eval: `.agents/projects/migrations/evals/vitest-jsdom-provider/run.sh` (exit 0 = pass; `DATA_CLIENT_VERSION=0.18.2` gives the failing baseline).

- Step: running existing vitest suite after provider swap.
- Occurred: `TypeError: useEnhancedReducer is not a function or its return value is not iterable` at `DataStore` (default-export interop of `@data-client/use-enhanced-reducer` through `node.mjs`).
- Workaround: `test.server.deps.inline: [/@data-client/]` in `vite.config.ts`.
- Expected: works with no config (vitest is the default test runner for Vite apps).
- Repro: Vite app, `vitest` with `environment: 'jsdom'`, `render(<DataProvider><div/></DataProvider>)` using `@data-client/react@0.18.2`.
- Pass: the repro renders with default vitest config (and the react-testing skill mentions vitest if any setting is still needed).

## P5 (L/D) [now a documented process() recipe]: API returns `{}` for a missing nested entity, which fails the whole response

- Fix: #4611. Eval: the `useSuspense` test in `optional-members.tsx`.

- Step: Entity definition (`Discussion.author`, `Comment.author`). The mock API returns `author: {}` when the author row is gone (test data has `authorId: ''`).
- Occurred: `Missing usable primary key when normalizing response. Entity: User, Value (processed): {}` thrown from the whole fetch; UI errors.
- Workaround: `static process(input) { const { author, ...rest } = input; return author?.id ? input : rest; }` on both entities, `author: User | undefined`.
- Expected: a documented pattern (or option) for optional nested entities with empty/pk-less values.
- Repro: Entity with `static schema = { author: User }` and a response with `author: {}`.
- Pass: a documented one-line approach (skill reference) that an agent finds and uses, or a library option, with this repro rendering `author` as undefined.

## P6 (L, typing): conditional fetch of a zero-argument endpoint

- Fix: #4612. Evals: `packages/react/typescript-tests/conditionalNoArgs.test.ts` and `packages/vue/typescript-tests/conditionalNoArgs.test.ts` (`yarn ci:build:types && yarn run tsc -p tsconfig.test.json --noEmit`).

- Step: `register.tsx` had `useTeams({ enabled: chooseTeam })`.
- Occurred: `useSuspense(getTeams, chooseTeam ? {} : null)` is a TS error (`[{} | null]` not assignable to `readonly [null] | readonly []`). Needed `useSuspense(getTeams, ...(chooseTeam ? [] : [null] as [null]))`.
- Expected: the documented `cond ? args : null` form type-checks for endpoints without args.
- Repro: `const e = new RestEndpoint({ path: '/teams' }); useSuspense(e, cond ? {} : null)`.
- Pass: repro compiles; or the skill documents the supported form.

## P7 (S): envelope responses (`{ data, meta }`) lack a worked recipe

- Fix: #4609.

- Step: schemas for list endpoints. API wraps lists and details as `{ data: [...], meta }` and `{ data: {...} }`.
- Occurred: worked out `schema: { data: [Discussion], meta: {} as Meta }`, `{ data: Discussion }`, a shared `Collection` with `argsKey: ({ discussionId }) => ({ discussionId })` so `getPage` and `push` share one list, `paginationField: 'page'` on a plain RestEndpoint with envelope schema. All worked (vitest "load more comments"), but only after reading Collection, RestEndpoint and pagination references; nothing says envelopes work with `getPage`/`push`, that page args must be left out of `argsKey`, or that `meta` updates after `getPage`.
- Expected: one worked example in rest-setup or pagination skill reference.
- Repro: the `getComments`/`createComment` endpoints in `migration.patch`.
- Pass: a skill reference contains an envelope + Collection + getPage + push recipe that matches this working code.

## P8 (S) [0.18 only]: library version vs skill version mismatch

- Fix: #4609.

- Step: skills install. Setup skill says `npx --no data-client-skills`; published 0.18.2 has no such bin (npm 404), so the fallback `npx skills add reactive/data-client ...` (from master) was used. Skills from master describe 0.19 behaviour while 0.18.2 was installed.
- Expected: detection of the installed version before choosing the install path, or a note about master skills vs released packages.
- Pass: on a project with 0.18.x installed, the skill's first-attempt path works and says which version the skills target.

## P9 (S, minor): codemod output needs formatting and orphaned interceptors

- Fix: #4610.

- `axios-to-rest` output had unformatted object literals (missing trailing commas) and left `api.interceptors...` referencing the removed `api`. The TODO comments pointed at the right section, so this cost little. Pass: codemod output passes `prettier --check` and does not leave references to the removed instance (or comments out the block).

## P10 (E): environment notes, not data-client work

- `yarn install` (v1.22) failed with `ECONNRESET` repeatedly behind the egress proxy; `npm install --legacy-peer-deps` worked (so `yarn.lock` is stale in the patch).
- Playwright's bundled browser version differs from the container's preinstalled chromium; used `launchOptions.executablePath`.
- The app's unit tests assumed react-query-auth's `AuthLoader` always showed a spinner (`waitForLoadingToFinish`); changed it to tolerate no spinner. Migrations of apps with similar test helpers will hit this.

## P11 (L/S, medium): optimistic response without a primary key fails with a generic console error

- Step: adding optimistic updates. The profile endpoint (`PATCH /users/profile`) has no `id` in its args, so `getOptimisticResponse(snap, body) { return body; }` returned an Entity without a primary key.
- Occurred: on master this logged a generic "Error processing" console error on every store update, and the optimistic change did not show. Reading the key from the snapshot (`snap.getResponse(getUser).data.data.id`, then `{ ...user, ...body }`) fixed it.
- Correction: my first diagnosis (partial responses must spread the cached entity) was wrong. `{ id, ...body }` merges with the cached entity and works for the discussion update (rechecked at 100 ms); the earlier "not optimistic" reading came from a test that queried `getByRole('heading')` behind an open Radix drawer (see the test note below).
- Expected: a dev-mode error that names `getOptimisticResponse` and the missing primary key, logged once, and skill guidance on reading the key from the snapshot when args lack it.
- Repro: an Entity-schema endpoint without an `id` path param whose `getOptimisticResponse` returns `{ ...body }`; call it with `ctrl.fetch` and watch the console.
- Fix: #4616. Eval: the "partial responses" block in `packages/react/src/__tests__/integration-optimistic-endpoint.web.tsx`.
- Pass: a dev-mode error naming `getOptimisticResponse` and the missing primary key is logged once, and the skill shows how to read the key from the snapshot. I have not run `e2e/tests/optimistic.spec.ts` against #4616's packages.

Test note for P11: `getByRole('heading')` cannot see page content behind an open Radix drawer (aria-hidden), so optimistic UI checks behind a drawer must use `locator`/`getByText`.
