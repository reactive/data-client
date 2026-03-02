---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Add `globalThis.__DC_CONTROLLERS__` Map in dev mode for programmatic store access from browser DevTools MCP, React Native debuggers, and other development tooling.

Each [DataProvider](/docs/api/DataProvider) registers its [Controller](/docs/api/Controller) keyed by the devtools connection name, supporting multiple providers on the same page.
