# Reactive Data Client

Monorepo for `@data-client` high performance npm packages.

## Architecture

- `packages/endpoint`: Base endpoints and declarative schemas
- `packages/rest`: REST modeling (`resource()`, `RestEndpoint`)
- `packages/core`: Framework-agnostic normalized store, Controller, Managers
- `packages/react`: React hooks (`useSuspense`, `useLive`, `useQuery`)
- `packages/vue`: Vue 3 composables
- `packages/normalizr`: Schema/Entity/normalization

## Development Workflows

- `yarn build` - Build all packages
- `yarn test` - Run tests (Jest projects: ReactDOM, Node, ReactNative)
- `yarn lint` / `yarn format` - Linting and formatting
- Website: `yarn workspace rdc-website typecheck` / `yarn lint --quiet 'website/src/**/*.{ts,tsx}'` / `yarn workspace rdc-website build`; dev: `cd website && yarn start:vscode`

**Test naming**: `*.node.test.ts[x]` (Node), `*.native.test.ts[x]` (RN), `*.test.ts[x]` (regular)

**Targeted tests**: `yarn test --selectProjects ReactDOM --testPathPatterns packages/react` (project names: `ReactDOM`, `Node`, `ReactNative`)

**Other React versions** (CI runs `^17`, `^18`, `19.3`): never swap versions in the main checkout. In a throwaway `git worktree`: `yarn install`, `yarn run ci:build:setup`, then the matching `npm pkg delete resolutions.*` + `yarn up ...` lines from the `unit_tests` job in `.circleci/config.yml`, then `yarn test --no-cache ...`. Without `--no-cache`, transforms cached before types were built leave `const enum` members (e.g. `ExpiryStatus.Valid`) undefined; that looks like a version failure but isn't. React 17's legacy Suspense keeps hidden content beside the fallback in `textContent`.

## CI

- **CircleCI** (`.circleci/config.yml`) — PR validation: lint, typecheck, unit tests (React 17/18/native/latest), Node matrix, ESM type checks (TS 4.0–5.3+), browser build.
- **GitHub Actions** (`.github/workflows/`) — release (`changesets`), bundle size PR comments, benchmark regression detection.

Adding a root `package.json` workspace outside `examples/` or `website` requires updating `.circleci/config.yml` (`setup` job trims by name) and `.github/workflows/` install steps.

## Changesets

Any user-facing change in `packages/*` requires a changeset. Core packages are version-linked (bumping one bumps all). See skill "changeset" for full workflow.

## File Organization

- **API definitions**: `src/resources/` within examples/apps
- **Examples**: `examples/todo-app`, `examples/github-app`, `examples/nextjs`
- **Documentation**: `docs/core/api`, `docs/rest`, `docs/core/guides`
- **Tests**: `packages/*/src/**/__tests__`
- **Benchmarks**: `examples/benchmark` (Node: core/normalizr/endpoint throughput), `examples/benchmark-react` (browser: React rendering and data-library comparison). See `.cursor/rules/benchmarking.mdc` and each example’s README.
- **Skills**: `.agents/skills/` (Cursor, Codex, and other agents)
  - `references/*.md` listed in a skill's `references.json` are generated from `docs/`; edit the doc, never the reference. `yarn build:skills` regenerates them (an agent pre-push hook makes sure they are committed) and the `skills` CI check fails on drift.

## Key Principles

1. **Prefer smaller React components** that do one thing
2. **Use fixtures/interceptors for testing** instead of mocking
3. **Consider project [goals](./GOALS.md)** when considering library changes

## Documentation Updates

Update docs **in the same commit/PR** when changing public APIs (anything exported from package entry points). No docs needed for internal/private APIs. See skill "packages-documentation" for guidelines.

## Integration Details

- **Babel**: Resolves relative `.js` imports to `.ts` in tests
- **Jest**: Maps `@data-client/*` imports to local `packages/*/src` during tests
- **TypeScript**: Uses TS 6.0 project references; ambient `.d.ts` files copied during build
- **Native compilation**: When `COMPILE_TARGET=native`, prefers `.native.*` files
