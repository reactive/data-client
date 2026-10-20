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
- `yarn check:typeperf` - Type-check cost budget (CI `typecheck` job); run after `yarn ci:build:types` when changing public types, `--update` to re-record. See `scripts/typeperf/README.md`
- `yarn copy:websitetypes` - Regenerates the website playground's Monaco types (`website/src/components/Playground/editor-types`, ~10s); commit the result when public types or a copied dependency (`scripts/copywebsitetypes.sh`) change. CI `regenerate` check fails when they're stale
- `yarn check:doc-examples [react|vue]` - Type-checks the React and Vue code examples in `docs/` (CI `regenerate` check). See "Code examples" in `website/framework-docs/README.md`
- Website: `yarn workspace rdc-website typecheck` / `yarn lint --quiet 'website/{src,api}/**/*.{js,ts,tsx}'` / `yarn workspace rdc-website build`; dev: `cd website && yarn start:vscode`

**Test naming**: in `__tests__/`, `*.node.ts[x]` (Node), `*.native.ts[x]` (RN), any other `*.ts[x]` (regular); elsewhere `*.test.node.ts[x]`, `*.test.native.ts[x]`, `*.test.ts[x]`

**Targeted tests**: `yarn test --selectProjects ReactDOM --testPathPatterns packages/react` (project names: `ReactDOM`, `Node`, `ReactNative`)

## CI

- **CircleCI** (`.circleci/config.yml`) — PR validation: lint, typecheck, unit tests (React 17/18/native/latest), Node matrix, ESM type checks (TS 4.0–5.3+), browser build.
- **GitHub Actions** (`.github/workflows/`) — release (`changesets`), bundle size PR comments, benchmark regression detection.

Changing root `package.json` `workspaces` requires updating `.circleci/config.yml` (`setup` job) and `.github/workflows/` install steps.

## Changesets

Any user-facing change in `packages/*` requires a changeset. Core packages are version-linked (bumping one bumps all). See skill "changeset" for full workflow.

## File Organization

- **API definitions**: `src/resources/` within examples/apps
- **Examples**: `examples/todo-app`, `examples/github-app`, `examples/nextjs`
- **Documentation**: `docs/core/api`, `docs/rest`, `docs/core/guides`
- **Tests**: `packages/*/src/**/__tests__`
- **Benchmarks**: `examples/benchmark` (Node: core/normalizr/endpoint throughput), `examples/benchmark-react` (browser: React rendering and data-library comparison). See `.cursor/rules/benchmarking.mdc` and each example’s README.
- **Skills**: `.agents/skills/` (Cursor, Codex, and other agents; `.claude/skills` links to it for Claude Code)
  - `references/*.md` listed in a skill's `references.json` are generated from `docs/`; edit the doc, never the reference. `yarn build:skills` regenerates them (an agent pre-push hook makes sure they are committed) and the `regenerate` CI check fails on drift.
- **Agent rules**: `.cursor/rules/*.mdc` (and nested `<dir>/.cursor/rules`) are the source for both Cursor and Claude Code. `yarn build:agent-rules` generates `.claude/rules/*.md` from them (`globs` become `paths`); never edit those. Every rule needs `globs` or `alwaysApply: true`; guidance pulled in by description alone belongs in a skill. The pre-push hook and the `agent-rules` CI check catch drift.
- **Agent hooks**: `.cursor/hooks/` scripts are wired in both `.cursor/hooks.json` and `.claude/settings.json`: `eslint-fix.js` fixes uncommitted JS/TS once at the end of each turn and hands errors it can't fix back to the agent, and `pre-push.js` regenerates files, lint-fixes what a push includes, and runs `scripts/breaking-evals.mjs` (a minor or major changeset needs a skill eval; `.cursor/rules/breaking-changes.mdc`). Keep hooks cheap: batch per turn or push, never per edit.

## Agent Support Priorities

For agent integrations (skills, plugins, setup docs, hooks), support in this order:

1. **Claude Code** (CLI, desktop, projects) and **Cursor** (IDE, CLI, cloud agents, projects): must work out of the box.
2. **Codex**: supported; fix gaps when found.
3. **Everything else**: best effort through the shared `.agents/skills` and `AGENTS.md` conventions; never at tier 1's expense.

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
