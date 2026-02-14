# Reactive Data Client

Monorepo for `@data-client` npm packages.

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
- Website dev: `cd website && yarn start:vscode`

**Test naming**: `*.node.test.ts[x]` (Node), `*.native.test.ts[x]` (RN), `*.test.ts[x]` (regular)

## File Organization

- **API definitions**: `src/resources/` within examples/apps
- **Examples**: `examples/todo-app`, `examples/github-app`, `examples/nextjs`
- **Documentation**: `docs/core/api`, `docs/rest`, `docs/core/guides`
- **Tests**: `packages/*/src/**/__tests__`

## Key Principles

1. **Prefer smaller React components** that do one thing
2. **Use fixtures/interceptors for testing** instead of mocking

## Documentation Updates

**Update docs when changing public APIs** (anything exported from package entry points like `index.ts`).

**Always update docs for:**
- Breaking changes (removing/changing signatures, properties, or behavior; deprecations)
- New public APIs (classes, functions, methods, hooks, composables)
- New options/parameters on existing APIs

**No docs needed for:**
- Internal/private APIs (prefixed with `_`, not exported, or marked `@internal`)
- Implementation-only changes

Update docs **in the same commit/PR** as code changes. For writing guidelines, see skill "packages-documentation"

## Integration Details

- **Babel**: Resolves relative `.js` imports to `.ts` in tests
- **Jest**: Maps `@data-client/*` imports to local `packages/*/src` during tests
- **TypeScript**: Uses TS 5.9 project references; ambient `.d.ts` files copied during build
- **Native compilation**: When `COMPILE_TARGET=native`, prefers `.native.*` files
