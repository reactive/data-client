---
'@rest-hooks/core': patch
'@rest-hooks/react': patch
---

Fix: SSR previously would never unsuspend cache provider
(NetworkManager.allSettled() must return undefined if nothing in flight)
