# GC harness shared code

Fixture, protocol (axes, stable ids, filters), frame helpers, and report stats
shared by the GC harnesses in `examples/benchmark` (Node),
`examples/benchmark-react` (browser), and `examples/benchmark-native` (Android).
See [plans/garbage-collection.md](../../plans/garbage-collection.md).

- **CommonJS `.js` + hand-written `.d.ts` on purpose.** It is the one format
  Node ESM (named imports via the literal `module.exports = { ... }`), webpack
  (outside babel's `src/` include), Metro (no `.mjs`/`.cjs`), Jest, and tsx all
  load with zero config. Keep it plain ES2020: no TS, JSX, or Node globals in
  bundled files.
- **Not a workspace** (no `package.json`), so the root `package.json` (no
  `"type"`) makes `.js` CommonJS.
- `protocol-cli.js` is the host-only CLI used by benchmark-native shell scripts;
  never import it from app code.
- Each harness's build provenance digest includes this folder; keep it that way
  when adding files.
