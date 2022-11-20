---
title: "Upgrading @rest-hooks/test to 6"
---

`@rest-hooks/test` uses `react-hooks-testing-library` internally. Version 7
has a major version upgrade for this library, so the following [breaking changes](https://github.com/testing-library/react-hooks-testing-library/releases/tag/v7.0.0
)
also apply to `@rest-hooks/test@6`

- 'suppressErrorOutput will now work when explicitly called, even if the
RHTL_DISABLE_ERROR_FILTERING env variable has been set' (from
react-hooks-testing-library)
- requires node 12 or above


`@rest-hooks/test@6` [Release notes](https://github.com/coinbase/rest-hooks/releases/tag/%40rest-hooks%2Ftest%406.0.0)
