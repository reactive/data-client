# Eval: `DataProvider` under vitest + jsdom

Source: problem P4 of the bulletproof-react migration. Vitest 2 resolves `@data-client/react` to its ESM build and
lets Node load it natively. That build default-imports `@data-client/use-enhanced-reducer`. With no `exports` map,
Node picked that package's CommonJS `main`, so the default import was the module object and `DataProvider` threw
`useEnhancedReducer is not a function or its return value is not iterable`.

Run `./run.sh`. It builds `normalizr`, `core`, `use-enhanced-reducer` and `react` in this checkout, packs them,
installs them in a temp app (vitest 2.1, vite 5, jsdom 24, React 18, default vitest config) and renders
`<DataProvider>`. `SKIP_BUILD=1` reuses the current build output.

- Pass: exit 0 (the test renders `ok`).
- Baseline: `DATA_CLIENT_VERSION=0.18.2 ./run.sh` fails with the error above.

Vitest 3.2 and 5.1 pass even on 0.18.2, so keep the pinned versions.
