# @data-client/codemods

## 0.1.0

### Minor Changes

- [#4409](https://github.com/reactive/data-client/pull/4409) [`7d1c42a`](https://github.com/reactive/data-client/commit/7d1c42add1a00089a8ff604086cd0a2d295bbb45) - New package: run Data Client codemods with `npx @data-client/codemods <codemod> <path>`

  The codemods ship on npm with each release, instead of being fetched from dataclient.io at run time.

  ```bash
  npx @data-client/codemods v0.18 src/
  ```
