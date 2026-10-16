---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix stores with the same devtools name hiding each other in `__DC_CONTROLLERS__`

With two `DataProvider`s, or two Vue apps using `DataClientPlugin`, on one page and the default devtools name, the
second store replaced the first in `globalThis.__DC_CONTROLLERS__`, so debugging tools and coding agents could only find one. The second now
registers as `'Data Client: My App (2)'`, the next as `(3)`, and so on.
