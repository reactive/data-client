# Examples

## Two Categories

### Monorepo workspace members

`benchmark`, `benchmark-react`, `test-bundlesize`, `normalizr-*`, `coin-app` — listed in root `package.json` workspaces, managed by yarn. Most use `workspace:*` for `@data-client/*` deps; the rest (like `coin-app`'s exact pins) still resolve to the local packages, since changesets bumps those pins with every release.

### Standalone (StackBlitz demos)

`todo-app`, `github-app`, `nextjs`, `vue-todo-app` — **not** in root workspaces.

- Use **npm** with committed `package-lock.json` (do not add yarn.lock)
- Reference **published** `@data-client/*` versions (exact or caret ranges, never `workspace:*`)
- Include `"stackblitz": { "startCommand": "npm start" }` (or `"npm run dev"`) in `package.json`
- StackBlitz links: `https://stackblitz.com/github/reactive/data-client/tree/master/examples/<name>`

## Release bumps

Workspace members run the repo's code, so a breaking change updates them in the same PR. Standalone examples install published versions from npm, so an edit that works with their published version lands in the same PR, and one that needs unreleased code waits in [plans/after-release.md](../plans/after-release.md). When bumping a standalone example to a new release, make that release's edits listed there and delete those entries. The bump is usually Renovate's grouped "all non-major dependencies" PR, which doesn't include them, so push them onto that PR before merging it.

## StackBlitz Constraints

- **Node 22 max** — StackBlitz cannot run Node 24. Keep `engines.node` compatible (e.g. `>=22.0.0`)
- Uses WebContainers, so native addons and some Node APIs are unavailable

## Build Tooling

Most examples use Webpack via `@anansi/webpack-config`. Exceptions: `nextjs` (Next.js), `vue-todo-app` (Vite), `normalizr-*` (Node scripts via `babel-node`).
