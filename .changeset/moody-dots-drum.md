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
- /:id(\d+) -> /:id (custom regex removed)
- /:with-dash -> /:"with-dash"
- `(`, `)`, `[`, `]`, `+`, `?`, `!` must be escaped `"\\("`
  - `{}()[]+?!:*\` are all characters that need escaping

Migrate using:
`npx skills add https://github.com/reactive/data-client --skill path-to-regexp-v8-migration`