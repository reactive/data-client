---
'@data-client/img': patch
---

Load the ESM build of `@data-client/img` from Node `import`

Node's `import` (and tools that run on it, like Vitest) loaded the CommonJS build. It now loads the ESM build;
`require()` still gets CommonJS.
