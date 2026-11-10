# After the next release

Edits that can only land once the `@data-client/*` packages carrying them are published, such as standalone examples (see "Release bumps" in `examples/AGENTS.md`). Make each in the PR that bumps those examples to the release, then delete its entry.

Each entry names the changeset, the files, and the new form to write.

## `fetch-if-stale-promise` (`fetchIfStale()` always returns a Promise)

`examples/github-app/src/routing/routes.tsx`: the `PullList`, `IssueList` and `IssueDetail` routes `await controller.fetchIfStale(...)` bare, which rejects `resolveData` unhandled when the fetch fails. Write `await controller.fetchIfStale(...).catch(() => {});`, as in [Route loaders](../docs/core/api/Controller.md#fetchIfStale-loaders). On 0.18 a fresh `fetchIfStale()` returns data synchronously, so `.catch()` would throw.
