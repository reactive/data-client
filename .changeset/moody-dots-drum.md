---
'@data-client/rest': minor
---

RestEndpoint.path and Resource.path syntax updated

Upgrading path-to-regexp from 6 to 8.
- https://github.com/pillarjs/path-to-regexp/releases/tag/v8.0.0
- https://github.com/pillarjs/path-to-regexp/releases/tag/v7.0.0

BREAKING CHANGES:
- /:optional? -> {/:optional}
- /:repeating+ -> /*repeating
- /:repeating* -> {/*repeating}
- `(`, `)`, `[`, `]` must be escaped `"\\("`
  - `()[]{}*:;,!@` are all characters that need escaping
- /:with-dash -> /:"with-dash"
