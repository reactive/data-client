## Reactive Data Client – AI contributor guide

- Use [@data-client/rest guide](instructions/rest.instructions.md) for Resource/Endpoint modeling.
- Use [@data-client/react guide](instructions/react.instructions.md) for React hooks/components and Managers.
- Use [@data-client/test guide](instructions/test.instructions.md) for fixtures and hook testing.
- Use [@data-client/manager guide](instructions/manager.instructions.md) to implement global side-effects.
- Validate API usage with docs in `docs/core/api`, `docs/rest`, and focused guides in `docs/core/guides`.

### Big picture
- Monorepo managed by Yarn workspaces (`packages/*`, examples under `examples/*`, site in `website/`).
- Core architecture:
	- `packages/endpoint`: base Endpoint types; `packages/rest`: REST modeling (`resource()`, `RestEndpoint`).
	- `packages/core`: framework-agnostic normalized store, actions, Controller, Managers.
	- `packages/react`: React bindings (hooks like `useSuspense`, `useLive`, `useQuery`, `DataProvider`).
	- `packages/vue`: Vue 3 composables (`useSuspense`, `useQuery`, `useLive`, `provideDataClient`).
	- `packages/normalizr`: schema/Entity/normalization; used by rest/core/react/vue.

### Developer workflows
- Build all packages: `yarn build` (runs `tsc --build` + each workspace build). Clean with `yarn build:clean`.
- Tests: `yarn test` (Jest projects: ReactDOM, Node, ReactNative). Coverage: `yarn test:coverage`.
	- Node-only tests name with `.node.test.ts[x]`; RN tests with `.native.test.ts[x]` (see `jest.config.js`).
- Lint/format: `yarn lint` and `yarn format`.
- Website (docs) local dev: run the workspace task “website: start”.

### Conventions and patterns
- Define REST resources using `resource()` and Entities with default field values; prefer normalized schemas.
	- Examples: `examples/nextjs/resources/TodoResource.ts`, `examples/github-app/src/resources/Issue.tsx`.
- Place app-level API definitions and custom Managers in `src/resources/` within examples/apps (e.g., `examples/todo-app/src/resources/`).
- Managers communicate via actions and the `Controller`; import `actionTypes` from `@data-client/react` for type checks.
- Programmatic queries use `new Query(...)` with a Resource’s schema; see `README.md` examples.

### Integration details
- Babel (`babel.config.js`) resolves relative `.js` imports to `.ts` in tests; when `COMPILE_TARGET=native`, it prefers `.native.*` files.
- Jest maps `@data-client/*` imports to local `packages/*/src` during tests (`moduleNameMapper`).
- TypeScript 5.9 project references are used; ambient `.d.ts` files are copied during build (`build:copy:ambient`).

### Where to look first
- High-level usage: root `README.md` and `packages/*/README.md` (react, rest, core, vue) show canonical patterns.
- REST patterns: `docs/rest/*`; Core/Controller/Managers: `docs/core/api/*`.
- Example apps: `examples/todo-app`, `examples/github-app`, `examples/nextjs` demonstrate resources, hooks, mutations, and Managers.
- Vue patterns: `packages/vue/src/consumers/` for composables, `packages/vue/src/__tests__/` for Vue-specific test patterns.

### Testing patterns
- Prefer `renderDataHook()` from `@data-client/test` with `initialFixtures`/`resolverFixtures` for hook tests.
- Use `nock` for low-level HTTP tests of endpoints. Keep tests under `packages/*/src/**/__tests__`.
- Vue tests use `@vue/test-utils` with `mount()` and Vue's `Suspense` component for async rendering.
- Test file naming: `.node.test.ts[x]` for Node-only, `.native.test.ts[x]` for React Native, `.web.ts` for browser tests.

If anything here is unclear or missing (e.g., adding a new package, expanding CI/build), point it out and I’ll refine these instructions.