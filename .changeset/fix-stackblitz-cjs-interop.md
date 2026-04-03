---
'@data-client/rest': patch
---

Fix StackBlitz WebContainers compatibility with path-to-regexp

Use namespace import (`import *`) instead of named imports for the CJS
`path-to-regexp` dependency. Named imports trigger webpack's per-export
presence validation, which fails in StackBlitz's WebContainers environment.
Namespace imports defer property access to runtime, bypassing the check
with no tree-shaking loss.
