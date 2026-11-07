# Eval: `DataProvider` under vitest + jsdom

Source: problem P4 of the bulletproof-react migration. Vitest 2 resolves `@data-client/react` to its ESM build and
lets Node load it natively. That build default-imports `@data-client/use-enhanced-reducer`. With no `exports` map,
Node picked that package's CommonJS `main`, so the default import was the module object and `DataProvider` threw
`useEnhancedReducer is not a function or its return value is not iterable`.

Run `./run.sh`. It builds `normalizr`, `core`, `use-enhanced-reducer` and `react` in this checkout, packs them,
installs them in a temp app (vitest 2.1, vite 5, jsdom 24, React 18, default vitest config) and renders
`<DataProvider>`.

- Pass: exit 0 (the test renders `ok`).
- Fail: exit 1 (vitest failed).
- Exit 2: building, packing or installing failed, so the eval did not run. It prints the end of the log.
- Baseline: `DATA_CLIENT_VERSION=0.18.2 ./run.sh` fails with the error above.

`SKIP_BUILD=1` skips the type build when it is current; `yarn pack` still builds each package's JavaScript.

It is manual, not part of CI: it takes a few minutes and installs from npm. Direct dependencies are pinned exactly;
their own dependencies resolve at install time.

Vitest 3.2 and 5.1 pass even on 0.18.2, so keep the pinned versions.
