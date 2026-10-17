# Examples

## Two Categories

### Monorepo workspace members

`benchmark`, `benchmark-react`, `test-bundlesize`, `normalizr-*`, `coin-app` — listed in root `package.json` workspaces, managed by yarn. Most use `workspace:*` for `@data-client/*` deps; `coin-app` depends on published versions.

### Standalone (StackBlitz demos)

`todo-app`, `github-app`, `nextjs`, `vue-todo-app` — **not** in root workspaces.

- Use **npm** with committed `package-lock.json` (do not add yarn.lock)
- Reference **published** `@data-client/*` versions (exact or caret ranges, never `workspace:*`)
- Include `"stackblitz": { "startCommand": "npm start" }` (or `"npm run dev"`) in `package.json`
- StackBlitz links: `https://stackblitz.com/github/reactive/data-client/tree/master/examples/<name>`

## Release bumps

An example on `workspace:*` runs the repo's code, so a breaking change updates it in the same PR. An example that depends on a published `@data-client/*` version (exact or caret range: every standalone example, and `coin-app`) can't run unreleased code, so its edits wait in [plans/after-release.md](../plans/after-release.md). When bumping such an example to a new release, also make that release's edits listed there and delete those entries.

## StackBlitz Constraints

- **Node 22 max** — StackBlitz cannot run Node 24. Keep `engines.node` compatible (e.g. `>=22.0.0`)
- Uses WebContainers, so native addons and some Node APIs are unavailable

## Build Tooling

Most examples use Webpack via `@anansi/webpack-config`. Exceptions: `nextjs` (Next.js), `vue-todo-app` (Vite), `normalizr-*` (Node scripts via `babel-node`).
