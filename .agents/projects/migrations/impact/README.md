# Migration impact kit

Measures what a migration to Data Client changes, using the same scripted checks on the app before
and after. One config file per app, one command, one report.

```bash
node .agents/projects/migrations/impact/measure.mjs \
  --config .agents/projects/migrations/<app>/impact/impact.config.mjs \
  --baseline <checkout before> --migrated <checkout after> \
  --baseline-label react-query --migrated-label data-client [--feature]
```

It writes `impact-results/impact.md` (tables) and `impact-results/impact.json` (every row, one schema),
plus the raw `flow.json`, `static.json` and `feature.json` with all samples, and `meta.json` (the commit
and uncommitted-file count of each checkout, tool versions and settings, also shown in the report).

Requirements: Node 22+, both checkouts installed, and Playwright resolvable from the app (set
`CHROMIUM_PATH` to use a preinstalled browser). `--feature` also needs the `claude` CLI and spends
model tokens.

## What it measures

| Tool               | Measures                                        | How                                                                             |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `flow.mjs`         | User-visible behavior during a scripted flow    | Playwright, before and after interleaved, 4x CPU throttle                       |
| `static.mjs`       | Bundle and code                                 | Reads `dist` and source files                                                   |
| `feature-cost.mjs` | Tokens and cost for an agent to add one feature | `claude -p` on a temporary copy of each checkout, then a hidden acceptance test |
| `report.mjs`       | Merges any of the above                         | Markdown tables and `impact.json`                                               |

### Flow (`flow.mjs`)

Each step of the flow records:

- **Time to ready**: from the action (click) until the step's `ready` check passes. For a mutation
  step this is the time from submit until the UI shows the change.
- **Reads and writes**: data requests, split into GET and others. Reads in a mutation step are the
  refetches that mutation triggered.
- **Redundant reads**: a GET whose response body equals the last response from the same URL in this
  session. The client already had that data, so this read was a cache miss that a cache could have served.
  Reads whose body could not be read are counted separately, so a zero is never a silent detector failure.
- **Stale views**: steps with a `fresh` check poll it for `staleTimeoutMs` (3s). If it never passes, the
  view showed old data after a change made elsewhere.
- **Loading indicators**: how many elements matching `loading` appeared, and for how long. A navigation
  with no loading indicator was served from the cache.
- **Stutter**: long tasks, total blocking time, slowest interaction (Event Timing) and layout shift.

The cold load of the landing page adds JS parse and compile time and module evaluation time (from a
V8 trace), LCP, total blocking time and heap size.

Every sampled metric reports the median, the interquartile range and a 95% bootstrap interval for the
change. The verdict is "within noise" when that interval includes zero. Before and after runs
alternate, so drift on the machine affects both equally.

`node flow.mjs --config <impact.config.mjs> --from flow.json` recomputes the rows from saved samples
without running the browser, for example after a change to the statistics.

### Static (`static.mjs`)

- Entry and total JS, and CSS, as raw, gzip and brotli sizes. Entry means the scripts and modulepreloads
  in `index.html`.
- Lines of code, files and decision points (if, ternary, `&&`, `||`, `??`, loops, case, catch) for
  each code category in the config. Decision points need `typescript` installed in the app.
- Data plumbing in the code you maintain (everything except tests and mocks): `useEffect`, `useState`,
  loading and error flags, manual cache calls (invalidate, refetch, setQueryData and similar), cache keys
  and `catch` blocks.
- How many files import each data library.

### Feature cost (`feature-cost.mjs`)

Copies each checkout to a temporary folder (node_modules symlinked) and runs
`claude -p "<prompt>" --permission-mode acceptEdits` with only file tools, type-check and unit-test
commands allowed. Then it copies in the acceptance files and runs `acceptance`. It records total and
output tokens, cost, turns, wall time, lines and files changed, and whether the acceptance test passed.
An errored session counts as a failed acceptance, and its spend stays in the token and cost medians
when the CLI reported it (a timeout or crash reports none). The report lists the agent guidance files
(CLAUDE.md, AGENTS.md, skills) each copy contained, because they are part of what the agent sees. The
prompt gets the tool allowlist appended, because shell edits (sed -i, scripts) are refused and an agent
that tries them ends with no change. Writes into node_modules reach the source checkout through the
symlink.
Pick a feature that touches data the app shows in more than one place; that is where cache design shows.

## Config

`impact.config.mjs` exports one object. Paths are relative to `root` in each checkout. See
[`../bulletproof-react/impact/impact.config.mjs`](../bulletproof-react/impact/impact.config.mjs) for a complete example.

```js
export default {
  name: 'my-app',
  root: 'apps/web', // folder inside each checkout
  prep: ['fixed-latency.patch'], // optional patches applied to both checkouts
  build: 'npx vite build', // default
  serve: 'npx vite preview --port {port} --strictPort', // default
  flow: {
    isData: url => url.includes('/api/'), // which requests are data requests
    loading: '[aria-busy=true], .spinner', // loading indicator selector
    landing: {
      path: '/',
      ready: ({ page }) => page.getByRole('main').waitFor(),
    },
    setup: async ({ page, base, uid }) => {
      /* sign in; not measured */
    },
    steps: [
      {
        name: 'rename item',
        kind: 'mutation', // 'nav' (default) or 'mutation'
        prepare: async ({ page }) => {
          /* open the form and type; not measured */
        },
        // Clicked to start the step, once it is visible, stable and enabled.
        // Use `run: ctx => ...` instead for an action that is not one click.
        trigger: ({ page }) => page.getByRole('button', { name: 'Save' }),
        ready: ({ page, uid }) => page.getByText('renamed ' + uid).waitFor(),
      },
      {
        name: 'back to list',
        run: ({ page }) => page.getByRole('link', { name: 'Items' }).click(),
        ready: ({ page }) => page.getByRole('table').waitFor(),
        fresh: ({ page, uid }) => page.getByText('renamed ' + uid).isVisible(),
      },
    ],
  },
  static: {
    include: ['src/**/*.{ts,tsx}'],
    categories: [
      ['test', ['**/*.test.*']],
      ['data', ['src/api/**']],
    ],
    dist: 'dist',
    dataLibs: ['@tanstack/react-query', '@data-client/react'],
  },
  feature: {
    title: 'Short name',
    prompt: '...',
    acceptanceFiles: { 'e2e/impact.spec.ts': 'acceptance/impact.spec.ts' },
    acceptance: 'npx tsc --noEmit && npx playwright test e2e/impact.spec.ts',
  },
};
```

## Getting numbers you can trust

- **Fix the network latency.** Mock APIs often add random delays. Random latency hides real
  differences, so make it a constant in both checkouts with a `prep` patch.
- **Count before you time.** Request counts, redundant reads, stale views and loading indicators are
  deterministic, so a single run shows them. Timings need 10 or more runs.
- **Write flows that tolerate stale data.** Find rows by an id that does not change, so the before
  build can finish a flow even while it shows stale data. The `fresh` check records the staleness.
- **Write mutation steps in three parts.** `prepare` opens the form and types the input, `trigger`
  returns the submit button, and `ready` waits for the change to show. Before timing starts, the kit
  trial-clicks the trigger, which waits for drawers and dialogs to finish animating; without that, about
  900ms of animation lands inside the measured time.
- **Check `ready` locators behind overlays.** An open drawer or dialog hides the page from the
  accessibility tree, so `getByRole` cannot see an optimistic update behind it. Use `getByText` there.

## Tests

```bash
node --test .agents/projects/migrations/impact/utils/utils.test.mjs
```
