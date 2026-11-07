# Eval: package subpaths share code with the root entry under Node

Source: found while adding package entry-point checks to CI (PR #4617). Under Node `import` (Vitest's
externalized dependencies, native ESM), the root entries of `@data-client/core`, `react` and `rest` load the
CommonJS `dist/` build through `node.mjs`. Their subpaths had a `require` condition but no `import`, so they fell
through to the ESM `lib/` build, and code shared with the root loaded twice. Under `require`, core built each entry
in its own rollup build, so `dist/mock.js` bundled its own `Controller`, and react's `dist/server/index.js` its own
network manager.

Seen as:

- `@data-client/react/redux`'s `ExternalDataProvider` filled a `ControllerContext` that the hooks from
  `@data-client/react` never read, so `useController()` returned the default controller.
- `@data-client/core/mock` ran on a second copy of `Controller`.

Affected subpaths: core `./next`, `./mock`; react `./next`, `./ssr`, `./redux`, `./mock`; rest `./next`.

Run `./run.sh`. It builds the types, packs every published package through `yarn check:package-exports`, then:

1. Reads that check's `shared` result for each package. It fails when, loading `.` and a subpath with the same
   loader, Node loads one package from two build folders (`dist/` and `lib/`), when a subpath export is a
   different object from the root export of the same name, or when one class is bundled into two `dist/` files.
2. Runs `probe.mjs` against the packed packages: under `import` and `require`, a hook rendered inside
   `@data-client/react/redux`'s `ExternalDataProvider` must get that provider's controller.

- Pass: exit 0 (all 11 published packages report a passing `shared` check, and the probe prints `pass` twice).
- Fail: exit 1. A check that crashes after some packages but before all 11 report also fails.
- Exit 2: the type build failed, or the check stopped before reporting any package (packing failed), so the eval
  did not run. It prints the end of the log.
- Baseline: PR #4617's head (`38a9f50`) fails. `shared` fails for core, react and rest, and the probe prints
  `FAIL import`.

Not covered: react's ESM-only `./nextjs` under plain Node `import` (a known gap: it loads `lib/` while `.` loads
`dist/`; Next.js bundles it, so apps don't hit this). React Native's `dist/*.native.js` (the probe runs in Node, and the `shared` check scans the native
files only for duplicated classes).

`SKIP_BUILD=1` skips the type build when it is current. It takes about three minutes, and is not part of CI as an
eval: CI's `package-exports` job runs the same `shared` check.
