# Eval: `DataProvider` under vitest + jsdom

Source: problem P4 of the bulletproof-react migration. Vitest 2 loads `@data-client/react`'s ESM build
and then imports `@data-client/use-enhanced-reducer` natively in Node. Without an `exports` map, Node
picked its CommonJS `main`, so the default import was the module object and `DataProvider` threw
`useEnhancedReducer is not a function or its return value is not iterable`.

Run `./run.sh`. It packs `normalizr`, `core`, `use-enhanced-reducer` and `react` from this checkout,
installs them in a temp app (vitest 2.1, vite 5, jsdom 24, React 18, default vitest config) and renders
`<DataProvider>`.

- Pass: exit 0 (the test renders `ok`).
- Baseline: `DATA_CLIENT_VERSION=0.18.2 ./run.sh` fails with the error above.

Vitest 3 and later resolve differently and pass even on 0.18.2, so the pinned versions matter.
