---
'@data-client/core': patch
---

GCPolicy interval no longer blocks Node.js process exit

Call `.unref()` on GCPolicy's `setInterval` in Node.js environments, preventing the GC sweep timer from keeping Jest workers or other Node.js processes alive.
