# Eval: `DataProvider` when Node loads the ESM build

Source: problem P4 of the bulletproof-react migration. Vitest 2 resolves `@data-client/react` to its ESM build and
lets Node load it natively. That build default-imports `@data-client/use-enhanced-reducer`. With no `exports` map,
Node picked that package's CommonJS `main`, so the default import was the module object and `DataProvider` threw
`useEnhancedReducer is not a function or its return value is not iterable`.

The eval reproduces that resolution without Vitest: `node --conditions=module` resolves `@data-client/react` to its
ESM build the way Vitest 2 did, and `provider.mjs` server-renders `<DataProvider>`. It installs no test runner or
bundler, since old Vitest and Vite releases have security advisories.

Run `./run.sh`. It builds `normalizr`, `core`, `use-enhanced-reducer` and `react` in this checkout, packs them, and
installs them with React 18 in a temp app.

- Pass: exit 0 (prints `DataProvider rendered ok`).
- Fail: exit 1 (the render threw or rendered no children).
- Exit 2: building, packing or installing failed, so the eval did not run. It prints the end of the log.
- Baseline: `DATA_CLIENT_VERSION=0.18.2 ./run.sh` fails with the error above, as does this checkout with the
  `exports` map removed from `use-enhanced-reducer`.

`SKIP_BUILD=1` skips the type build when it is current; `yarn pack` still builds each package's JavaScript.

It is manual, not part of CI: `yarn check:package-exports` covers the same entry point (Node `import` of
use-enhanced-reducer must match its ESM build).
