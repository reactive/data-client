---
title: "Upgrading @rest-hooks/test to 3"
---

`@rest-hooks/test` uses `react-hooks-testing-library` internally. Version 3
has a major version upgrade for this library, so the following [breaking changes](https://github.com/testing-library/react-hooks-testing-library/releases/tag/v5.0.0
)
also apply to `@rest-hooks/test@3`

- result.current, result.error is now `undefined` after suspense, rather than `null`
-  interval will now default to 50ms in async utils
-  timeout will now default to 1000ms in async utils
-  suppressErrors has been removed from async utils
- Adjust types so that react renderer exports don't required extra generic parameter
- Importing from renderHook and act from @testing-library/react-hooks will now auto-detect which renderer to used based on the project's dependencies
    - peerDependencies are now optional to support different dependencies being required
    - This means there will be no warning if the dependency is not installed at all, but it will still warn if an incompatible version is installed
    - Auto-detection won't work with bundlers (e.g. Webpack). Please use as specific renderer import instead
(see https://github.com/testing-library/react-hooks-testing-library/releases/tag/v5.0.0)


`@rest-hooks/test@3` [Release notes](https://github.com/coinbase/rest-hooks/releases/tag/%40rest-hooks%2Ftest%403.0.0)
