---
'@data-client/rest': patch
---

Bundle `path-to-regexp` as tree-shaken ESM

Bundle only the functions we use (`compile`, `parse`, `pathToRegexp`) from
`path-to-regexp` into the ESM/browser build via rollup. This eliminates
the CJS/ESM boundary that broke StackBlitz WebContainers and reduces bundle
size by tree-shaking unused exports (`match`, `stringify`, and the `ID` regex).
