---
title: "Upgrading @rest-hooks/test to 7"
---

### Importing directly from hidden files is no longer supported

All packages now use [package exports](https://webpack.js.org/guides/package-exports/), which if
supported disallow importing directly from any sub path like `rest-hooks/lib/MockResolver`

Doing this was never supported as file locations would change without announcement. However, now
with tooling that supports package exports, it will not work at all.

### Node >= 12

Node 10 support is dropped.


`@rest-hooks/test@7` [Release notes](https://github.com/coinbase/rest-hooks/blob/master/packages/test/CHANGELOG.md#700-2021-09-08)
