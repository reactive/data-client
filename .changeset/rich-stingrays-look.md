---
'@data-client/react': minor
---

Call fetches immediately - do not wait for idle

[NetworkManager](https://dataclient.io/docs/api/NetworkManager) will fetch
immediately, rather than waiting for idle. With React 18+ it is expected for
React to better handle work with concurrent mode and batching. Due to this, it
is not longer deemed the best performance to wait for idle and instead we should
fetch immediately.

`IdlingNetworkManager` is still available to keep the previous behavior.