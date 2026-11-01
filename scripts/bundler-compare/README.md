# bundler-compare

Builds a two-page app (one lazy chunk per page) from this checkout's packages and prints its gzipped and brotli JS
with one bundler per family. Each one is the fastest of its family:

| Family    | Bundler           | Stands in for  |
| --------- | ----------------- | -------------- |
| webpack   | rspack            | webpack        |
| Rollup    | Vite 8 (Rolldown) | Vite 7, Rollup |
| Turbopack | Next.js 16        | —              |

## When to use it

Use it only for changes where bundlers can disagree. These are changes to how code is split into modules, not to
the code itself:

- `sideEffects`, `exports`, `module` or other entry fields in a package's `package.json`
- how entry files re-export (`export *`, `export * as`, re-exports from another package)
- moving code between modules or packages, or adding an import between modules that bundle into different
  chunks

For other changes, CI's "Bundle Size" check (webpack, `examples/test-bundlesize`) is enough: a few more bytes of
code cost about the same in every bundler.

## Usage

Needs `yarn` (the repo's) and `npm`. The first run installs this folder's dependencies with `npm ci`. From the
repository root:

```bash
git checkout master && scripts/bundler-compare/measure.sh before
git checkout my-branch && scripts/bundler-compare/measure.sh after
scripts/bundler-compare/measure.sh --compare before after
```

`measure.sh` builds every package's `lib/` (pass `--no-build` to reuse them), installs them into
`node_modules/@data-client` as npm would, and saves the totals to `results/<label>.txt`. It leaves out the
`Object.hasOwn` fallback at the top of the entry files, since apps get polyfills elsewhere. One run takes about 25
seconds.

Compare runs of one bundler with each other, not across bundlers: the Next.js app uses `@data-client/react/nextjs`'s
`DataProvider`, and absolute totals depend on the bundler versions. `--compare` warns when two runs used different
versions.
